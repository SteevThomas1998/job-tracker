import { useState } from 'react'
import Header from './components/layout/Header'
import Dashboard from './components/dashboard/Dashboard'
import { useDarkMode } from './hooks/useDarkMode'

export default function App() {
  const [openAdd, setOpenAdd] = useState(false)
  const { dark, toggle: toggleDark } = useDarkMode()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header onAdd={() => setOpenAdd(true)} onToggleDark={toggleDark} isDark={dark} />
      <Dashboard externalAddOpen={openAdd} onExternalAddClose={() => setOpenAdd(false)} />
    </div>
  )
}
