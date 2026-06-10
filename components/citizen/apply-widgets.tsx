"use client"

import type { EscalationReason, PermitType } from "@/lib/types"
import { useSettings } from "@/components/settings-provider"
import { FileText, Receipt, CheckCircle2, FileCheck2, User, FolderOpen } from "lucide-react"

export function ApplyDocs({ permit }: { permit: PermitType }) {
  const { t } = useSettings()
  const docs = t(`docs.${permit}`).split(" · ")
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-center gap-2">
        <FileText className="size-5 text-primary" aria-hidden="true" />
        <h3 className="text-base font-semibold">{t("apply.docsTitle")}</h3>
      </div>
      <p className="mt-1 text-base leading-relaxed text-muted-foreground">
        {t("apply.docsIntro", { type: t(`permit.${permit}`).toLowerCase() })}
      </p>
      <ul className="mt-3 flex flex-col gap-2" role="list">
        {docs.map((d) => (
          <li key={d} className="flex items-start gap-2 text-base leading-6">
            <FileCheck2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            <span>{d}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ApplyFee({ permit }: { permit: PermitType }) {
  const { t } = useSettings()
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="flex items-center gap-2">
        <Receipt className="size-5 text-primary" aria-hidden="true" />
        <h3 className="text-base font-semibold">{t("apply.feeTitle")}</h3>
      </div>
      <p className="mt-1 text-base leading-relaxed">
        {t("apply.feeBody", { type: t(`permit.${permit}`).toLowerCase() })}
      </p>
    </div>
  )
}

export function ApplyReady({ permit }: { permit: PermitType }) {
  const { t } = useSettings()
  return (
    <div className="rounded-xl border border-success/40 bg-success/5 p-4 text-card-foreground shadow-sm">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-5 text-success" aria-hidden="true" />
        <h3 className="text-base font-semibold">{t("apply.readyTitle")}</h3>
      </div>
      <p className="mt-1 text-base leading-relaxed">
        {t("apply.readyBody", { type: t(`permit.${permit}`).toLowerCase() })}
      </p>
    </div>
  )
}

export function EscalationSummary({
  reason,
  detail,
  applicationId,
  name,
}: {
  reason: EscalationReason
  detail: string
  applicationId?: string
  name?: string
}) {
  const { t } = useSettings()
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <h3 className="text-base font-semibold">{t("esc.confirmTitle")}</h3>
      <dl className="mt-3 flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <FolderOpen className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="text-sm text-muted-foreground">{t("esc.confirmReason")}</dt>
            <dd className="text-base font-medium">{detail}</dd>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <div>
            <dt className="text-sm text-muted-foreground">{t("esc.confirmApp")}</dt>
            <dd className="text-base font-medium font-mono">
              {applicationId ?? <span className="font-sans">{t("esc.confirmNone")}</span>}
            </dd>
          </div>
        </div>
        {name && (
          <div className="flex items-start gap-2">
            <User className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="text-sm text-muted-foreground">{t("esc.confirmName")}</dt>
              <dd className="text-base font-medium">{name}</dd>
            </div>
          </div>
        )}
      </dl>
      <p className="mt-3 rounded-lg bg-muted/60 p-2.5 text-sm leading-relaxed text-muted-foreground">
        {t("esc.confirmContext")}: {t("cw.transcript")}
      </p>
    </div>
  )
}
