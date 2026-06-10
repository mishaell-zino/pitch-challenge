"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Search,
  ClipboardList,
  UserRound,
  RefreshCw,
  Send,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  AlertTriangle,
  CheckCheck,
  Building,
  Hammer,
  Trash2,
  Map,
} from "lucide-react"
import { useSettings } from "@/components/settings-provider"
import { MessageBubble } from "./message-bubble"
import { QuickReplies, type QuickReply } from "./quick-replies"
import { StatusTimeline } from "./status-timeline"
import { ApplyDocs, ApplyFee, ApplyReady, EscalationSummary } from "./apply-widgets"
import {
  buildTranscript,
  nextId,
  type ChatMessage,
  type ConversationState,
  type Step,
} from "@/lib/conversation"
import type { Application, EscalationReason, PermitType } from "@/lib/types"

const PERMIT_TYPES: { type: PermitType; icon: typeof Building }[] = [
  { type: "building_permit", icon: Building },
  { type: "renovation", icon: Hammer },
  { type: "demolition", icon: Trash2 },
  { type: "zoning_variance", icon: Map },
]

const ESC_REASONS: EscalationReason[] = [
  "status_unclear",
  "needs_correction",
  "documents_problem",
  "dispute",
  "other",
]

function welcomeState(): ConversationState {
  return {
    step: "welcome",
    messages: [
      { id: nextId(), role: "bot", textKey: "welcome.greeting" },
      { id: nextId(), role: "bot", textKey: "welcome.prompt" },
    ],
  }
}

export function CitizenChat() {
  const { t, dir } = useSettings()
  const [state, setState] = useState<ConversationState>(welcomeState)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)

  // Resolve a message's display text (key -> translation, or raw echo).
  const resolveText = useCallback(
    (m: ChatMessage) => (m.textKey ? t(m.textKey, m.textVars) : (m.text ?? "")),
    [t],
  )

  // Auto-scroll to newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [state.messages])

  const pushBot = useCallback(
    (msgs: Omit<ChatMessage, "id" | "role">[]) =>
      msgs.map((m) => ({ ...m, id: nextId(), role: "bot" as const })),
    [],
  )

  const addCitizen = (text: string): ChatMessage => ({ id: nextId(), role: "citizen", text })

  // ----- Flow: status lookup -----
  const lookupStatus = useCallback(
    async (ref: string) => {
      setLoading(true)
      try {
        const res = await fetch(`/api/applications?ref=${encodeURIComponent(ref)}`)
        if (res.ok) {
          const data = (await res.json()) as { application: Application }
          const app = data.application
          setState((s) => ({
            ...s,
            step: "status_result",
            linkedApplicationId: app.id,
            messages: [
              ...s.messages,
              ...pushBot([
                { textKey: "status.found" },
                { textKey: "status.timelineTitle", widget: { kind: "status", application: app } },
                { textKey: "status.followupTitle" },
              ]),
            ],
          }))
        } else {
          setState((s) => ({
            ...s,
            step: "status_notFound",
            messages: [...s.messages, ...pushBot([{ textKey: "status.notFound" }])],
          }))
        }
      } finally {
        setLoading(false)
      }
    },
    [pushBot],
  )

  // ----- Flow: escalation submit -----
  const submitEscalation = useCallback(
    async (reason: EscalationReason, detail: string, name?: string) => {
      setLoading(true)
      try {
        // Build transcript from everything said so far, in the citizen's language.
        const transcript = buildTranscript(state.messages, resolveText)
        const res = await fetch("/api/escalations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale: document.documentElement.lang,
            reason,
            detail,
            applicationId: state.linkedApplicationId,
            contactName: name,
            transcript,
          }),
        })
        const data = (await res.json()) as { escalation: { id: string } }
        setState((s) => ({
          ...s,
          step: "esc_done",
          messages: [
            ...s.messages,
            ...pushBot([
              {
                textKey: "esc.sent",
                textVars: { id: data.escalation.id },
                widget: { kind: "escSent", escalationId: data.escalation.id },
              },
              { textKey: "esc.sentNote" },
            ]),
          ],
        }))
      } finally {
        setLoading(false)
      }
    },
    [pushBot, resolveText, state.messages, state.linkedApplicationId],
  )

  // ----- Quick reply handler (the main interaction path) -----
  const handleQuickReply = useCallback(
    (id: string) => {
      const s = state

      // Global: main menu choices
      if (s.step === "welcome") {
        if (id === "status") {
          setState((p) => ({
            ...p,
            step: "status_askRef",
            messages: [...p.messages, addCitizen(t("menu.status")), ...pushBot([{ textKey: "status.askRef" }])],
          }))
        } else if (id === "apply") {
          setState((p) => ({
            ...p,
            step: "apply_pickType",
            messages: [
              ...p.messages,
              addCitizen(t("menu.apply")),
              ...pushBot([{ textKey: "apply.intro" }, { textKey: "apply.whatType" }]),
            ],
          }))
        } else if (id === "human") {
          setState((p) => ({
            ...p,
            step: "esc_reason",
            messages: [
              ...p.messages,
              addCitizen(t("menu.human")),
              ...pushBot([{ textKey: "esc.intro" }, { textKey: "esc.askReason" }]),
            ],
          }))
        }
        return
      }

      // Status: no reference -> offer human
      if (s.step === "status_askRef" && id === "noRef") {
        setState((p) => ({
          ...p,
          step: "esc_reason",
          escReason: "status_unclear",
          messages: [
            ...p.messages,
            addCitizen(t("status.noRef")),
            ...pushBot([{ textKey: "status.refHelp" }, { textKey: "esc.askReason" }]),
          ],
        }))
        return
      }

      // Status not found -> try again or human
      if (s.step === "status_notFound") {
        if (id === "tryAgain") {
          setState((p) => ({
            ...p,
            step: "status_askRef",
            messages: [...p.messages, ...pushBot([{ textKey: "status.askRef" }])],
          }))
        } else if (id === "human") {
          setState((p) => ({
            ...p,
            step: "esc_reason",
            messages: [...p.messages, addCitizen(t("menu.human")), ...pushBot([{ textKey: "esc.askReason" }])],
          }))
        }
        return
      }

      // Status result -> follow ups
      if (s.step === "status_result") {
        if (id === "explain") {
          // Explain the current stage.
          setState((p) => ({
            ...p,
            messages: [
              ...p.messages,
              addCitizen(t("status.explainStage")),
              ...pushBot([{ textKey: `status.explain.${currentStageOf(p)}` }]),
            ],
          }))
        } else if (id === "notRight") {
          setState((p) => ({
            ...p,
            step: "esc_reason",
            escReason: "needs_correction",
            messages: [
              ...p.messages,
              addCitizen(t("status.notRight")),
              ...pushBot([{ textKey: "esc.intro" }, { textKey: "esc.askReason" }]),
            ],
          }))
        } else if (id === "done") {
          resetConversation()
        }
        return
      }

      // Apply: pick a permit type
      if (s.step === "apply_pickType") {
        const permit = id as PermitType
        setState((p) => ({
          ...p,
          step: "apply_docs",
          applyPermit: permit,
          messages: [
            ...p.messages,
            addCitizen(t(`permit.apply.${permit}`)),
            ...pushBot([{ textKey: "apply.docsTitle", widget: { kind: "applyDocs", permit } }]),
          ],
        }))
        return
      }

      // Apply: step through docs -> fee -> ready
      if (s.step === "apply_docs" && s.applyPermit) {
        if (id === "next") {
          const permit = s.applyPermit
          setState((p) => ({
            ...p,
            step: "apply_fee",
            messages: [...p.messages, ...pushBot([{ textKey: "apply.feeTitle", widget: { kind: "applyFee", permit } }])],
          }))
        } else if (id === "human") goHuman(s.applyPermit)
        return
      }
      if (s.step === "apply_fee" && s.applyPermit) {
        if (id === "next") {
          const permit = s.applyPermit
          setState((p) => ({
            ...p,
            step: "apply_ready",
            messages: [...p.messages, ...pushBot([{ textKey: "apply.readyTitle", widget: { kind: "applyReady", permit } }])],
          }))
        } else if (id === "back") {
          setState((p) => ({ ...p, step: "apply_docs" }))
        } else if (id === "human") goHuman(s.applyPermit)
        return
      }
      if (s.step === "apply_ready") {
        if (id === "start") {
          setState((p) => ({
            ...p,
            messages: [...p.messages, addCitizen(t("apply.startNow")), ...pushBot([{ textKey: "apply.startedNote" }])],
          }))
        } else if (id === "human") goHuman(s.applyPermit)
        else if (id === "back") setState((p) => ({ ...p, step: "apply_fee" }))
        return
      }

      // Escalation: pick a reason
      if (s.step === "esc_reason") {
        const reason = id as EscalationReason
        setState((p) => ({
          ...p,
          step: "esc_askName",
          escReason: reason,
          messages: [...p.messages, addCitizen(t(`esc.reason.${reason}`)), ...pushBot([{ textKey: "esc.askName" }])],
        }))
        return
      }

      // Escalation: skip name -> confirm
      if (s.step === "esc_askName" && id === "skip") {
        showEscConfirm(s.escReason!, undefined)
        return
      }

      // Escalation confirm
      if (s.step === "esc_confirm") {
        if (id === "send" && s.escReason) {
          submitEscalation(s.escReason, t(`esc.reason.${s.escReason}`), s.escName)
        } else if (id === "cancel") {
          resetConversation()
        }
        return
      }

      // Done
      if (s.step === "esc_done" && id === "restart") {
        resetConversation()
      }
    },
    [state, t, pushBot, submitEscalation],
  )

  const goHuman = (permit?: PermitType) => {
    setState((p) => ({
      ...p,
      step: "esc_reason",
      messages: [...p.messages, addCitizen(t("apply.helpComplete")), ...pushBot([{ textKey: "esc.intro" }, { textKey: "esc.askReason" }])],
    }))
  }

  const showEscConfirm = (reason: EscalationReason, name?: string) => {
    setState((p) => ({
      ...p,
      step: "esc_confirm",
      escName: name,
      messages: [
        ...p.messages,
        ...pushBot([
          {
            textKey: "esc.confirmTitle",
            widget: { kind: "escConfirm", reason, detail: t(`esc.reason.${reason}`), applicationId: p.linkedApplicationId, name },
          },
        ]),
      ],
    }))
  }

  function currentStageOf(_s: ConversationState): string {
    // We don't keep the full app object in state to stay lean; the explanation
    // keys cover all stages and the widget already shows the precise one.
    // Default to plan_review which is the most common "what does this mean" case.
    const statusMsg = _s.messages.find((m) => m.widget?.kind === "status")
    if (statusMsg && statusMsg.widget?.kind === "status") {
      return statusMsg.widget.application.stages.find((st) => st.status === "current")?.key ?? "plan_review"
    }
    return "plan_review"
  }

  const resetConversation = () => {
    setState(welcomeState())
    setInput("")
  }

  // ----- Free-text submit (typing) -----
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    const value = input.trim()
    if (!value) return
    setInput("")

    if (state.step === "status_askRef") {
      setState((p) => ({ ...p, messages: [...p.messages, addCitizen(value)] }))
      lookupStatus(value)
      return
    }
    if (state.step === "esc_askName") {
      setState((p) => ({ ...p, messages: [...p.messages, addCitizen(value)] }))
      showEscConfirm(state.escReason!, value)
      return
    }
    // Fallback: treat any free text as a request for a person, with their words preserved.
    setState((p) => ({
      ...p,
      step: "esc_reason",
      messages: [...p.messages, addCitizen(value), ...pushBot([{ textKey: "esc.intro" }, { textKey: "esc.askReason" }])],
    }))
  }

  // ----- Derive quick replies + whether typing is allowed for current step -----
  const { quickReplies, allowInput } = useMemo(() => {
    const qr: QuickReply[] = []
    let typing = false
    switch (state.step) {
      case "welcome":
        qr.push(
          { id: "status", label: t("menu.status"), icon: Search, tone: "primary" },
          { id: "apply", label: t("menu.apply"), icon: ClipboardList },
          { id: "human", label: t("menu.human"), icon: UserRound },
        )
        break
      case "status_askRef":
        typing = true
        qr.push({ id: "noRef", label: t("status.noRef"), icon: HelpCircle, tone: "muted" })
        break
      case "status_notFound":
        qr.push(
          { id: "tryAgain", label: t("status.tryAgain"), icon: RefreshCw, tone: "primary" },
          { id: "human", label: t("menu.human"), icon: UserRound },
        )
        break
      case "status_result":
        qr.push(
          { id: "explain", label: t("status.explainStage"), icon: HelpCircle, tone: "primary" },
          { id: "notRight", label: t("status.notRight"), icon: AlertTriangle },
          { id: "done", label: t("status.done"), icon: CheckCheck, tone: "muted" },
        )
        break
      case "apply_pickType":
        PERMIT_TYPES.forEach(({ type, icon }) =>
          qr.push({ id: type, label: t(`permit.apply.${type}`), icon }),
        )
        break
      case "apply_docs":
        qr.push(
          { id: "next", label: t("apply.next"), icon: dir === "rtl" ? ChevronLeft : ChevronRight, tone: "primary" },
          { id: "human", label: t("menu.human"), icon: UserRound, tone: "muted" },
        )
        break
      case "apply_fee":
        qr.push(
          { id: "next", label: t("apply.next"), icon: dir === "rtl" ? ChevronLeft : ChevronRight, tone: "primary" },
          { id: "back", label: t("apply.back") },
          { id: "human", label: t("menu.human"), icon: UserRound, tone: "muted" },
        )
        break
      case "apply_ready":
        qr.push(
          { id: "start", label: t("apply.startNow"), icon: ClipboardList, tone: "primary" },
          { id: "human", label: t("apply.helpComplete"), icon: UserRound },
          { id: "back", label: t("apply.back"), tone: "muted" },
        )
        break
      case "esc_reason":
        ESC_REASONS.forEach((r) => qr.push({ id: r, label: t(`esc.reason.${r}`) }))
        break
      case "esc_askName":
        typing = true
        qr.push({ id: "skip", label: t("esc.skipName"), icon: ChevronRight, tone: "muted" })
        break
      case "esc_confirm":
        qr.push(
          { id: "send", label: t("esc.confirmSend"), icon: Send, tone: "primary" },
          { id: "cancel", label: t("esc.cancel"), tone: "muted" },
        )
        break
      case "esc_done":
        qr.push({ id: "restart", label: t("composer.restart"), icon: RefreshCw, tone: "primary" })
        break
    }
    return { quickReplies: qr, allowInput: typing }
  }, [state.step, t, dir])

  const renderWidget = (m: ChatMessage) => {
    const w = m.widget
    if (!w || w.kind === "none") return null
    switch (w.kind) {
      case "status":
        return <StatusTimeline application={w.application} />
      case "applyDocs":
        return <ApplyDocs permit={w.permit} />
      case "applyFee":
        return <ApplyFee permit={w.permit} />
      case "applyReady":
        return <ApplyReady permit={w.permit} />
      case "escConfirm":
        return (
          <EscalationSummary reason={w.reason} detail={w.detail} applicationId={w.applicationId} name={w.name} />
        )
      case "escSent":
        return null
      default:
        return null
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Message stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-6" id="conversation">
        <div className="mx-auto flex max-w-3xl flex-col gap-4">
          {state.messages.map((m) => {
            const text = m.textKey ? t(m.textKey, m.textVars) : m.text
            const widget = renderWidget(m)
            // For widget-bearing bot messages, show the lead text then the card.
            const hasWidget = !!widget
            return (
              <MessageBubble
                key={m.id}
                role={m.role}
                text={hasWidget ? undefined : text}
                speakText={text}
              >
                {hasWidget && (
                  <div className="flex flex-col gap-2">
                    <p className="text-base leading-relaxed text-pretty">{text}</p>
                    {widget}
                  </div>
                )}
              </MessageBubble>
            )
          })}
          {loading && (
            <div className="flex items-center gap-1.5 ps-2 text-muted-foreground" aria-live="polite">
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
              <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* Screen-reader live region announcing the latest bot message */}
      <div ref={liveRef} className="sr-only" aria-live="polite" aria-atomic="true">
        {(() => {
          const lastBot = [...state.messages].reverse().find((m) => m.role === "bot")
          return lastBot ? (lastBot.textKey ? t(lastBot.textKey, lastBot.textVars) : lastBot.text) : ""
        })()}
      </div>

      {/* Composer: quick replies first (primary path), typing secondary */}
      <div className="border-t border-border bg-card/80 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-3">
          {quickReplies.length > 0 && (
            <QuickReplies replies={quickReplies} onSelect={handleQuickReply} ariaLabel={t("composer.orChoose")} />
          )}

          <form onSubmit={handleSend} className="flex items-center gap-2">
            <label htmlFor="composer" className="sr-only">
              {t("composer.placeholder")}
            </label>
            <input
              id="composer"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("composer.placeholder")}
              autoComplete="off"
              inputMode={state.step === "status_askRef" ? "text" : "text"}
              className="min-h-12 flex-1 rounded-xl border border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label={t("composer.send")}
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
            >
              <Send className="size-5 rtl:-scale-x-100" aria-hidden="true" />
            </button>
          </form>

          {state.step !== "welcome" && (
            <button
              type="button"
              onClick={resetConversation}
              className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="size-3.5" aria-hidden="true" />
              {t("composer.restart")}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
