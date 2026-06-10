"use client"

import { useState, useRef, useCallback } from "react"
import { Volume2, Square } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/components/settings-provider"

interface MessageBubbleProps {
  role: "bot" | "citizen"
  text?: string
  // Spoken text (defaults to `text`). Used for rich messages with extra content.
  speakText?: string
  children?: React.ReactNode
}

// Maps app locales to BCP-47 codes for the Web Speech API.
const speechLang: Record<string, string> = { en: "en-US", es: "es-ES", ar: "ar-SA" }

export function MessageBubble({ role, text, speakText, children }: MessageBubbleProps) {
  const { t, locale, dir } = useSettings()
  const [speaking, setSpeaking] = useState(false)
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null)

  const isBot = role === "bot"
  const spoken = speakText ?? text ?? ""

  const toggleSpeak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(spoken)
    u.lang = speechLang[locale] ?? "en-US"
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    utterRef.current = u
    setSpeaking(true)
    window.speechSynthesis.speak(u)
  }, [speaking, spoken, locale])

  return (
    <div
      className={cn("flex w-full gap-2", isBot ? "justify-start" : "justify-end")}
      data-role={role}
    >
      <div
        className={cn(
          "flex max-w-[88%] flex-col gap-2 rounded-2xl px-4 py-3 sm:max-w-[80%]",
          isBot
            ? "rounded-tl-sm bg-card text-card-foreground shadow-sm ring-1 ring-border"
            : "rounded-tr-sm bg-primary text-primary-foreground",
        )}
      >
        {text && <p className="text-base leading-relaxed text-pretty">{text}</p>}
        {children}

        {isBot && spoken && (
          <button
            type="button"
            onClick={toggleSpeak}
            className={cn(
              "mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-secondary-foreground",
              dir === "rtl" ? "self-end" : "self-start",
            )}
            aria-pressed={speaking}
          >
            {speaking ? (
              <Square className="size-3.5 fill-current" aria-hidden="true" />
            ) : (
              <Volume2 className="size-4" aria-hidden="true" />
            )}
            {speaking ? t("a11y.stopReading") : t("a11y.readAloud")}
          </button>
        )}
      </div>
    </div>
  )
}
