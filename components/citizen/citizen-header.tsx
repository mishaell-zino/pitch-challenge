"use client"

import Link from "next/link"
import { Landmark, Languages, Type, Users } from "lucide-react"
import { useSettings } from "@/components/settings-provider"
import { LOCALES } from "@/lib/i18n"
import type { Locale } from "@/lib/types"
import { cn } from "@/lib/utils"

export function CitizenHeader() {
  const { t, locale, setLocale, largeText, toggleLargeText } = useSettings()

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Landmark className="size-5" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">{t("app.authority")}</p>
              <p className="text-xs text-muted-foreground">{t("app.assistant")}</p>
            </div>
          </div>

          <Link
            href="/caseworker"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground"
          >
            <Users className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">{t("app.staffLink")}</span>
          </Link>
        </div>

        {/* Accessibility + language controls — always visible, never buried in a menu */}
        <div className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-center gap-1 rounded-lg border border-border bg-background p-1"
            role="group"
            aria-label={t("app.language")}
          >
            <Languages className="ms-1 size-4 text-muted-foreground" aria-hidden="true" />
            {LOCALES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLocale(l.code as Locale)}
                aria-pressed={locale === l.code}
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                  locale === l.code
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
                )}
              >
                {l.native}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleLargeText}
            aria-pressed={largeText}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm font-medium transition-colors",
              largeText
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-secondary-foreground",
            )}
          >
            <Type className="size-4" aria-hidden="true" />
            {largeText ? t("a11y.normalText") : t("a11y.largerText")}
          </button>
        </div>
      </div>
    </header>
  )
}
