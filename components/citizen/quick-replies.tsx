"use client"

import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

export interface QuickReply {
  id: string
  label: string
  icon?: LucideIcon
  // primary = highlighted main action; danger style for cancel etc.
  tone?: "default" | "primary" | "muted"
}

export function QuickReplies({
  replies,
  onSelect,
  ariaLabel,
}: {
  replies: QuickReply[]
  onSelect: (id: string) => void
  ariaLabel: string
}) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {replies.map((r) => {
        const Icon = r.icon
        return (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r.id)}
            className={cn(
              "inline-flex min-h-12 items-center gap-2 rounded-xl border px-4 py-2.5 text-base font-medium leading-tight transition-colors",
              "focus-visible:outline-none",
              r.tone === "primary"
                ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                : r.tone === "muted"
                  ? "border-border bg-muted text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                  : "border-border bg-card text-card-foreground hover:border-primary hover:bg-secondary",
            )}
          >
            {Icon && <Icon className="size-5 shrink-0" aria-hidden="true" />}
            <span className="text-pretty">{r.label}</span>
          </button>
        )
      })}
    </div>
  )
}
