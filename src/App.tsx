import { useAuth } from './auth/auth-context'
import { AuthForm } from './auth/AuthForm'
import { WordsScreen } from './features/words/WordsScreen'
import styles from './App.module.css'

function App() {
  const { session, loading } = useAuth()

  if (loading) return <p className={styles.loading}>Loading…</p>
  return session ? <WordsScreen /> : <AuthForm />
}

export default App
