import { supabase } from '../../lib/supabase'
import type { Word, WordPreview, WordStatus } from '../../types'

/** Thrown when the word already exists for this user (unique(user_id, term)). */
export class DuplicateWordError extends Error {
  constructor(public term: string) {
    super(`"${term}" is already in your list.`)
    this.name = 'DuplicateWordError'
  }
}

const PG_UNIQUE_VIOLATION = '23505'

/**
 * Insert a looked-up word. `user_id` is omitted on purpose — the column
 * defaults to auth.uid() server-side, which is also what the RLS insert check
 * requires. Returns the stored row.
 */
export async function addWord(preview: WordPreview): Promise<Word> {
  const { data, error } = await supabase
    .from('words')
    .insert({
      term: preview.term,
      ipa: preview.ipa,
      audio_url: preview.audioUrl,
      definitions: preview.meanings,
      translation: preview.translation,
      note: preview.note,
    })
    .select()
    .single()

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      throw new DuplicateWordError(preview.term)
    }
    throw error
  }
  return data as Word
}

/** All of the current user's words, newest first. RLS scopes to the owner. */
export async function listWords(): Promise<Word[]> {
  const { data, error } = await supabase
    .from('words')
    .select()
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as Word[]
}

export async function updateStatus(id: string, status: WordStatus): Promise<void> {
  const { error } = await supabase.from('words').update({ status }).eq('id', id)
  if (error) throw error
}

/** User-editable fields of a saved word. The dictionary data stays read-only. */
export interface WordEdits {
  translation: string | null
  note: string | null
}

export async function updateWord(id: string, edits: WordEdits): Promise<void> {
  const { error } = await supabase.from('words').update(edits).eq('id', id)
  if (error) throw error
}

export async function deleteWord(id: string): Promise<void> {
  const { error } = await supabase.from('words').delete().eq('id', id)
  if (error) throw error
}
