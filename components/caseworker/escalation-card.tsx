"use client"

import { useState } from "react"
import { translate, dirFor } from "@/lib/i18n"
import type { Escalation } from "@/lib/types"
import {
  ClipboardList,
  Languages,
  MapPin,
  Calendar,
  Building2,
  MessageSquare,
  CheckCircle2,
  UserCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const EN = (key: string, vars?: Record<string, string>) => translate("en", key, vars)

const LANG_LABEL: Record<string, string> = {
  en: "English",
  es: "Spanish (Español)",
  ar: "Arabic (العربية)",
}

const STATUS_STYLES: Record<Escalation["status"], string> = {
  new: "bg-accent/20 text-accent-foreground border-accent/40",
  claimed: "bg-primary/10 text-primary border-primary/30",
  resolved: "bg-success/10 text-success border-success/30",
}

interface Props {
  escalation: Escalation
  onClaim: (id: string) => void
  onResolve: (id: string) => void
  busy: boolean
}

export function EscalationCard({ escalation: e, onClaim, onResolve, busy }: Props) {
  const [showTranscript, setShowTranscript] = useState(false)
  const snap = e.applicationSnapshot
  const received = new Date(e.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })

  return (
    <article className="rounded-xl border border-border bg-card shadow-sm">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[e.status]}`}
            >
              {EN(`cw.status.${e.status}`)}
            </span>
            <span className="font-mono text-sm text-muted-foreground">{e.id}</span>
          </div>
          <h3 className="mt-2 text-pretty text-lg font-semibold leading-snug text-card-foreground">
            {EN(e.summary.headlineKey)}
          </h3>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div>{EN("cw.received")}</div>
          <div className="font-medium text-card-foreground">{received}</div>
        </div>
      </div>

      {/* Body */}
      <div className="grid gap-4 p-4 md:grid-cols-2">
        {/* Left: who + reason */}
        <div className="space-y-3">
          <Field icon={<Languages className="size-4" />} label={EN("cw.lang")}>
            <span className="font-medium text-card-foreground">{LANG_LABEL[e.locale] ?? e.locale}</span>
          </Field>
          {e.summary.contactName ? (
            <Field icon={<UserCheck className="size-4" />} label="Name on application">
              <span className="font-medium text-card-foreground">{e.summary.contactName}</span>
            </Field>
          ) : null}
          <Field icon={<ClipboardList className="size-4" />} label={EN("cw.reason")}>
            <span className="font-medium text-card-foreground">{EN(`esc.reason.${e.reason}`)}</span>
          </Field>
        </div>

        {/* Right: pre-loaded application context */}
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {EN("cw.context")}
          </div>
          {snap ? (
            <dl className="space-y-1.5 text-sm">
              <Row label={EN("cw.linkedApp")} value={`${EN(`permit.${snap.type}`)} · ${e.applicationId}`} icon={<ClipboardList className="size-3.5" />} />
              <Row label={EN("cw.currentStage")} value={EN(`stages.${snap.currentStageKey}`)} icon={<MapPin className="size-3.5" />} />
              <Row label={EN("cw.estDecision")} value={snap.estimatedDecisionDate} icon={<Calendar className="size-3.5" />} />
              <Row label={EN("cw.office")} value={snap.assignedOffice} icon={<Building2 className="size-3.5" />} />
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">{EN("cw.noApp")}</p>
          )}
        </div>
      </div>

      {/* Transcript toggle */}
      <div className="border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={() => setShowTranscript((s) => !s)}
          className="flex w-full items-center justify-between rounded-md py-1 text-sm font-medium text-primary"
          aria-expanded={showTranscript}
        >
          <span className="inline-flex items-center gap-2">
            <MessageSquare className="size-4" />
            {EN("cw.transcript")} ({e.transcript.length})
          </span>
          {showTranscript ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>

        {showTranscript ? (
          <div
            dir={dirFor(e.locale)}
            className="mt-3 space-y-2 rounded-lg border border-border bg-background p-3"
          >
            {e.transcript.map((t, i) => (
              <div
                key={i}
                className={`flex flex-col ${t.role === "citizen" ? "items-end" : "items-start"}`}
              >
                <span className="mb-0.5 text-[11px] font-medium text-muted-foreground">
                  {t.role === "citizen" ? EN("common.you") : EN("common.assistant")}
                </span>
                <span
                  className={`max-w-[85%] rounded-lg px-3 py-1.5 text-sm leading-relaxed ${
                    t.role === "citizen"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  {t.text}
                </span>
              </div>
            ))}
            <p className="pt-1 text-center text-xs text-muted-foreground">{EN("cw.noContextLost")}</p>
          </div>
        ) : null}
      </div>

      {/* Actions */}
      {e.status !== "resolved" ? (
        <div className="flex flex-wrap gap-2 border-t border-border p-4">
          {e.status === "new" ? (
            <button
              type="button"
              onClick={() => onClaim(e.id)}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              <UserCheck className="size-4" />
              {EN("cw.claim")}
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-sm font-medium text-primary">
              <UserCheck className="size-4" />
              {EN("cw.claimedBy")}
            </span>
          )}
          <button
            type="button"
            onClick={() => onResolve(e.id)}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-4 py-2 text-sm font-semibold text-success disabled:opacity-60"
          >
            <CheckCircle2 className="size-4" />
            {EN("cw.resolve")}
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-border bg-success/5 p-4 text-sm font-medium text-success">
          <CheckCircle2 className="size-4" />
          {EN("cw.resolvedBy")}
          {e.resolvedNote ? <span className="text-muted-foreground">— {e.resolvedNote}</span> : null}
        </div>
      )}
    </article>
  )
}

function Field({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-muted-foreground" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        {children}
      </div>
    </div>
  )
}

function Row({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="inline-flex items-center gap-1.5 text-muted-foreground">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className="text-right font-medium text-card-foreground">{value}</dd>
    </div>
  )
}
