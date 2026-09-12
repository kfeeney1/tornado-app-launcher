import { useEffect, useRef, useState } from 'react'
import Brand from '../components/Brand.jsx'
import { useAuth } from './AuthContext.jsx'

const authViews = new Set(['sign-in', 'sign-up', 'reset'])
const rootState = { tornadoAuth: true, tornadoAuthView: 'sign-in' }

const isEmail = value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
const isStrongEnough = value => value.length >= 8 && /[A-Za-z]/.test(value) && /\d/.test(value)

export function AuthLoading() {
  return (
    <div className="app dark">
      <main className="startup" aria-busy="true" aria-label="Loading Tornado account">
        <div className="startup-vortex" aria-hidden="true">◒</div>
        <h1>Tornado</h1>
        <p>Loading your account…</p>
      </main>
    </div>
  )
}

export default function AuthScreen() {
  const { signIn, signUp, resetPassword, initializationError } = useAuth()
  const [view, setView] = useState(() => authViews.has(window.history.state?.tornadoAuthView)
    ? window.history.state.tornadoAuthView
    : 'sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const errorRef = useRef(null)
  const visibleError = error || initializationError

  useEffect(() => {
    if (!window.history.state?.tornadoAuth) {
      window.history.replaceState({
        ...window.history.state,
        tornadoAuthExitBoundary: true,
        tornadoAuthView: 'sign-in',
      }, '')
      window.history.pushState(rootState, '')
    }

    const onPopState = event => {
      if (event.state?.tornadoAuthExitBoundary) {
        const shouldExit = window.confirm('Exit Tornado?')
        if (shouldExit) {
          window.history.back()
          return
        }
        window.history.pushState(rootState, '')
        setView('sign-in')
        return
      }

      const nextView = authViews.has(event.state?.tornadoAuthView) ? event.state.tornadoAuthView : 'sign-in'
      setView(nextView)
      setError('')
      setMessage('')
    }

    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (visibleError) errorRef.current?.focus()
  }, [visibleError])

  const navigate = nextView => {
    if (!authViews.has(nextView) || nextView === view) return
    window.history.pushState({ tornadoAuth: true, tornadoAuthView: nextView }, '')
    setView(nextView)
    setError('')
    setMessage('')
    setPassword('')
    setConfirmPassword('')
  }

  const validateEmail = () => {
    if (!isEmail(email.trim())) {
      setError('Please enter a valid email address.')
      return false
    }
    return true
  }

  const handleSignIn = async event => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!validateEmail()) return
    if (!password) {
      setError('Please enter your password.')
      return
    }

    setSubmitting(true)
    try {
      await signIn(email.trim(), password)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignUp = async event => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!validateEmail()) return
    if (!isStrongEnough(password)) {
      setError('Use at least 8 characters with letters and numbers.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setSubmitting(true)
    try {
      await signUp(email.trim(), password)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReset = async event => {
    event.preventDefault()
    setError('')
    setMessage('')
    if (!validateEmail()) return

    setSubmitting(true)
    try {
      await resetPassword(email.trim())
      setMessage('If an account exists for that email address, a reset email has been sent.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app dark auth-shell">
      <main className="auth-layout">
        <section className="auth-brand-panel" aria-label="Tornado">
          <Brand />
          <p className="eyebrow">TORNADO ACCOUNT</p>
          <h1>{view === 'sign-up' ? 'Create your Tornado account' : view === 'reset' ? 'Reset your password' : 'Welcome back'}</h1>
          <p>Your launcher stays local in Phase 1. Signing in establishes your Tornado identity without changing this device’s apps, games or appearance settings.</p>
        </section>

        <section className="auth-card">
          {view === 'sign-in' && (
            <form onSubmit={handleSignIn} noValidate>
              <h2>Sign in</h2>
              <p className="auth-intro">Use your Tornado email and password.</p>
              <AuthMessages error={visibleError} message={message} errorRef={errorRef} />
              <EmailField value={email} onChange={setEmail} />
              <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="current-password" />
              <button className="primary-action" type="submit" disabled={submitting || Boolean(initializationError)}>
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
              <button className="text-action" type="button" onClick={() => navigate('reset')}>Forgot password?</button>
              <p className="auth-switch">New to Tornado? <button type="button" onClick={() => navigate('sign-up')}>Create account</button></p>
            </form>
          )}

          {view === 'sign-up' && (
            <form onSubmit={handleSignUp} noValidate>
              <h2>Create account</h2>
              <p className="auth-intro">Create one Tornado identity for this and future clients.</p>
              <AuthMessages error={visibleError} message={message} errorRef={errorRef} />
              <EmailField value={email} onChange={setEmail} />
              <PasswordField label="Password" value={password} onChange={setPassword} autoComplete="new-password" />
              <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
              <p className="field-help">Use at least 8 characters with letters and numbers.</p>
              <button className="primary-action" type="submit" disabled={submitting || Boolean(initializationError)}>
                {submitting ? 'Creating account…' : 'Create Account'}
              </button>
              <p className="auth-switch">Already have an account? <button type="button" onClick={() => navigate('sign-in')}>Sign in</button></p>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleReset} noValidate>
              <h2>Forgot password?</h2>
              <p className="auth-intro">Enter your email and we’ll send reset instructions when possible.</p>
              <AuthMessages error={visibleError} message={message} errorRef={errorRef} />
              <EmailField value={email} onChange={setEmail} />
              <button className="primary-action" type="submit" disabled={submitting || Boolean(initializationError)}>
                {submitting ? 'Sending…' : 'Send Reset Email'}
              </button>
              <p className="auth-switch"><button type="button" onClick={() => navigate('sign-in')}>Back to sign in</button></p>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}

function AuthMessages({ error, message, errorRef }) {
  return (
    <>
      {error && <div className="auth-message error" role="alert" tabIndex="-1" ref={errorRef}>{error}</div>}
      {message && <div className="auth-message success" role="status">{message}</div>}
    </>
  )
}

function EmailField({ value, onChange }) {
  return (
    <label className="auth-field">
      <span>Email</span>
      <input
        type="email"
        value={value}
        onChange={event => onChange(event.target.value)}
        autoComplete="email"
        inputMode="email"
        required
      />
    </label>
  )
}

function PasswordField({ label, value, onChange, autoComplete }) {
  return (
    <label className="auth-field">
      <span>{label}</span>
      <input
        type="password"
        value={value}
        onChange={event => onChange(event.target.value)}
        autoComplete={autoComplete}
        required
      />
    </label>
  )
}
