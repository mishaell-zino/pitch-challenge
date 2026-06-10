"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { Locale } from "@/lib/types"
import { dirFor, translate } from "@/lib/i18n"

interface AppSettings {
  locale: Locale
  setLocale: (l: Locale) => void
  dir: "ltr" | "rtl"
  largeText: boolean
  toggleLargeText: () => void
  t: (key: string, vars?: Record<string, string>) => string
}

const SettingsContext = createContext<AppSettings | null>(null)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")
  const [largeText, setLargeText] = useState(false)

  const dir = dirFor(locale)

  // Reflect language + direction on <html> so native form controls,
  // scrollbars and text alignment follow the citizen's language.
  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = dir
  }, [locale, dir])

  useEffect(() => {
    document.documentElement.dataset.textSize = largeText ? "large" : "normal"
  }, [largeText])

  const setLocale = useCallback((l: Locale) => setLocaleState(l), [])
  const toggleLargeText = useCallback(() => setLargeText((v) => !v), [])
  const t = useCallback(
    (key: string, vars?: Record<string, string>) => translate(locale, key, vars),
    [locale],
  )

  const value = useMemo<AppSettings>(
    () => ({ locale, setLocale, dir, largeText, toggleLargeText, t }),
    [locale, setLocale, dir, largeText, toggleLargeText, t],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider")
  return ctx
}
