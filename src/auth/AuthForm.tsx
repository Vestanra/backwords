import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from './auth-context'
import styles from './AuthForm.module.css'

// Sign-in only. Registration is closed (Supabase Auth → sign-ups OFF); accounts
// are created by hand for the few people who use this. Hiding the UI is only
// cosmetic — the real gate is the Supabase setting.
export function AuthForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    try {
      const { error } = await signIn(email, password)
      if (error) setError(error)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className={styles.wrap}>
      <h1 className={styles.title}>BackWords</h1>
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
            autoComplete="current-password"
            minLength={6}
            required
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" disabled={busy}>
          {busy ? '…' : 'Sign in'}
        </button>
      </form>
    </main>
  )
}
