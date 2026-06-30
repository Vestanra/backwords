import { useMemo, useState } from 'react'
import type { Word, WordStatus } from '../../types'
import type { WordEdits } from './wordsApi'
import { WordRow } from './WordRow'
import styles from './WordList.module.css'

type Filter = 'all' | 'new' | 'learning' | 'learned' | 'due'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'learning', label: 'Learning' },
  { key: 'learned', label: 'Learned' },
  { key: 'due', label: 'To repeat' },
]

/** "To repeat" is derived: a word is due when its next review time has passed. */
function isDue(word: Word): boolean {
  return word.next_review_at != null && new Date(word.next_review_at).getTime() <= Date.now()
}

function matches(word: Word, filter: Filter): boolean {
  switch (filter) {
    case 'all':
      return true
    case 'due':
      return isDue(word)
    default:
      return word.status === filter
  }
}

interface Props {
  words: Word[]
  loading: boolean
  error: string | null
  busyId: string | null
  onStatusChange: (id: string, status: WordStatus) => void
  onEdit: (id: string, edits: WordEdits) => void
  onDelete: (word: Word) => void
}

export function WordList({ words, loading, error, busyId, onStatusChange, onEdit, onDelete }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const visible = useMemo(() => words.filter((w) => matches(w, filter)), [words, filter])

  if (loading) return <p className={styles.muted}>Loading your words…</p>
  if (error) return <p className={styles.error}>{error}</p>

  return (
    <section className={styles.wrap}>
      <nav className={styles.tabs}>
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            className={f.key === filter ? styles.tabActive : styles.tab}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </nav>

      {visible.length === 0 ? (
        <p className={styles.muted}>
          {words.length === 0 ? 'No words yet — look one up above.' : 'Nothing in this group.'}
        </p>
      ) : (
        <ul className={styles.list}>
          {visible.map((w) => (
            <WordRow
              key={w.id}
              word={w}
              busy={busyId === w.id}
              onStatusChange={onStatusChange}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
