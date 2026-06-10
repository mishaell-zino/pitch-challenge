// Shared domain types for the citizen service platform POC.

export type Locale = "en" | "es" | "ar"

export type PermitType =
  | "building_permit"
  | "renovation"
  | "demolition"
  | "zoning_variance"

export type StageStatus = "done" | "current" | "pending"

export interface ApplicationStage {
  // Translation key under `stages.<key>`
  key: string
  status: StageStatus
  // ISO date the stage completed/started, if applicable
  date?: string
}

export interface OutstandingAction {
  // Translation key under `actions.<key>`
  key: string
  dueDate?: string
}

export interface Application {
  id: string
  type: PermitType
  applicantName: string
  address: string
  submittedDate: string
  estimatedDecisionDate: string
  assignedOffice: string
  stages: ApplicationStage[]
  outstandingActions: OutstandingAction[]
}

export type EscalationStatus = "new" | "claimed" | "resolved"

export type EscalationReason =
  | "status_unclear"
  | "needs_correction"
  | "documents_problem"
  | "dispute"
  | "other"

export interface TranscriptEntry {
  role: "bot" | "citizen"
  // Already-rendered text in the citizen's language (what they actually saw/said)
  text: string
  at: string
}

export interface Escalation {
  id: string
  createdAt: string
  status: EscalationStatus
  locale: Locale
  reason: EscalationReason
  // The free-text-ish detail captured from the citizen (a chosen option label)
  detail: string
  // Linked application, if one was identified during the conversation
  applicationId?: string
  applicationSnapshot?: {
    type: PermitType
    currentStageKey: string
    estimatedDecisionDate: string
    assignedOffice: string
  }
  // Auto-generated, language-agnostic summary descriptor for the caseworker
  summary: {
    // translation key for a one-line situation summary
    headlineKey: string
    contactName?: string
  }
  transcript: TranscriptEntry[]
  claimedBy?: string
  resolvedNote?: string
}
