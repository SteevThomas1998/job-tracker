import { useState } from 'react'
import Header from './components/layout/Header'
import Dashboard from './components/dashboard/Dashboard'
import AuthPage from './components/auth/AuthPage'
import ResetPasswordPage from './components/auth/ResetPasswordPage'
import Modal from './components/modal/Modal'
import GmailManage from './components/settings/EmailTrackingSetup'
import { useDarkMode } from './hooks/useDarkMode'
import { useAuth } from './hooks/useAuth'
import { useGmailConnection } from './hooks/useGmailConnection'

export default function App() {
  const [openAdd, setOpenAdd] = useState(false)
  const [gmailModalOpen, setGmailModalOpen] = useState(false)
  const { dark, toggle: toggleDark } = useDarkMode()
  const { session, loading, recoveryMode, signIn, signUp, signInWithGoogle, resetPassword, updatePassword, signOut } = useAuth()
  const gmail = useGmailConnection()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (recoveryMode) {
    return <ResetPasswordPage onUpdate={updatePassword} />
  }

  if (!session) {
    return (
      <AuthPage
        onSignIn={signIn}
        onSignUp={signUp}
        onGoogleSignIn={signInWithGoogle}
        onResetPassword={resetPassword}
      />
    )
  }

  function handleGmailClick() {
    if (gmail.status.connected) {
      setGmailModalOpen(true)  // already connected → show manage options
    } else {
      gmail.connect()           // not connected → go straight to OAuth
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header
        onAdd={() => setOpenAdd(true)}
        onToggleDark={toggleDark}
        isDark={dark}
        userEmail={session.user.email}
        onSignOut={signOut}
        gmailConnected={gmail.status.connected}
        onGmailClick={handleGmailClick}
      />
      <Dashboard
        externalAddOpen={openAdd}
        onExternalAddClose={() => setOpenAdd(false)}
        onMounted={gmail.triggerPoll}
      />

      <Modal isOpen={gmailModalOpen} onClose={() => setGmailModalOpen(false)} title="Gmail Tracking">
        <GmailManage
          status={gmail.status}
          backfilling={gmail.backfilling}
          importResult={gmail.importResult}
          disconnecting={gmail.disconnecting}
          onDisconnect={() => { gmail.disconnect(); setGmailModalOpen(false) }}
          onImportPast={gmail.importPastEmails}
        />
      </Modal>
    </div>
  )
}
