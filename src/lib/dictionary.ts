import type { Meaning, WordPreview } from '../types'

// Shape of the relevant bits of a dictionaryapi.dev v2 entry. The real payload
// has more fields (synonyms, antonyms, sourceUrls…) we don't need yet.
interface RawPhonetic {
  text?: string
  audio?: string
}
interface RawDefinition {
  definition: string
  example?: string
}
interface RawMeaning {
  partOfSpeech: string
  definitions: RawDefinition[]
}
interface RawEntry {
  word: string
  phonetic?: string
  phonetics?: RawPhonetic[]
  meanings?: RawMeaning[]
}

const API_BASE = 'https://api.dictionaryapi.dev/api/v2/entries/en'

/** lowercase + collapse internal/edge whitespace. Matches how we store `term`. */
export function normalizeTerm(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Protocol-relative URLs (`//ssl…`) → absolute https. Returns null for empty. */
function normalizeAudioUrl(audio: string | undefined): string | null {
  if (!audio) return null
  return audio.startsWith('//') ? `https:${audio}` : audio
}

function toPreview(term: string, entries: RawEntry[]): WordPreview {
  let ipa: string | null = null
  let audioUrl: string | null = null
  const meanings: Meaning[] = []

  for (const entry of entries) {
    if (!ipa && entry.phonetic) ipa = entry.phonetic
    for (const p of entry.phonetics ?? []) {
      if (!ipa && p.text) ipa = p.text
      if (!audioUrl) audioUrl = normalizeAudioUrl(p.audio)
    }
    for (const m of entry.meanings ?? []) {
      meanings.push({
        partOfSpeech: m.partOfSpeech,
        definitions: (m.definitions ?? []).map((d) => ({
          definition: d.definition,
          example: d.example,
        })),
      })
    }
  }

  return { term, ipa, audioUrl, meanings }
}

/**
 * Look a word up in dictionaryapi.dev.
 * Returns null when the word has no entry (API responds 404) so callers can
 * show a clean "not found" instead of treating it as an error. Network / other
 * HTTP failures throw.
 */
export async function lookup(
  rawTerm: string,
  signal?: AbortSignal,
): Promise<WordPreview | null> {
  const term = normalizeTerm(rawTerm)
  if (!term) return null

  const res = await fetch(`${API_BASE}/${encodeURIComponent(term)}`, { signal })

  if (res.status === 404) return null
  if (!res.ok) {
    throw new Error(`Dictionary lookup failed (HTTP ${res.status}).`)
  }

  const data: RawEntry[] = await res.json()
  if (!Array.isArray(data) || data.length === 0) return null

  return toPreview(term, data)
}
