import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { rawRequest } from '../api'
import AuthForm from '../components/AuthForm'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const res = await rawRequest('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: { token, newPassword },
    })
    setBusy(false)
    if (res.ok) {
      navigate('/login')
    } else {
      setError('This reset link is invalid or has expired. Request a new one.')
    }
  }

  return (
    <AuthForm
      title="Choose a new password"
      footer={
        <Link to="/forgot-password" className="text-indigo-600 hover:underline">
          Request a new link
        </Link>
      }
    >
      {!token ? (
        <p className="text-sm text-red-700">Missing reset token. Use the link from your email.</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          <input
            type="password"
            required
            minLength={8}
            placeholder="New password (min 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {busy ? 'Updating…' : 'Update password'}
          </button>
        </form>
      )}
    </AuthForm>
  )
}
