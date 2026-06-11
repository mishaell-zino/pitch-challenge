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
    <div className="rounded border border-[oklch(0.75_0.03_85)] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-[oklch(0.82_0.03_85)]">
        <h3 className="text-lg font-bold text-[oklch(0.32_0.06_250)]">{t("status.timelineTitle")}</h3>
        <span className="font-mono text-sm font-semibold text-[oklch(0.32_0.06_250)]">{application.id}</span>
      </div>

      <p className="mt-3 text-base font-semibold text-[oklch(0.32_0.06_250)]">
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
                    "flex size-9 shrink-0 items-center justify-center rounded-full border-2 font-semibold",
                    stage.status === "done" && "border-green-600 bg-green-600 text-white",
                    stage.status === "current" && "border-[oklch(0.32_0.06_250)] bg-[oklch(0.32_0.06_250)] text-white",
                    stage.status === "pending" && "border-[oklch(0.75_0.03_85)] bg-[oklch(0.95_0.008_85)] text-[oklch(0.55_0.02_250)]",
                  )}
                  aria-hidden="true"
                >
                  {stage.status === "done" ? (
                    <Check className="size-5" strokeWidth={3} />
                  ) : stage.status === "current" ? (
                    <Clock className="size-5" />
                  ) : (
                    <Dot className="size-6" />
                  )}
                </span>
                {!isLast && (
                  <span
                    className={cn(
                      "my-1 w-0.5 flex-1",
                      stage.status === "done" ? "bg-green-300" : "bg-[oklch(0.82_0.03_85)]",
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className={cn("pb-5", isLast && "pb-0")}>
                <p
                  className={cn(
                    "text-base leading-6 font-medium",
                    stage.status === "current" ? "font-bold text-[oklch(0.32_0.06_250)]" : "text-[oklch(0.32_0.06_250)]",
                    stage.status === "pending" && "text-[oklch(0.55_0.02_250)]",
                  )}
                >
                  {t(`stages.${stage.key}`)}
                </p>
                {stage.date && (
                  <p className="text-sm text-[oklch(0.55_0.02_250)]">{formatDate(stage.date, locale)}</p>
                )}
                {stage.status === "current" && (
                  <span className="mt-1 inline-block rounded-full bg-[oklch(0.32_0.06_250)] px-2.5 py-0.5 text-xs font-semibold text-white">
                    {t("cw.currentStage")}
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ol>

      {/* Key facts */}
      <div className="mt-4 grid gap-4 border-t border-[oklch(0.82_0.03_85)] pt-4 sm:grid-cols-2">
        <div className="flex items-start gap-3 p-3 rounded bg-[oklch(0.98_0.008_85)] border border-[oklch(0.88_0.012_85)]">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-[oklch(0.32_0.06_250)]" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-[oklch(0.55_0.02_250)]">{t("status.estDecision")}</p>
            <p className="text-base font-semibold text-[oklch(0.32_0.06_250)]">
              {formatDate(application.estimatedDecisionDate, locale)}
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 rounded bg-[oklch(0.98_0.008_85)] border border-[oklch(0.88_0.012_85)]">
          <Building2 className="mt-0.5 size-5 shrink-0 text-[oklch(0.32_0.06_250)]" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-[oklch(0.55_0.02_250)]">{t("status.office")}</p>
            <p className="text-base font-semibold text-[oklch(0.32_0.06_250)]">{application.assignedOffice}</p>
          </div>
        </div>
      </div>

      {/* Outstanding actions */}
      <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-bold text-amber-900">{t("status.outstandingTitle")}</p>
        {application.outstandingActions.length === 0 ? (
          <p className="mt-1 text-base leading-6 text-amber-700">
            {t("status.noOutstanding")}
          </p>
        ) : (
          <ul className="mt-2 flex flex-col gap-2" role="list">
            {application.outstandingActions.map((action) => (
              <li key={action.key} className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden="true" />
                <span className="text-base leading-6 text-amber-900">
                  <span className="font-semibold">{t(`actions.${action.key}`)}</span>
                  {action.dueDate && (
                    <span className="text-amber-700">
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
