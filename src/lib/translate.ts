import { supabase } from './supabase'

interface TranslateResponse {
  translation?: string | null
}

/**
 * Translate an English word/phrase to Ukrainian via the `translate` Edge
 * Function, which calls Gemini server-side (the API key never reaches the
 * browser). Passing the definition lets Gemini pick the right sense for
 * polysemous words and phrasal verbs.
 *
 * Best-effort: any failure (not signed in, quota exhausted, network) resolves
 * to null so a translation hiccup never blocks the lookup or the save — the
 * user can still type the translation by hand.
 */
export async function translate(rawTerm: string, definition?: string): Promise<string | null> {
  const term = rawTerm.trim()
  if (!term) return null

  // Attach the signed-in user's token explicitly. invoke() defaults to the anon
  // key, which the function's getUser() gate rejects — so without this the call
  // comes back 401 Unauthorized.
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return null

  try {
    const { data, error } = await supabase.functions.invoke<TranslateResponse>('translate', {
      body: { term, definition: definition ?? '' },
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (error) return null
    return data?.translation?.trim() || null
  } catch {
    return null
  }
}
