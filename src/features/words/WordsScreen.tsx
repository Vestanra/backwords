import { useEffect, useState } from 'react'
import type { Word, WordStatus } from '../../types'
import { useAuth } from '../../auth/auth-context'
import { deleteWord, listWords, updateStatus, updateWord } from './wordsApi'
import type { WordEdits } from './wordsApi'
import { SearchSection } from './SearchSection'
import { WordList } from './WordList'
import styles from './WordsScreen.module.css'

export function WordsScreen() {
  const { user, signOut } = useAuth()
  const [words, setWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listWords()
      .then((rows) => active && setWords(rows))
      .catch((err) => active && setError(err instanceof Error ? err.message : 'Failed to load words.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  function handleAdded(word: Word) {
    setWords((prev) => [word, ...prev])
  }

  async function handleStatusChange(id: string, status: WordStatus) {
    const prev = words
    // Optimistic: reflect the change immediately, roll back if the write fails.
    setWords((ws) => ws.map((w) => (w.id === id ? { ...w, status } : w)))
    setBusyId(id)
    try {
      await updateStatus(id, status)
    } catch (err) {
      setWords(prev)
      setError(err instanceof Error ? err.message : 'Failed to update status.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleEdit(id: string, edits: WordEdits) {
    const prev = words
    // Optimistic, mirroring handleStatusChange: show the edit, roll back on error.
    setWords((ws) => ws.map((w) => (w.id === id ? { ...w, ...edits } : w)))
    setBusyId(id)
    try {
      await updateWord(id, edits)
    } catch (err) {
      setWords(prev)
      setError(err instanceof Error ? err.message : 'Failed to save changes.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(word: Word) {
    if (!window.confirm(`Delete "${word.term}" from your words?`)) return
    setBusyId(word.id)
    try {
      await deleteWord(word.id)
      setWords((ws) => ws.filter((w) => w.id !== word.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete word.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>BackWords</h1>
        <div className={styles.account}>
          <span className={styles.email}>{user?.email}</span>
          <button type="button" onClick={() => signOut()}>
            Sign out
          </button>
        </div>
      </header>

      <SearchSection onAdded={handleAdded} />

      <WordList
        words={words}
        loading={loading}
        error={error}
        busyId={busyId}
        onStatusChange={handleStatusChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </main>
  )
}
