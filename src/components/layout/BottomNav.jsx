import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Home, Users, FileText, ClipboardList,
  Building2, Bell, MessageSquare,
} from 'lucide-react'

const adminNav = [
  { to: '/admin', label: 'Home', icon: Home, end: true },
  { to: '/admin/clients', label: 'Clients', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
]

const clientNav = [
  { to: '/portal', label: 'Home', icon: Home, end: true },
  { to: '/portal/checkin', label: 'Check-in', icon: ClipboardList },
  { to: '/portal/reports', label: 'Reports', icon: FileText },
  { to: '/portal/messages', label: 'Chat', icon: MessageSquare },
]

const brokerNav = [
  { to: '/broker', label: 'Clients', icon: Building2, end: true },
  { to: '/broker/reports', label: 'Reports', icon: FileText },
  { to: '/broker/actions', label: 'Flags', icon: Bell },
]

export default function BottomNav() {
  const { user } = useAuth()

  const navItems =
    user?.role === 'admin' ? adminNav :
    user?.role === 'client' ? clientNav :
    brokerNav

  return (
    <div className="sticky bottom-0 z-30 border-t border-slate-200/80 bg-white/90 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1426]/90">
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-[20px] px-2 py-3 text-[11px] font-semibold transition-all ${
                isActive
                  ? 'bg-btn-primary text-white shadow-btn'
                  : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400'
              }`
            }
          >
            <Icon size={18} />
            <span className="mt-1 leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
