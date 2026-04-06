import { useState } from 'react'
import Header from './components/layout/Header'
import Dashboard from './components/dashboard/Dashboard'

export default function App() {
  const [openAdd, setOpenAdd] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onAdd={() => setOpenAdd(true)} />
      <Dashboard externalAddOpen={openAdd} onExternalAddClose={() => setOpenAdd(false)} />
    </div>
  )
}
