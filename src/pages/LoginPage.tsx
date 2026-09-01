import { useEffect, useState, type FormEvent } from 'react'
import { Link, navigate } from '../App'
import { useAuth } from '../lib/auth'

function nextPath(search: string) {
  const raw = new URLSearchParams(search).get('next') ?? '/'
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/'
  return raw
}

export function LoginPage({ search = '' }: { search?: string }) {
  const { configured, user, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const next = nextPath(search)

  useEffect(() => {
    if (user) navigate(next)
  }, [user, next])

  if (user) return null

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setBusy(true)
    const message = mode === 'in' ? await signIn(email, password) : await signUp(email, password)
    setBusy(false)
    if (message) {
      setError(message)
      return
    }
    navigate(next)
  }

  return (
    <article className="page">
      <h1>{mode === 'in' ? 'Sign in' : 'Create account'}</h1>
      <p className="lead">
        Sign in to highlight, bookmark, and keep your notes. You stay signed in on this device until
        you tap Sign out.
      </p>
      {!configured && (
        <p>Sign-in is not available on this copy of the app. The Bible and reference notes still work.</p>
      )}
      {configured && (
        <form className="auth-form" onSubmit={(e) => void submit(e)}>
          <label className="mark-field">
            Email
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="mark-field">
            Password
            <input
              type="password"
              autoComplete={mode === 'in' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button type="submit" className="mark-action" disabled={busy || !email.trim() || password.length < 6}>
            {mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      )}
      {configured && (
        <p>
          {mode === 'in' ? (
            <button type="button" className="text-link" onClick={() => setMode('up')}>
              Create an account
            </button>
          ) : (
            <button type="button" className="text-link" onClick={() => setMode('in')}>
              I already have an account
            </button>
          )}
        </p>
      )}
      <p className="fine">
        Passwords are stored by Supabase Auth, not in this app. Closing a tab, closing the browser,
        or letting an iPad sleep does not sign you out.
      </p>
      <p>
        <Link to="/">Back to the Bible</Link>
      </p>
    </article>
  )
}
