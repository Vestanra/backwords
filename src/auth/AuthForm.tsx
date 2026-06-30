import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './auth-context'
import styles from './AuthForm.module.css'

type Mode = 'signin' | 'signup'

export function AuthForm() {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error, needsConfirmation } = await signUp(email, password)
        if (error) setError(error)
        else if (needsConfirmation)
          setNotice('Check your email to confirm your account, then sign in.')
      } else {
        const { error } = await signIn(email, password)
        if (error) setError(error)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>BackWords 🪺</h1>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            minLength={6}
            required
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}
        {notice && <p className={styles.notice}>{notice}</p>}

        <button type="submit" disabled={busy}>
          {busy ? '…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
        </button>
      </form>

      <button
        type="button"
        className={styles.toggle}
        onClick={() => {
          setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
          setError(null)
          setNotice(null)
        }}
      >
        {mode === 'signin'
          ? "No account? Sign up"
          : 'Already have an account? Sign in'}
      </button>
    </main>
  )
}
