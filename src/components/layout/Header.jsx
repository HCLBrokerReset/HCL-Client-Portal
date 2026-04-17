import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Bell, Moon, Sun, User, LogOut, ChevronDown } from 'lucide-react'

export default function Header({ darkMode, toggleDarkMode }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  const subtitle = {
    admin: '3 clients · Live governance',
    client: `Broker ${user?.name?.split(' ')[0] || ''} · Check-in portal`,
    broker: 'Assigned clients and open flags',
  }[user?.role] || 'Client Portal'

  const roleLabel = {
    admin: 'Administrator',
    client: 'Client',
    broker: 'Broker',
  }[user?.role] || ''

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 px-5 pb-4 pt-4 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1426]/90">
      <div className="flex items-center justify-between">
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-hcl-gold font-black text-navy shadow-gold text-sm tracking-tight flex-shrink-0">
            HCL
          </div>
          <div>
            <div className="text-[15px] font-semibold text-slate-900 leading-tight dark:text-white">
              {user?.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
              {roleLabel}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
          >
            {darkMode ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-white"
            >
              <User size={17} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-white shadow-card border border-slate-100 dark:bg-[#101a2e] dark:border-white/10 overflow-hidden animate-slide-up z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-white/10">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
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
    </div>
  )
}
