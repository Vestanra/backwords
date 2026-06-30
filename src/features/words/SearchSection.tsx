import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Word, WordPreview } from '../../types'
import { lookup } from '../../lib/dictionary'
import { addWord, DuplicateWordError } from './wordsApi'
import { AudioButton } from './AudioButton'
import styles from './SearchSection.module.css'

type LookupState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'found'; preview: WordPreview }
  | { kind: 'notfound'; term: string }
  | { kind: 'error'; message: string }

interface Props {
  /** Called after a word is successfully saved, with the stored row. */
  onAdded: (word: Word) => void
}

export function SearchSection({ onAdded }: Props) {
  const [term, setTerm] = useState('')
  const [state, setState] = useState<LookupState>({ kind: 'idle' })
  const [adding, setAdding] = useState(false)
  const [addMessage, setAddMessage] = useState<string | null>(null)

  // Lookup on submit (not on every keystroke): dictionaryapi.dev matches whole
  // words, so per-letter lookups would mostly 404 and waste requests.
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = term.trim()
    if (!trimmed) return
    setAddMessage(null)
    setState({ kind: 'loading' })
    try {
      const preview = await lookup(trimmed)
      setState(preview ? { kind: 'found', preview } : { kind: 'notfound', term: trimmed })
    } catch (err) {
      setState({ kind: 'error', message: err instanceof Error ? err.message : 'Lookup failed.' })
    }
  }

  async function handleAdd(preview: WordPreview) {
    setAdding(true)
    setAddMessage(null)
    try {
      const word = await addWord(preview)
      onAdded(word)
      setAddMessage(`Added "${word.term}".`)
      setState({ kind: 'idle' })
      setTerm('')
    } catch (err) {
      setAddMessage(
        err instanceof DuplicateWordError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Could not save the word.',
      )
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className={styles.section}>
      <form className={styles.search} onSubmit={handleSubmit}>
        <input
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Type an English word…"
          aria-label="Word to look up"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button type="submit" disabled={state.kind === 'loading'}>
          {state.kind === 'loading' ? '…' : 'Look up'}
        </button>
      </form>

      {state.kind === 'notfound' && (
        <p className={styles.muted}>No definitions found for “{state.term}”.</p>
      )}
      {state.kind === 'error' && <p className={styles.error}>{state.message}</p>}

      {state.kind === 'found' && (
        <article className={styles.card}>
          <header className={styles.cardHead}>
            <h2 className={styles.term}>{state.preview.term}</h2>
            {state.preview.ipa && <span className={styles.ipa}>{state.preview.ipa}</span>}
            <AudioButton url={state.preview.audioUrl} />
          </header>

          {state.preview.meanings.map((m, i) => (
            <div key={i} className={styles.meaning}>
              <h3 className={styles.pos}>{m.partOfSpeech}</h3>
              <ol className={styles.defs}>
                {m.definitions.map((d, j) => (
                  <li key={j}>
                    {d.definition}
                    {d.example && <span className={styles.example}>“{d.example}”</span>}
                  </li>
                ))}
              </ol>
            </div>
          ))}

          <button type="button" onClick={() => handleAdd(state.preview)} disabled={adding}>
            {adding ? 'Adding…' : 'Add to my words'}
          </button>
        </article>
      )}

      {addMessage && <p className={styles.muted}>{addMessage}</p>}
    </section>
  )
}
