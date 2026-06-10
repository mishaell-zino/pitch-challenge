import type { Application, EscalationReason, PermitType, TranscriptEntry } from "@/lib/types"

// A rendered chat item. Bot messages can carry a rich "widget" to display
// (status timeline, escalation summary, etc.) in addition to text.
export type Widget =
  | { kind: "none" }
  | { kind: "status"; application: Application }
  | { kind: "applyDocs"; permit: PermitType }
  | { kind: "applyFee"; permit: PermitType }
  | { kind: "applyReady"; permit: PermitType }
  | { kind: "escConfirm"; reason: EscalationReason; detail: string; applicationId?: string; name?: string }
  | { kind: "escSent"; escalationId: string }

export interface ChatMessage {
  id: string
  role: "bot" | "citizen"
  // translation key OR raw text (raw when echoing citizen free-text input)
  text?: string
  textKey?: string
  textVars?: Record<string, string>
  widget?: Widget
}

// The conversation "screen" the citizen is currently on. Drives which quick
// replies and input affordances are shown.
export type Step =
  | "welcome"
  | "status_askRef"
  | "status_result"
  | "status_notFound"
  | "apply_pickType"
  | "apply_docs"
  | "apply_fee"
  | "apply_ready"
  | "esc_reason"
  | "esc_askName"
  | "esc_confirm"
  | "esc_done"

export interface ConversationState {
  step: Step
  messages: ChatMessage[]
  // The application discovered during a status lookup, carried into escalation
  // so the caseworker gets it for free.
  linkedApplicationId?: string
  // Permit type chosen during the apply flow.
  applyPermit?: PermitType
  // Escalation working values.
  escReason?: EscalationReason
  escName?: string
}

let idCounter = 0
export function nextId(): string {
  idCounter += 1
  return `m${idCounter}`
}

// Build a transcript (in the citizen's language) from rendered messages, for
// hand-off to the caseworker. `resolve` turns keys into displayed text.
export function buildTranscript(
  messages: ChatMessage[],
  resolve: (m: ChatMessage) => string,
): TranscriptEntry[] {
  const now = new Date().toISOString()
  return messages
    .filter((m) => m.text || m.textKey)
    .map((m) => ({
      role: m.role,
      text: resolve(m),
      at: now,
    }))
}
