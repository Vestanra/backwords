// Supabase Edge Function: translate an English word/phrase to Ukrainian via
// Gemini. The Gemini API key lives ONLY here (server-side env), never in the
// browser bundle — this is the whole reason the call goes through a function.
//
// Auth: deployed with --no-verify-jwt so we control CORS ourselves, then we
// require a real signed-in user via getUser(). (Plain verify_jwt would also
// accept the public anon key, which everyone has — that is not real access
// control. The getUser() check rejects anon / no token.)

import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = 'gemini-2.5-flash-lite'
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  // CORS preflight — must answer before any auth, or the browser blocks the call.
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  // Require a signed-in user. SUPABASE_URL / SUPABASE_ANON_KEY are injected by
  // the platform; the user's token arrives in the Authorization header.
  const authHeader = req.headers.get('Authorization') ?? ''
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return json({ error: 'Unauthorized' }, 401)

  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) return json({ error: 'Server is missing GEMINI_API_KEY' }, 500)

  let term = ''
  let definition = ''
  try {
    const body = await req.json()
    term = typeof body?.term === 'string' ? body.term.trim() : ''
    definition = typeof body?.definition === 'string' ? body.definition.trim() : ''
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }
  if (!term) return json({ error: 'Missing "term"' }, 400)

  const prompt =
    'Translate the English word or phrase into Ukrainian. ' +
    'Use the definition (if given) to choose the correct sense. ' +
    'Return ONLY the Ukrainian translation — no quotes, no English, no explanation. ' +
    'If several common equivalents exist, separate them with commas.\n\n' +
    `Word: ${term}\n` +
    (definition ? `Definition: ${definition}\n` : '')

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 100 },
      }),
    })

    if (!res.ok) {
      // 429 = free-tier quota exhausted. Either way the client treats a null
      // translation as "type it yourself", so we never hard-fail the UI. We
      // include Google's message (truncated) to make quota/model issues visible.
      const detail = (await res.text()).slice(0, 400)
      return json({ translation: null, error: `Gemini HTTP ${res.status}`, detail }, 200)
    }

    const data = await res.json()
    const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text
    return json({ translation: text?.trim() || null })
  } catch (err) {
    return json({ translation: null, error: String(err) }, 200)
  }
})
