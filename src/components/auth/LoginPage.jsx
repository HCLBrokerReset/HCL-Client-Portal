import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'

const DEMO_ACCOUNTS = [
  {
    label: 'Barry Admin',
    role: 'Administrator',
    email: 'barry@herronconsultantslimited.co.uk',
    password: 'HCL2026',
    gradient: 'bg-hcl-gold',
    textColor: 'text-navy',
  },
  {
    label: 'John Client',
    role: 'Colton JEF',
    email: 'john@coltonjef.co.uk',
    password: 'client2026',
    gradient: 'bg-btn-primary',
    textColor: 'text-white',
  },
  {
    label: 'Malcolm Broker',
    role: 'Coversure',
    email: 'malcolm@coversure.co.uk',
    password: 'broker2026',
    gradient: 'bg-btn-alert',
    textColor: 'text-white',
  },
]

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
    await new Promise(r => setTimeout(r, 350))
    const result = login(email.trim(), password)
    if (!result.success) setError(result.error)
    setLoading(false)
  }

  const fill = (acc) => {
    setEmail(acc.email)
    setPassword(acc.password)
    setError('')
  }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-4"
      style={{ background: 'radial-gradient(circle at top, #335dff 0%, #0d1b2a 38%, #07111f 100%)' }}>

      <div className="w-full max-w-[430px] animate-fade-in">
        {/* Hero card */}
        <div className="rounded-[30px] bg-[linear-gradient(135deg,#0D1B2A,#2447F9,#3BC9F5)] p-6 text-white shadow-hero mb-4">
          <span className="glass-pill">Private client access</span>
          <h1 className="mt-4 text-3xl font-bold leading-tight">
            Insurance governance,<br />but it actually feels<br />like an app.
          </h1>
          <p className="mt-2 text-sm text-white/80">
            Fast check-ins. Live flags. Proper client oversight.
          </p>
        </div>

        {/* Sign in card */}
        <div className="card p-5 mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Sign in</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Use one of the demo accounts below, or enter credentials
          </p>

          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="Email address"
              className="w-full rounded-[20px] border-0 bg-slate-100 px-4 py-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-royal/30 dark:bg-white/5 dark:text-white"
            />
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Password"
                className="w-full rounded-[20px] border-0 bg-slate-100 px-4 py-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-royal/30 dark:bg-white/5 dark:text-white pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {error && (
              <div className="rounded-2xl bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Opening portal…
                </span>
              ) : (
                <>Open Portal <ArrowRight size={16} /></>
              )}
            </button>
          </form>
        </div>

        {/* Demo account quick-fill */}
        <div className="space-y-3">
          {DEMO_ACCOUNTS.map(acc => (
            <button
              key={acc.email}
              type="button"
              onClick={() => fill(acc)}
              className="w-full flex items-center justify-between rounded-[22px] bg-white px-4 py-4 shadow-card dark:bg-[#101a2e] transition-transform active:scale-[0.98]"
            >
              <div className="text-left">
                <div className="font-semibold text-slate-900 dark:text-white text-sm">{acc.label}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{acc.role} · tap to fill</div>
              </div>
              <div className={`grid h-10 w-10 place-items-center rounded-2xl ${acc.gradient} ${acc.textColor} flex-shrink-0`}>
                <ArrowRight size={17} />
              </div>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2 mt-6 text-white/30 text-xs">
          <Shield size={11} />
          <span>HCL provides non-advised governance services only</span>
        </div>
      </div>
    </div>
  )
}
