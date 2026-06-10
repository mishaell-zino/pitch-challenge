// Types for LLM-powered chat with RAG integration

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "function"
  content: string
  name?: string
  function_call?: {
    name: string
    arguments: string
  }
}

export interface ChatRequest {
  messages: LLMMessage[]
  applicationContext?: string[]
}

export interface ChatResponse {
  message: string
  functionCall?: {
    name: string
    arguments: Record<string, any>
  }
  applicationData?: any
}

export interface RAGContext {
  applications: Array<{
    id: string
    type: string
    status: string
    summary: string
  }>
  permitRequirements?: {
    type: string
    documents: string[]
    fees: string
    timeline: string
  }
  conversationHistory: string
}

export interface ToolCall {
  name: "lookup_application" | "get_permit_requirements" | "escalate_to_human" | "list_applications"
  arguments: Record<string, any>
}

// Made with Bob
