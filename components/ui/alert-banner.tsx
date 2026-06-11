"use client"

import { AlertTriangle, Info, X } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export type AlertType = "maintenance" | "info" | "warning"

interface AlertBannerProps {
  type?: AlertType
  message: string
  link?: {
    text: string
    href: string
  }
  dismissible?: boolean
  storageKey?: string
}

export function AlertBanner({
  type = "info",
  message,
  link,
  dismissible = true,
  storageKey = "alert-dismissed",
}: AlertBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    if (dismissible && storageKey) {
      const dismissed = localStorage.getItem(storageKey)
      if (dismissed === "true") {
        setIsDismissed(true)
      }
    }
  }, [dismissible, storageKey])

  const handleDismiss = () => {
    setIsDismissed(true)
    if (storageKey) {
      localStorage.setItem(storageKey, "true")
    }
  }

  if (isDismissed) return null

  const styles = {
    maintenance: {
      bg: "bg-[oklch(0.92_0.03_27)]",
      text: "text-[oklch(0.35_0.08_27)]",
      border: "border-[oklch(0.85_0.05_27)]",
      icon: AlertTriangle,
    },
    warning: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      border: "border-amber-200",
      icon: AlertTriangle,
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-900",
      border: "border-blue-200",
      icon: Info,
    },
  }

  const style = styles[type]
  const Icon = style.icon

  return (
    <div
      className={cn(
        "border-b px-4 py-3",
        style.bg,
        style.text,
        style.border
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3">
        <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div className="flex-1 text-sm">
          <span className="font-semibold">
            {type === "maintenance" && "SCHEDULED MAINTENANCE: "}
            {type === "warning" && "NOTICE: "}
          </span>
          {message}
          {link && (
            <>
              {" "}
              <a
                href={link.href}
                className="underline hover:no-underline font-medium"
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.text}
              </a>
              .
            </>
          )}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className={cn(
              "shrink-0 rounded p-1 transition-colors hover:bg-black/5",
              style.text
            )}
            aria-label="Dismiss alert"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Made with Bob
