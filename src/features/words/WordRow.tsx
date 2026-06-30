import { useState } from 'react'
import type { Word, WordStatus } from '../../types'
import type { WordEdits } from './wordsApi'
import { AudioButton } from './AudioButton'
import styles from './WordList.module.css'

const STATUSES: WordStatus[] = ['new', 'learning', 'learned']

interface Props {
  word: Word
  busy: boolean
  onStatusChange: (id: string, status: WordStatus) => void
  onEdit: (id: string, edits: WordEdits) => void
  onDelete: (word: Word) => void
}

export function WordRow({ word, busy, onStatusChange, onEdit, onDelete }: Props) {
  const firstDef = word.definitions[0]?.definitions[0]?.definition
  const [editing, setEditing] = useState(false)
  const [translation, setTranslation] = useState(word.translation ?? '')
  const [note, setNote] = useState(word.note ?? '')

  function startEdit() {
    // Seed inputs from the current values each time, in case they changed.
    setTranslation(word.translation ?? '')
    setNote(word.note ?? '')
    setEditing(true)
  }

  function save() {
    onEdit(word.id, {
      translation: translation.trim() || null,
      note: note.trim() || null,
    })
    setEditing(false)
  }

  return (
    <li className={styles.row}>
      <div className={styles.main}>
        <div className={styles.head}>
          <span className={styles.term}>{word.term}</span>
          {word.ipa && <span className={styles.ipa}>{word.ipa}</span>}
          <AudioButton url={word.audio_url} label={`Play ${word.term}`} />
        </div>

        {editing ? (
          <div className={styles.editForm}>
            <input
              type="text"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Translation (uk)"
              aria-label={`Translation of ${word.term}`}
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note (optional)"
              aria-label={`Note for ${word.term}`}
              rows={2}
            />
            <div className={styles.editActions}>
              <button type="button" onClick={save} disabled={busy}>
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {word.translation && <p className={styles.translation}>{word.translation}</p>}
            {firstDef && <p className={styles.def}>{firstDef}</p>}
            {word.note && <p className={styles.note}>{word.note}</p>}
          </>
        )}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.icon}
          disabled={busy || editing}
          aria-label={`Edit ${word.term}`}
          onClick={startEdit}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <select
          value={word.status}
          disabled={busy}
          aria-label={`Status of ${word.term}`}
          onChange={(e) => onStatusChange(word.id, e.target.value as WordStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          type="button"
          className={styles.icon}
          disabled={busy}
          aria-label={`Delete ${word.term}`}
          onClick={() => onDelete(word)}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="M19 6l-1 14H6L5 6" />
          </svg>
        </button>
      </div>
    </li>
  )
}
