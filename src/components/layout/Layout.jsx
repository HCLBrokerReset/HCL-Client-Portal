import Header from './Header'
import BottomNav from './BottomNav'

export default function Layout({ children, darkMode, toggleDarkMode }) {
  return (
    <div className="min-h-svh flex flex-col">
      {/* The gradient background is on body via CSS */}
      {/* App shell — centred phone-width with light surface */}
      <div className="mx-auto w-full max-w-[500px] flex flex-col min-h-svh">
        <div className="flex-1 flex flex-col overflow-hidden rounded-none sm:rounded-[38px] sm:my-4 sm:border sm:border-white/15 sm:shadow-hero">
          {/* Inner app surface */}
          <div className="app-surface flex-1 flex flex-col overflow-hidden sm:rounded-[36px]">
            <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />

            {/* Scrollable content */}
            <main className="flex-1 overflow-y-auto pb-safe">
              <div className="px-4 pt-4 pb-4 animate-fade-in">
                {children}
              </div>
            </main>

            <BottomNav />
          </div>
        </div>
      </div>
    </div>
  )
}
