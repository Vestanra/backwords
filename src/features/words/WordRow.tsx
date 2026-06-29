import type { Word, WordStatus } from '../../types'
import { AudioButton } from './AudioButton'
import styles from './WordList.module.css'

const STATUSES: WordStatus[] = ['new', 'learning', 'learned']

interface Props {
  word: Word
  busy: boolean
  onStatusChange: (id: string, status: WordStatus) => void
  onDelete: (word: Word) => void
}

export function WordRow({ word, busy, onStatusChange, onDelete }: Props) {
  const firstDef = word.definitions[0]?.definitions[0]?.definition

  return (
    <li className={styles.row}>
      <div className={styles.main}>
        <div className={styles.head}>
          <span className={styles.term}>{word.term}</span>
          {word.ipa && <span className={styles.ipa}>{word.ipa}</span>}
          <AudioButton url={word.audio_url} label={`Play ${word.term}`} />
        </div>
        {firstDef && <p className={styles.def}>{firstDef}</p>}
      </div>

      <div className={styles.actions}>
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
          className={styles.delete}
          disabled={busy}
          aria-label={`Delete ${word.term}`}
          onClick={() => onDelete(word)}
        >
          🗑
        </button>
      </div>
    </li>
  )
}
