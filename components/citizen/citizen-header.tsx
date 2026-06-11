"use client"

import { Landmark, Type, Phone, ChevronDown } from "lucide-react"
import { useSettings } from "@/components/settings-provider"
import { LOCALES } from "@/lib/i18n"
import { USFlag, SpainFlag, SaudiFlag } from "@/components/ui/flag-icons"
import type { Locale } from "@/lib/types"
import { cn } from "@/lib/utils"

// Language configuration
const LANGUAGE_CONFIG = {
  en: { code: "EN", Flag: USFlag, name: "English" },
  es: { code: "ES", Flag: SpainFlag, name: "Español" },
  ar: { code: "AR", Flag: SaudiFlag, name: "العربية" },
}

export function CitizenHeader() {
  const { t, locale, setLocale, largeText, toggleLargeText } = useSettings()

  return (
    <header className="border-b border-border">
      {/* Top bar with city branding and emergency contact */}
      <div className="bg-[oklch(0.32_0.06_250)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* City branding */}
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-full bg-white/10 ring-2 ring-white/20">
                <Landmark className="size-6" aria-hidden="true" />
              </span>
              <div className="leading-tight">
                <h1 className="text-lg font-bold tracking-tight">City of Eastbrook</h1>
                <p className="text-xs text-white/80 italic">Serving Our Citizens Since 1847</p>
              </div>
            </div>

            {/* Emergency contact */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="size-4" aria-hidden="true" />
                <div className="leading-tight">
                  <span className="font-semibold">Emergency? Dial 911</span>
                  <span className="mx-2 text-white/50">·</span>
                  <span className="text-white/90">Non-emergency: (555) 010-3300</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar with beige background */}
      <div className="bg-[oklch(0.82_0.03_85)] border-b border-[oklch(0.75_0.03_85)]">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[oklch(0.32_0.06_250)]">
              {t("app.authority")}
            </span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{t("app.assistant")}</span>
          </div>
        </div>
      </div>

      {/* Accessibility controls bar */}
      <div className="bg-card border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {/* Language selector dropdown */}
            <div className="relative">
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as Locale)}
                aria-label={t("app.language")}
                className="appearance-none rounded-md border border-[oklch(0.88_0.012_85)] bg-white pl-3 pr-10 py-2 text-sm font-medium text-[oklch(0.32_0.06_250)] hover:bg-[oklch(0.98_0.008_85)] transition-colors cursor-pointer focus-visible:border-[oklch(0.32_0.06_250)] focus-visible:outline-none shadow-sm"
              >
                {LOCALES.map((l) => {
                  const config = LANGUAGE_CONFIG[l.code as keyof typeof LANGUAGE_CONFIG]
                  return (
                    <option key={l.code} value={l.code}>
                      {config.code} - {config.name}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-[oklch(0.55_0.02_250)] pointer-events-none" />
            </div>

            {/* Text size toggle */}
            <button
              type="button"
              onClick={toggleLargeText}
              aria-pressed={largeText}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-2 text-sm font-medium transition-colors shadow-sm",
                largeText
                  ? "border-[oklch(0.32_0.06_250)] bg-[oklch(0.32_0.06_250)] text-white"
                  : "border-[oklch(0.88_0.012_85)] bg-white text-[oklch(0.32_0.06_250)] hover:bg-[oklch(0.98_0.008_85)]",
              )}
            >
              <Type className="size-4" aria-hidden="true" />
              {largeText ? t("a11y.normalText") : t("a11y.largerText")}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
