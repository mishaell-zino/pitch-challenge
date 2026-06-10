"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Bot, User, Loader2 } from "lucide-react"
import type { Application } from "@/lib/types"
import type { LLMMessage } from "@/lib/llm-types"
import { StatusTimeline } from "@/components/citizen/status-timeline"
import { SuggestedActions } from "./suggested-actions"
import { getSuggestedActions, detectSuggestionContext, type SuggestionContext } from "@/lib/suggested-actions"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  application?: Application
  hasRequirements?: boolean
  timestamp: Date
}

interface AIChatInterfaceProps {
  selectedApplication?: Application
}

export function AIChatInterface({ selectedApplication }: AIChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [suggestionContext, setSuggestionContext] = useState<SuggestionContext>("welcome")
  const [lastFunctionCall, setLastFunctionCall] = useState<string>()

  // Initialize welcome message on client side only to avoid hydration mismatch
  useEffect(() => {
    if (!isInitialized) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hello! I'm your AI permit assistant. I can help you check application status, understand permit requirements, and answer questions about the permit process. How can I help you today?",
          timestamp: new Date(),
        },
      ])
      setIsInitialized(true)
    }
  }, [isInitialized])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Update suggestion context when messages change
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1]
      const newContext = detectSuggestionContext(
        messages.length,
        lastMessage,
        lastFunctionCall
      )
      setSuggestionContext(newContext)
    }
  }, [messages, lastFunctionCall])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages])

  // When an application is selected from sidebar, inject it into chat
  useEffect(() => {
    if (selectedApplication) {
      const msg: Message = {
        id: `app-${selectedApplication.id}-${Date.now()}`,
        role: "assistant",
        content: `Here's the status of your application ${selectedApplication.id}:`,
        application: selectedApplication,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, msg])
    }
  }, [selectedApplication])

  // Handle suggested action click
  const handleActionClick = useCallback((prompt: string) => {
    console.log(`[Action Click] Prompt: "${prompt}"`)
    setInput(prompt)
    // Trigger form submission
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) {
        form.requestSubmit()
      }
    }, 0)
  }, [])

  const sendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    const messageId = `msg-${Date.now()}`
    console.log(`\n${"=".repeat(80)}`)
    console.log(`[${messageId}] 💬 USER SENT MESSAGE`)
    console.log(`${"=".repeat(80)}`)
    console.log(`[${messageId}] 📝 Message: "${text}"`)
    console.log(`[${messageId}] 📊 Current conversation length: ${messages.length} messages`)
    console.log(`[${messageId}] 🔗 Selected application: ${selectedApplication?.id || "none"}`)

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // Build conversation history for LLM
      console.log(`[${messageId}] 🔄 Building conversation history...`)
      const llmMessages: LLMMessage[] = messages
        .filter(m => m.id !== "welcome") // Exclude welcome message
        .map(m => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        }))
      console.log(`[${messageId}]   - Filtered ${messages.length} → ${llmMessages.length} messages`)

      // Add current user message
      llmMessages.push({
        role: "user",
        content: text,
      })
      console.log(`[${messageId}]   - Total messages for API: ${llmMessages.length}`)

      // Call AI chat API
      console.log(`[${messageId}] 🌐 Calling /api/ai-chat...`)
      const requestBody = {
        messages: llmMessages,
        applicationContext: selectedApplication ? [selectedApplication.id] : undefined,
      }
      console.log(`[${messageId}]   - Request body:`, JSON.stringify(requestBody, null, 2))
      
      const startTime = Date.now()
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      })
      const duration = Date.now() - startTime
      
      console.log(`[${messageId}] ✅ API response received (${duration}ms)`)
      console.log(`[${messageId}]   - Status: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[${messageId}] ❌ API error:`, errorText)
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      console.log(`[${messageId}] 📦 Response data:`, JSON.stringify(data, null, 2))

      // Handle function call results
      if (data.functionResult) {
        console.log(`[${messageId}] 🔧 Processing function result...`)
        console.log(`[${messageId}]   - Function: ${data.functionCall?.name}`)
        console.log(`[${messageId}]   - Success: ${data.functionResult.success}`)
        
        if (data.functionResult.application) {
          console.log(`[${messageId}] 📋 Displaying application: ${data.functionResult.application.id}`)
          setLastFunctionCall("lookup_application")
          // Show application status
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.message || `Here's the status of application ${data.functionResult.application.id}:`,
            application: data.functionResult.application,
            timestamp: new Date(),
          }
          console.log(`[${messageId}] ✅ Added application message to chat`)
          setMessages(prev => [...prev, assistantMessage])
        } else if (data.functionResult.requirements) {
          console.log(`[${messageId}] 📋 Displaying permit requirements: ${data.functionResult.requirements.type}`)
          setLastFunctionCall("get_permit_requirements")
          // Show permit requirements
          const req = data.functionResult.requirements
          const content = `**${req.type} Requirements:**

**Documents Needed:**
${req.documents.map((d: string) => `• ${d}`).join("\n")}

**Fees:** ${req.fees}

**Timeline:** ${req.timeline}

Would you like help with anything else?`
          
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content,
            hasRequirements: true,
            timestamp: new Date(),
          }
          console.log(`[${messageId}] ✅ Added requirements message to chat`)
          setMessages(prev => [...prev, assistantMessage])
        } else if (data.functionResult.escalationId) {
          console.log(`[${messageId}] 🚨 Displaying escalation confirmation: ${data.functionResult.escalationId}`)
          // Show escalation confirmation
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.functionResult.message,
            timestamp: new Date(),
          }
          console.log(`[${messageId}] ✅ Added escalation message to chat`)
          setMessages(prev => [...prev, assistantMessage])
        } else {
          console.log(`[${messageId}] 📝 Displaying generic function result`)
          // Generic function result
          const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: data.message || "I've processed your request.",
            timestamp: new Date(),
          }
          console.log(`[${messageId}] ✅ Added generic message to chat`)
          setMessages(prev => [...prev, assistantMessage])
        }
      } else {
        console.log(`[${messageId}] 💬 Displaying text response`)
        console.log(`[${messageId}]   - Message preview: "${data.message.substring(0, 100)}..."`)
        // Regular text response
        const assistantMessage: Message = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.message,
          timestamp: new Date(),
        }
        console.log(`[${messageId}] ✅ Added text message to chat`)
        setMessages(prev => [...prev, assistantMessage])
      }
      console.log(`[${messageId}] ✅ Message processing complete`)
      console.log(`${"=".repeat(80)}\n`)
    } catch (error) {
      console.error(`[${messageId}] ❌ ERROR:`, error)
      console.error(`[${messageId}] Stack trace:`, error instanceof Error ? error.stack : "N/A")
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again or contact support if the problem persists.",
        timestamp: new Date(),
      }
      console.log(`[${messageId}] ⚠️ Added error message to chat`)
      setMessages(prev => [...prev, errorMessage])
      console.log(`${"=".repeat(80)}\n`)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
      console.log(`[${messageId}] 🏁 Request complete`)
    }
  }, [input, loading, messages, selectedApplication])

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-3",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "assistant" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bot className="size-5" />
                </div>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {msg.content}
                </p>

                {msg.application && (
                  <div className="mt-3">
                    <StatusTimeline application={msg.application} />
                  </div>
                )}

                <p className="mt-2 text-xs opacity-60" suppressHydrationWarning>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {msg.role === "user" && (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <User className="size-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Thinking...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Suggested Actions */}
      {!loading && (
        <div className="border-t border-border bg-card/50 px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <SuggestedActions
              actions={getSuggestedActions(suggestionContext)}
              onActionClick={handleActionClick}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card/80 px-4 py-4 backdrop-blur">
        <form onSubmit={sendMessage} className="mx-auto flex max-w-3xl gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about permits, check status, or get help..."
            disabled={loading}
            className="min-h-12 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="size-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

// Made with Bob
