import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout
import Layout from './components/layout/Layout'

// Auth
import LoginPage from './components/auth/LoginPage'

// Admin
import AdminDashboard from './components/admin/AdminDashboard'
import ClientList from './components/admin/ClientList'
import ClientDetail from './components/admin/ClientDetail'
import AdminReports from './components/admin/AdminReports'

// Client
import ClientPortal from './components/client/ClientPortal'
import CheckInForm from './components/client/CheckInForm'
import ClientReports from './components/client/ClientReports'
import ClientMessages from './components/client/ClientMessages'

// Broker
import BrokerDashboard from './components/broker/BrokerDashboard'
import BrokerReports from './components/broker/BrokerReports'
import BrokerActions from './components/broker/BrokerActions'

export default function App() {
  const { user, loading } = useAuth()
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('hcl_darkmode') === 'true'
  })

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('hcl_darkmode', darkMode)
  }, [darkMode])

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="text-navy font-bold text-sm">HCL</span>
          </div>
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  const toggleDarkMode = () => setDarkMode((v) => !v)

  // ---- Admin routes ----
  if (user.role === 'admin') {
    return (
      <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/clients" element={<ClientList />} />
          <Route path="/admin/clients/:clientId" element={<ClientDetail />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Layout>
    )
  }

  // ---- Client routes ----
  if (user.role === 'client') {
    return (
      <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Routes>
          <Route path="/portal" element={<ClientPortal />} />
          <Route path="/portal/checkin" element={<CheckInForm />} />
          <Route path="/portal/reports" element={<ClientReports />} />
          <Route path="/portal/messages" element={<ClientMessages />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      </Layout>
    )
  }

  // ---- Broker routes ----
  if (user.role === 'broker') {
    return (
      <Layout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
        <Routes>
          <Route path="/broker" element={<BrokerDashboard />} />
          <Route path="/broker/reports" element={<BrokerReports />} />
          <Route path="/broker/actions" element={<BrokerActions />} />
          <Route path="*" element={<Navigate to="/broker" replace />} />
        </Routes>
      </Layout>
    )
  }

  return <LoginPage />
}
