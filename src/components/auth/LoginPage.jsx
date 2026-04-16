import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, Shield } from 'lucide-react'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    // Small delay for feel
    await new Promise((r) => setTimeout(r, 400))
    const result = login(email.trim(), password)
    if (!result.success) {
      setError(result.error)
    }
    setLoading(false)
  }

  const demoAccounts = [
    { label: 'Barry (Admin)', email: 'barry@herronconsultantslimited.co.uk', password: 'HCL2026' },
    { label: 'John Colton (Client)', email: 'john@coltonjef.co.uk', password: 'client2026' },
    { label: 'Malcolm (Broker)', email: 'malcolm@coversure.co.uk', password: 'broker2026' },
  ]

  const fillDemo = (account) => {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
  }

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center p-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #C9A84C 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Header / Branding */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-gold flex items-center justify-center">
              <span className="text-navy font-bold text-lg tracking-tight">HCL</span>
            </div>
          </div>
          <h1 className="text-white text-2xl font-semibold tracking-tight">
            Herron Consultants Limited
          </h1>
          <p className="text-white/50 text-sm mt-1 tracking-wide uppercase">
            Client Governance Portal
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-premium-lg overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-gold to-gold/60" />

          <div className="p-8">
            <h2 className="text-navy text-xl font-semibold mb-1">Sign in</h2>
            <p className="text-gray-500 text-sm mb-6">
              Access your governance dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors text-sm"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 text-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-colors text-sm pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-navy text-white font-medium py-3 rounded-lg hover:bg-navy-50 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Signing in…
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>
            </form>
          </div>

          {/* Demo accounts */}
          <div className="px-8 pb-8">
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-3">
                Demo accounts
              </p>
              <div className="space-y-2">
                {demoAccounts.map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="w-full text-left px-3 py-2.5 rounded-lg border border-gray-100 hover:border-gold/50 hover:bg-gold/5 transition-colors group"
                  >
                    <span className="text-sm font-medium text-navy group-hover:text-gold transition-colors">
                      {acc.label}
                    </span>
                    <span className="block text-xs text-gray-400 mt-0.5">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 mt-6 text-white/30 text-xs">
          <Shield size={12} />
          <span>HCL provides non-advised governance services only</span>
        </div>
      </div>
    </div>
  )
}
