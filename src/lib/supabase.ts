import { createClient } from '@supabase/supabase-js'

// Read once, fail fast: a missing env var is a setup mistake we want to catch
// immediately (with a clear message) rather than as a cryptic runtime error.
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (Supabase → Project Settings → API).',
  )
}

// Single shared client. Creating more than one triggers supabase-js warnings
// about multiple GoTrueClient instances sharing the same storage key.
export const supabase = createClient(url, anonKey)
