import { useState } from 'react'
import Header from './components/layout/Header'
import Dashboard from './components/dashboard/Dashboard'
import AuthPage from './components/auth/AuthPage'
import Modal from './components/modal/Modal'
import GmailConnect from './components/settings/EmailTrackingSetup'
import { useDarkMode } from './hooks/useDarkMode'
import { useAuth } from './hooks/useAuth'
import { useGmailConnection } from './hooks/useGmailConnection'

export default function App() {
  const [openAdd, setOpenAdd] = useState(false)
  const [emailSetupOpen, setEmailSetupOpen] = useState(false)
  const { dark, toggle: toggleDark } = useDarkMode()
  const { session, loading, signIn, signUp, signOut } = useAuth()
  const gmail = useGmailConnection()

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
        onOpenEmailSetup={() => setEmailSetupOpen(true)}
      />
      <Dashboard
        externalAddOpen={openAdd}
        onExternalAddClose={() => setOpenAdd(false)}
        onMounted={gmail.triggerPoll}
      />

      <Modal isOpen={emailSetupOpen} onClose={() => setEmailSetupOpen(false)} title="Email Tracking">
        <GmailConnect
          status={gmail.status}
          loading={gmail.loading}
          polling={gmail.polling}
          disconnecting={gmail.disconnecting}
          onConnect={gmail.connect}
          onDisconnect={gmail.disconnect}
        />
      </Modal>
    </div>
  )
}
