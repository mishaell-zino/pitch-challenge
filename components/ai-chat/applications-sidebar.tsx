"use client"

import { useState, useEffect } from "react"
import { Building, Hammer, Trash2, Map, ChevronRight } from "lucide-react"
import type { Application, PermitType } from "@/lib/types"
import { useSettings } from "@/components/settings-provider"
import { cn } from "@/lib/utils"

const PERMIT_ICONS: Record<PermitType, typeof Building> = {
  building_permit: Building,
  renovation: Hammer,
  demolition: Trash2,
  zoning_variance: Map,
}

interface ApplicationsSidebarProps {
  onSelectApplication: (app: Application) => void
  selectedId?: string
}

export function ApplicationsSidebar({ onSelectApplication, selectedId }: ApplicationsSidebarProps) {
  const { t } = useSettings()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch all applications
    fetch("/api/applications")
      .then(res => res.json())
      .then(data => {
        if (data.applications) {
          setApplications(data.applications)
        }
      })
      .catch(err => console.error("Failed to load applications:", err))
      .finally(() => setLoading(false))
  }, [])

  const getCurrentStage = (app: Application) => {
    const current = app.stages.find(s => s.status === "current")
    return current?.key || "unknown"
  }

  const getPermitLabel = (type: PermitType) => {
    return t(`permit.${type}`)
  }

  const getStageLabel = (stageKey: string) => {
    return t(`stages.${stageKey}`)
  }

  const getStatusColor = (stage: string) => {
    if (stage.includes("decision")) return "text-success"
    if (stage.includes("inspection")) return "text-accent"
    if (stage.includes("review")) return "text-primary"
    return "text-muted-foreground"
  }

  if (loading) {
    return (
      <aside className="w-80 border-r border-[oklch(0.75_0.03_85)] bg-[oklch(0.98_0.008_85)] p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-[oklch(0.82_0.03_85)] rounded" />
          <div className="h-24 bg-[oklch(0.82_0.03_85)] rounded" />
          <div className="h-24 bg-[oklch(0.82_0.03_85)] rounded" />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-80 border-r border-[oklch(0.75_0.03_85)] bg-[oklch(0.98_0.008_85)] flex flex-col">
      <div className="p-4 border-b border-[oklch(0.75_0.03_85)] bg-[oklch(0.82_0.03_85)]">
        <h2 className="text-lg font-semibold text-[oklch(0.32_0.06_250)]">{t("ai.sidebar.title")}</h2>
        <p className="text-sm text-[oklch(0.45_0.02_250)] mt-1">
          {applications.length} {applications.length === 1 ? t("common.application") : t("common.applications")}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t("ai.sidebar.empty")}</p>
          </div>
        ) : (
          applications.map(app => {
            const Icon = PERMIT_ICONS[app.type]
            const currentStage = getCurrentStage(app)
            const isSelected = selectedId === app.id

            return (
              <button
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className={cn(
                  "w-full text-left p-4 rounded border transition-all",
                  "hover:border-[oklch(0.32_0.06_250)] hover:shadow-md",
                  isSelected
                    ? "border-[oklch(0.32_0.06_250)] bg-white shadow-md"
                    : "border-[oklch(0.75_0.03_85)] bg-white"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded shrink-0",
                    isSelected ? "bg-[oklch(0.32_0.06_250)]" : "bg-[oklch(0.82_0.03_85)]"
                  )}>
                    <Icon className={cn(
                      "size-5",
                      isSelected ? "text-white" : "text-[oklch(0.32_0.06_250)]"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-sm font-semibold text-[oklch(0.32_0.06_250)]">
                        {app.id}
                      </p>
                      <ChevronRight className={cn(
                        "size-4 shrink-0 transition-transform",
                        isSelected && "text-[oklch(0.32_0.06_250)]"
                      )} />
                    </div>

                    <p className="text-sm text-[oklch(0.45_0.02_250)] mt-0.5">
                      {getPermitLabel(app.type)}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
                        currentStage.includes("decision") && "bg-green-100 text-green-800",
                        currentStage.includes("inspection") && "bg-blue-100 text-blue-800",
                        currentStage.includes("review") && "bg-[oklch(0.32_0.06_250)]/10 text-[oklch(0.32_0.06_250)]",
                        !currentStage.includes("decision") && !currentStage.includes("inspection") && !currentStage.includes("review") && "bg-gray-100 text-gray-700"
                      )}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {getStageLabel(currentStage)}
                      </span>
                    </div>

                    {app.outstandingActions.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        <span className="size-1.5 rounded-full bg-amber-600" />
                        {app.outstandingActions.length} {app.outstandingActions.length !== 1 ? t("common.actions") : t("common.action")} {t("common.needed")}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}

// Made with Bob
