import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { Menu } from 'lucide-react'

export default function Layout({ children, darkMode, toggleDarkMode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className={`min-h-screen bg-surface dark:bg-navy-200 flex flex-col`}>
      <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {/* Mobile hamburger */}
          <div className="md:hidden flex items-center px-4 py-3 bg-white dark:bg-navy-50 border-b border-gray-100 dark:border-white/10">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 dark:text-white/60 transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="ml-3 text-sm font-medium text-navy dark:text-white/80">Menu</span>
          </div>

          <div className="p-4 md:p-8 max-w-screen-xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
