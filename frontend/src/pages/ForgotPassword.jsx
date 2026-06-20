import { useState } from 'react'
import { Link } from 'react-router-dom'
import { rawRequest } from '../api'
import AuthForm from '../components/AuthForm'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    // Always show the same confirmation (the API never reveals whether the email exists).
    await rawRequest('/api/auth/password-reset/request', { method: 'POST', body: { email } })
    setSent(true)
    setBusy(false)
  }

  return (
    <AuthForm
      title="Reset password"
      footer={
        <Link to="/login" className="text-indigo-600 hover:underline">
          Back to login
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-slate-600">
          If an account exists for <strong>{email}</strong>, a reset link has been sent.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Your account email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
    </AuthForm>
  )
}
