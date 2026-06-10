"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface SuggestedAction {
  id: string
  label: string
  icon?: LucideIcon
  prompt: string  // What to send to AI when clicked
  tone?: "default" | "primary" | "muted"
}

interface SuggestedActionsProps {
  actions: SuggestedAction[]
  onActionClick: (prompt: string) => void
  disabled?: boolean
  size?: "default" | "compact"
  ariaLabel?: string
}

export function SuggestedActions({
  actions,
  onActionClick,
  disabled = false,
  size = "default",
  ariaLabel = "Suggested actions",
}: SuggestedActionsProps) {
  if (actions.length === 0) return null

  return (
    <div 
      className="flex flex-wrap gap-2" 
      role="group" 
      aria-label={ariaLabel}
    >
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => !disabled && onActionClick(action.prompt)}
            disabled={disabled}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              size === "compact" ? "min-h-10 px-3 py-2 text-sm" : "min-h-12 px-4 py-2.5 text-base",
              "font-medium leading-tight",
              disabled && "cursor-not-allowed opacity-50",
              !disabled && action.tone === "primary"
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : !disabled && action.tone === "muted"
                  ? "border-border bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  : !disabled
                    ? "border-border bg-card text-card-foreground hover:border-primary hover:bg-secondary"
                    : "border-border bg-card text-card-foreground",
            )}
          >
            {Icon && <Icon className={cn("shrink-0", size === "compact" ? "size-4" : "size-5")} aria-hidden="true" />}
            <span className="text-pretty">{action.label}</span>
          </button>
        )
      })}
    </div>
  )
}

// Made with Bob
