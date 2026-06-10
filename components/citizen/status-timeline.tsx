"use client"

import type { Application } from "@/lib/types"
import { useSettings } from "@/components/settings-provider"
import { Check, Clock, Dot, CalendarDays, Building2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

function formatDate(iso: string | undefined, locale: string) {
  if (!iso) return ""
  try {
    return new Date(iso).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  } catch {
    return iso
  }
}

export function StatusTimeline({ application }: { application: Application }) {
  const { t, locale } = useSettings()

  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-balance">{t("status.timelineTitle")}</h3>
        <span className="font-mono text-sm text-muted-foreground">{application.id}</span>
      </div>

      <p className="mt-1 text-base font-medium text-foreground">
        {t(`permit.${application.type}`)}
      </p>

      {/* Stage timeline */}
      <ol className="mt-4 flex flex-col gap-0" role="list">
        {application.stages.map((stage, i) => {
          const isLast = i === application.stages.length - 1
          return (
            <li key={stage.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                    stage.status === "done" && "border-success bg-success text-success-foreground",
                    stage.status === "current" && "border-accent bg-accent text-accent-foreground",
                    stage.status === "pending" && "border-border bg-muted text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {stage.status === "done" ? (
                    <Check className="size-4" />
                  ) : stage.status === "current" ? (
                    <Clock className="size-4" />
                  ) : (
                    <Dot className="size-5" />
                  )}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      "my-1 w-0.5 flex-1",
                      stage.status === "done" ? "bg-success/40" : "bg-border",
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className={cn("pb-5", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-base leading-6",
                    stage.status === "current" ? "font-semibold text-foreground" : "text-foreground",
                    stage.status === "pending" && "text-muted-foreground",
                  )}
                >
                  {t(`stages.${stage.key}`)}
                </p>
                {stage.date && (
                  <p className="text-sm text-muted-foreground">{formatDate(stage.date, locale)}</p>
                )}
                {stage.status === "current" && (
                  <span className="mt-1 inline-block rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    {t("cw.currentStage")}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {/* Key facts */}
      <div className="mt-2 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <div className="flex items-start gap-2">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">{t("status.estDecision")}</p>
            <p className="text-base font-medium">
              {formatDate(application.estimatedDecisionDate, locale)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Building2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <p className="text-sm text-muted-foreground">{t("status.office")}</p>
            <p className="text-base font-medium">{application.assignedOffice}</p>
          </div>
        </div>
      </div>

      {/* Outstanding actions */}
      <div className="mt-4 rounded-lg bg-muted/60 p-3">
        <p className="text-sm font-semibold text-foreground">{t("status.outstandingTitle")}</p>
        {application.outstandingActions.length === 0 ? (
          <p className="mt-1 text-base leading-6 text-muted-foreground">
            {t("status.noOutstanding")}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2" role="list">
            {application.outstandingActions.map((action) => (
              <li key={action.key} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden="true" />
                <span className="text-base leading-6">
                  <span className="font-medium">{t(`actions.${action.key}`)}</span>
                  {action.dueDate && (
                    <span className="text-muted-foreground">
                      {" — "}
                      {t("actions.due")} {formatDate(action.dueDate, locale)}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
