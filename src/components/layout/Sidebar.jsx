import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  LayoutDashboard,
  Users,
  FileText,
  MessageSquare,
  Building2,
  ClipboardCheck,
  Bell,
  ChevronRight,
} from 'lucide-react'

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/clients', label: 'All Clients', icon: Users },
  { to: '/admin/reports', label: 'Reports', icon: FileText },
]

const clientNav = [
  { to: '/portal', label: 'My Dashboard', icon: LayoutDashboard, end: true },
  { to: '/portal/checkin', label: 'Monthly Check-In', icon: ClipboardCheck },
  { to: '/portal/reports', label: 'Governance Reports', icon: FileText },
  { to: '/portal/messages', label: 'Messages', icon: MessageSquare },
]

const brokerNav = [
  { to: '/broker', label: 'My Clients', icon: Building2, end: true },
  { to: '/broker/reports', label: 'Reports', icon: FileText },
  { to: '/broker/actions', label: 'Open Actions', icon: Bell },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const { user } = useAuth()

  const navItems =
    user?.role === 'admin' ? adminNav :
    user?.role === 'client' ? clientNav :
    brokerNav

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-navy/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 h-[calc(100vh-64px)] w-64 bg-white dark:bg-navy-50
          border-r border-gray-100 dark:border-white/10
          z-40 transition-transform duration-300 flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:h-auto md:z-auto md:flex
        `}
      >
        {/* Role badge */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />
            <span className="text-xs text-gray-400 dark:text-white/40 uppercase tracking-widest font-medium">
              {user?.role === 'admin' ? 'Administration' :
               user?.role === 'client' ? 'Client Portal' : 'Broker View'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-navy text-white dark:bg-white/10'
                    : 'text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-navy dark:hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={17}
                    className={isActive ? 'text-gold' : 'text-gray-400 dark:text-white/30 group-hover:text-navy dark:group-hover:text-white/60 transition-colors'}
                  />
                  <span className="flex-1">{label}</span>
                  {isActive && <ChevronRight size={14} className="text-gold/60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 dark:border-white/10">
          <p className="text-xs text-gray-300 dark:text-white/20 leading-relaxed">
            HCL provides non-advised governance services only.
          </p>
        </div>
      </aside>
    </>
  )
}
