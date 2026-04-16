import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Moon, Sun, LogOut, ChevronDown, User } from 'lucide-react'

export default function Header({ darkMode, toggleDarkMode }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const roleLabel = {
    admin: 'Administrator',
    client: 'Client',
    broker: 'Broker',
  }[user?.role] || 'User'

  return (
    <header className="bg-navy dark:bg-navy-200 border-b border-white/10 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4 md:px-6 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gold flex items-center justify-center flex-shrink-0">
            <span className="text-navy font-bold text-xs tracking-tight">HCL</span>
          </div>
          <div className="hidden sm:block">
            <p className="text-white font-semibold text-sm leading-tight tracking-tight">
              Herron Consultants Limited
            </p>
            <p className="text-gold/70 text-xs tracking-widest uppercase leading-tight">
              Client Portal
            </p>
          </div>
        </div>

        {/* Gold accent line — decorative */}
        <div className="hidden md:block flex-1 mx-8">
          <div className="h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white/50 hover:text-gold hover:bg-white/10 transition-colors"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <User size={14} className="text-gold" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-white text-xs font-medium leading-tight">{user?.name}</p>
                <p className="text-white/40 text-xs leading-tight">{roleLabel}</p>
              </div>
              <ChevronDown
                size={14}
                className={`text-white/40 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-navy-50 rounded-xl shadow-premium-lg border border-gray-100 dark:border-white/10 overflow-hidden animate-slide-up">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10">
                  <p className="text-navy dark:text-white text-sm font-medium truncate">
                    {user?.name}
                  </p>
                  <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => { setMenuOpen(false); logout() }}
                  className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gold accent line at bottom */}
      <div className="h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
    </header>
  )
}
