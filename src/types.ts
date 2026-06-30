// Domain types shared across the app.

export type WordStatus = 'new' | 'learning' | 'learned'

/** One sense of a word: a definition plus an optional example sentence. */
export interface Definition {
  definition: string
  example?: string
}

/** A part of speech (noun, verb, …) with its definitions. */
export interface Meaning {
  partOfSpeech: string
  definitions: Definition[]
}

/**
 * Result of a dictionary lookup, before it is saved. Mirrors the columns we
 * persist so saving is a direct map (plus server-side defaults).
 */
export interface WordPreview {
  term: string
  ipa: string | null
  audioUrl: string | null
  meanings: Meaning[]
}

/** A row of `public.words`. `definitions` stores the normalized `Meaning[]`. */
export interface Word {
  id: string
  user_id: string
  term: string
  ipa: string | null
  audio_url: string | null
  definitions: Meaning[]
  status: WordStatus
  box: number
  last_reviewed_at: string | null
  next_review_at: string | null
  times_seen: number
  times_correct: number
  created_at: string
}
