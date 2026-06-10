"use client"

import { useState, useEffect } from "react"
import { Building, Hammer, Trash2, Map, ChevronRight } from "lucide-react"
import type { Application, PermitType } from "@/lib/types"
import { cn } from "@/lib/utils"

const PERMIT_ICONS: Record<PermitType, typeof Building> = {
  building_permit: Building,
  renovation: Hammer,
  demolition: Trash2,
  zoning_variance: Map,
}

const PERMIT_LABELS: Record<PermitType, string> = {
  building_permit: "Building Permit",
  renovation: "Renovation",
  demolition: "Demolition",
  zoning_variance: "Zoning Variance",
}

interface ApplicationsSidebarProps {
  onSelectApplication: (app: Application) => void
  selectedId?: string
}

export function ApplicationsSidebar({ onSelectApplication, selectedId }: ApplicationsSidebarProps) {
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

  const getStatusColor = (stage: string) => {
    if (stage.includes("decision")) return "text-success"
    if (stage.includes("inspection")) return "text-accent"
    if (stage.includes("review")) return "text-primary"
    return "text-muted-foreground"
  }

  if (loading) {
    return (
      <aside className="w-80 border-r border-border bg-card/50 p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-24 bg-muted rounded" />
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-80 border-r border-border bg-card/50 flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Your Applications</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {applications.length} active {applications.length === 1 ? "application" : "applications"}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {applications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No applications found</p>
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
                  "w-full text-left p-4 rounded-lg border transition-all",
                  "hover:border-primary hover:shadow-sm",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    isSelected ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Icon className={cn(
                      "size-5",
                      isSelected ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-mono text-sm font-medium text-foreground">
                        {app.id}
                      </p>
                      <ChevronRight className={cn(
                        "size-4 shrink-0 transition-transform",
                        isSelected && "text-primary"
                      )} />
                    </div>

                    <p className="text-sm text-muted-foreground mt-0.5">
                      {PERMIT_LABELS[app.type]}
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium",
                        getStatusColor(currentStage)
                      )}>
                        <span className="size-1.5 rounded-full bg-current" />
                        {currentStage.replace(/_/g, " ")}
                      </span>
                    </div>

                    {app.outstandingActions.length > 0 && (
                      <div className="mt-2 text-xs text-amber-600 dark:text-amber-500">
                        {app.outstandingActions.length} action{app.outstandingActions.length !== 1 ? "s" : ""} needed
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
