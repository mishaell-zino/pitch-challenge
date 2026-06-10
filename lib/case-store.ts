import type { Application, Escalation, EscalationReason, Locale, TranscriptEntry } from "./types"

// ---------------------------------------------------------------------------
// In-memory mock case management backend.
// Persists for the life of the server process (resets on restart). This stands
// in for the city's real case management system for the POC.
// ---------------------------------------------------------------------------

// Seeded applications. Reference numbers are intentionally simple and
// human-readable so low-digital-literacy citizens can type them from a letter.
const applications: Application[] = [
  {
    id: "BP-2024-0481",
    type: "building_permit",
    applicantName: "Maria Gonzalez",
    address: "1420 Elm Street, Unit 3",
    submittedDate: "2024-03-02",
    estimatedDecisionDate: "2024-05-15",
    assignedOffice: "Central Building Office",
    stages: [
      { key: "submitted", status: "done", date: "2024-03-02" },
      { key: "intake_review", status: "done", date: "2024-03-09" },
      { key: "plan_review", status: "current", date: "2024-03-20" },
      { key: "inspection", status: "pending" },
      { key: "decision", status: "pending" },
    ],
    outstandingActions: [
      { key: "upload_site_plan", dueDate: "2024-04-10" },
    ],
  },
  {
    id: "RN-2024-1192",
    type: "renovation",
    applicantName: "Ahmed Hassan",
    address: "88 Riverside Avenue",
    submittedDate: "2024-02-10",
    estimatedDecisionDate: "2024-04-01",
    assignedOffice: "North District Office",
    stages: [
      { key: "submitted", status: "done", date: "2024-02-10" },
      { key: "intake_review", status: "done", date: "2024-02-15" },
      { key: "plan_review", status: "done", date: "2024-03-01" },
      { key: "inspection", status: "current", date: "2024-03-18" },
      { key: "decision", status: "pending" },
    ],
    outstandingActions: [],
  },
  {
    id: "DM-2024-0067",
    type: "demolition",
    applicantName: "John Carter",
    address: "5 Harbor Road",
    submittedDate: "2024-03-25",
    estimatedDecisionDate: "2024-06-05",
    assignedOffice: "Central Building Office",
    stages: [
      { key: "submitted", status: "done", date: "2024-03-25" },
      { key: "intake_review", status: "current", date: "2024-03-28" },
      { key: "plan_review", status: "pending" },
      { key: "inspection", status: "pending" },
      { key: "decision", status: "pending" },
    ],
    outstandingActions: [
      { key: "pay_fee", dueDate: "2024-04-05" },
      { key: "submit_neighbor_notice", dueDate: "2024-04-12" },
    ],
  },
  {
    id: "ZV-2023-0904",
    type: "zoning_variance",
    applicantName: "Priya Nair",
    address: "230 Maple Court",
    submittedDate: "2023-11-30",
    estimatedDecisionDate: "2024-03-30",
    assignedOffice: "Planning & Zoning Office",
    stages: [
      { key: "submitted", status: "done", date: "2023-11-30" },
      { key: "intake_review", status: "done", date: "2023-12-06" },
      { key: "plan_review", status: "done", date: "2024-01-15" },
      { key: "inspection", status: "done", date: "2024-02-20" },
      { key: "decision", status: "current", date: "2024-03-10" },
    ],
    outstandingActions: [],
  },
]

const escalations: Escalation[] = []

function normalizeRef(input: string): string {
  return input.trim().toUpperCase().replace(/\s+/g, "")
}

export function findApplication(reference: string): Application | undefined {
  const ref = normalizeRef(reference)
  return applications.find((a) => a.id.toUpperCase() === ref)
}

export function listApplications(): Application[] {
  return applications
}

export function currentStageKey(app: Application): string {
  return app.stages.find((s) => s.status === "current")?.key ?? app.stages[0].key
}

let escalationCounter = 100

export interface CreateEscalationInput {
  locale: Locale
  reason: EscalationReason
  detail: string
  applicationId?: string
  transcript: TranscriptEntry[]
  contactName?: string
}

export function createEscalation(input: CreateEscalationInput): Escalation {
  escalationCounter += 1
  const app = input.applicationId ? findApplication(input.applicationId) : undefined

  const headlineKey =
    input.reason === "status_unclear"
      ? "headline_status_unclear"
      : input.reason === "needs_correction"
        ? "headline_needs_correction"
        : input.reason === "documents_problem"
          ? "headline_documents_problem"
          : input.reason === "dispute"
            ? "headline_dispute"
            : "headline_other"

  const escalation: Escalation = {
    id: `ESC-${escalationCounter}`,
    createdAt: new Date().toISOString(),
    status: "new",
    locale: input.locale,
    reason: input.reason,
    detail: input.detail,
    applicationId: input.applicationId,
    applicationSnapshot: app
      ? {
          type: app.type,
          currentStageKey: currentStageKey(app),
          estimatedDecisionDate: app.estimatedDecisionDate,
          assignedOffice: app.assignedOffice,
        }
      : undefined,
    summary: {
      headlineKey,
      contactName: input.contactName ?? app?.applicantName,
    },
    transcript: input.transcript,
  }

  escalations.unshift(escalation)
  return escalation
}

export function listEscalations(): Escalation[] {
  return escalations
}

export function updateEscalation(
  id: string,
  patch: Partial<Pick<Escalation, "status" | "claimedBy" | "resolvedNote">>,
): Escalation | undefined {
  const esc = escalations.find((e) => e.id === id)
  if (!esc) return undefined
  Object.assign(esc, patch)
  return esc
}
