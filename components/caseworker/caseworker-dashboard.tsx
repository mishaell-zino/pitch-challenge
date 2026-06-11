"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import Link from "next/link"
import { translate } from "@/lib/i18n"
import type { Escalation, EscalationStatus } from "@/lib/types"
import { EscalationCard } from "./escalation-card"
import { ArrowLeft, Inbox, RefreshCw } from "lucide-react"

const EN = (key: string, vars?: Record<string, string>) => translate("en", key, vars)

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type Filter = "all" | EscalationStatus

const FILTERS: Filter[] = ["all", "new", "claimed", "resolved"]
const FILTER_LABEL: Record<Filter, string> = {
  all: "cw.filterAll",
  new: "cw.filterNew",
  claimed: "cw.filterClaimed",
  resolved: "cw.filterResolved",
}

export function CaseworkerDashboard() {
  const { data, isLoading, mutate } = useSWR<{ escalations: Escalation[] }>(
    "/api/escalations",
    fetcher,
    { refreshInterval: 4000 },
  )
  const [filter, setFilter] = useState<Filter>("all")
  const [busyId, setBusyId] = useState<string | null>(null)

  const escalations = useMemo(
    () =>
      [...(data?.escalations ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  )

  const counts = useMemo(() => {
    const c = { all: escalations.length, new: 0, claimed: 0, resolved: 0 }
    for (const e of escalations) c[e.status]++
    return c
  }, [escalations])

  const visible = filter === "all" ? escalations : escalations.filter((e) => e.status === filter)

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id)
    await fetch("/api/escalations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...body }),
    })
    await mutate()
    setBusyId(null)
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-[oklch(0.32_0.06_250)] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold">{EN("cw.title")}</h1>
            <p className="text-sm text-white/80">{EN("cw.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <RefreshCw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
              <span className="sr-only sm:not-sr-only">Refresh</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors"
            >
              <ArrowLeft className="size-4" />
              {EN("cw.backToCitizen")}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {/* Filters */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "border-[oklch(0.32_0.06_250)] bg-[oklch(0.32_0.06_250)] text-white"
                  : "border-border bg-card text-card-foreground hover:bg-[oklch(0.82_0.03_85)]"
              }`}
            >
              {EN(FILTER_LABEL[f])}
              <span
                className={`rounded-full px-1.5 text-xs ${
                  filter === f ? "bg-white/20" : "bg-secondary text-muted-foreground"
                }`}
              >
                {counts[f]}
              </span>
            </button>
          ))}
          <span className="ml-auto text-sm text-muted-foreground">
            {counts.new} {EN("cw.queueCount")}
          </span>
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <Inbox className="mb-3 size-10 text-muted-foreground" />
            <p className="max-w-md text-pretty text-muted-foreground">{EN("cw.empty")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {visible.map((e) => (
              <EscalationCard
                key={e.id}
                escalation={e}
                busy={busyId === e.id}
                onClaim={(id) => patch(id, { status: "claimed", claimedBy: "You" })}
                onResolve={(id) => patch(id, { status: "resolved", resolvedNote: "Handled by caseworker" })}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
