import { useState } from 'react'
import Header from './components/layout/Header'
import Dashboard from './components/dashboard/Dashboard'
import AuthPage from './components/auth/AuthPage'
import { useDarkMode } from './hooks/useDarkMode'
import { useAuth } from './hooks/useAuth'

export default function App() {
  const [openAdd, setOpenAdd] = useState(false)
  const { dark, toggle: toggleDark } = useDarkMode()
  const { session, loading, signIn, signUp, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) {
    return <AuthPage onSignIn={signIn} onSignUp={signUp} />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        onAdd={() => setOpenAdd(true)}
        onToggleDark={toggleDark}
        isDark={dark}
        userEmail={session.user.email}
        onSignOut={signOut}
      />
      <Dashboard externalAddOpen={openAdd} onExternalAddClose={() => setOpenAdd(false)} />
    </div>
  )
}
