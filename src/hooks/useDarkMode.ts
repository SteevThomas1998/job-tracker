import { useState, useEffect } from 'react'

const STORAGE_KEY = 'job_tracker_dark_mode'

function getInitial(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored !== null) return stored === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useDarkMode() {
  const [dark, setDark] = useState<boolean>(getInitial)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem(STORAGE_KEY, String(dark))
  }, [dark])

  return { dark, toggle: () => setDark((d) => !d) }
}
