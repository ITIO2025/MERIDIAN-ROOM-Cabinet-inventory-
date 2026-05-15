'use client'
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { ThemeId, FontId, RadiusSize, DensityMode, UserThemePrefs } from '@/lib/theme'
import { DEFAULT_PREFS, THEME_STORAGE_KEY, hexToRgbSpace } from '@/lib/theme'

// ── Context type ──────────────────────────────────────────────────

interface ThemeCtx {
  prefs: UserThemePrefs
  mounted: boolean
  setTheme: (id: ThemeId) => void
  setFont: (id: FontId) => void
  setRadius: (r: RadiusSize) => void
  setDensity: (d: DensityMode) => void
  setAccentHex: (hex: string) => void
  resetPrefs: () => void
}

const Ctx = createContext<ThemeCtx | null>(null)

// ── Provider ──────────────────────────────────────────────────────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<UserThemePrefs>(DEFAULT_PREFS)
  const [mounted, setMounted] = useState(false)

  // On mount: load stored prefs or auto-detect OS preference
  useEffect(() => {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as Partial<UserThemePrefs>
        setPrefs(p => ({ ...p, ...stored }))
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setPrefs(p => ({ ...p, theme: 'dark' }))
      }
    } catch (e) {
      console.warn('[ThemeContext] failed to load prefs:', e)
    }
    setMounted(true)
  }, [])

  // Apply theme to DOM whenever prefs change
  useEffect(() => {
    if (!mounted) return
    applyToDOM(prefs)
    try { localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(prefs)) } catch (e) { console.warn('[ThemeContext] failed to load prefs:', e) }
  }, [prefs, mounted])

  const setTheme    = useCallback((id: ThemeId)     => setPrefs(p => ({ ...p, theme: id, accentHex: '' })), [])
  const setFont     = useCallback((id: FontId)      => setPrefs(p => ({ ...p, font: id })), [])
  const setRadius   = useCallback((r: RadiusSize)   => setPrefs(p => ({ ...p, radius: r })), [])
  const setDensity  = useCallback((d: DensityMode)  => setPrefs(p => ({ ...p, density: d })), [])
  const setAccentHex = useCallback((hex: string)    => setPrefs(p => ({ ...p, accentHex: hex })), [])
  const resetPrefs   = useCallback(() => {
    try { localStorage.removeItem(THEME_STORAGE_KEY) } catch (e) { console.warn('[ThemeContext] failed to load prefs:', e) }
    setPrefs(DEFAULT_PREFS)
  }, [])

  return (
    <Ctx.Provider value={{ prefs, mounted, setTheme, setFont, setRadius, setDensity, setAccentHex, resetPrefs }}>
      {children}
    </Ctx.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────

export function useTheme(): ThemeCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}

// ── DOM application ───────────────────────────────────────────────

function applyToDOM(prefs: UserThemePrefs) {
  const root = document.documentElement
  root.setAttribute('data-theme',   prefs.theme)
  root.setAttribute('data-font',    prefs.font)
  root.setAttribute('data-radius',  prefs.radius)
  root.setAttribute('data-density', prefs.density)

  // Custom accent color override
  if (prefs.accentHex) {
    root.style.setProperty('--color-accent', prefs.accentHex)
    root.style.setProperty('--tw-accent', hexToRgbSpace(prefs.accentHex))
  } else {
    root.style.removeProperty('--color-accent')
    root.style.removeProperty('--tw-accent')
  }
}
