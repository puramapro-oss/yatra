'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'oled' | 'light'

type ThemeContextValue = {
  theme: Theme
  setTheme: (t: Theme) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const STORAGE_KEY = 'yatra-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    const stored = (typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null) as Theme | null
    if (stored === 'dark' || stored === 'oled' || stored === 'light') {
      setThemeState(stored)
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.dataset.theme = theme
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, theme)
    }
  }, [theme])

  const value: ThemeContextValue = {
    theme,
    setTheme: setThemeState,
    toggle: () => setThemeState((t) => (t === 'dark' ? 'light' : t === 'light' ? 'oled' : 'dark')),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
