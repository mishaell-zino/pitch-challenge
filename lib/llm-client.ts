import type { LLMMessage, ChatResponse, ToolCall } from "./llm-types"

/**
 * LLM Client wrapper - supports IBM Consulting Advantage (ICA) API
 * Based on OpenAPI spec: openapi.yaml
 *
 * Configuration via environment variables:
 * - ICA_API_KEY: Your ICA developer API key (from Settings → API Keys → ICA APIs)
 * - ICA_MODEL: Model ID from the namespace (e.g., agent-finance-helper)
 * - ICA_NAMESPACE: API namespace (assistants, agents, digital-workforce, or chat-models)
 */

const ICA_BASE_URL = "https://api.nextgen-beta.ica.ibm.com/ica/v1"
const DEFAULT_NAMESPACE = "chat-models"
const DEFAULT_MODEL = "gpt-4o"

export interface LLMClientConfig {
  apiKey?: string
  model?: string
  namespace?: "assistants" | "agents" | "digital-workforce" | "chat-models"
  maxTokens?: number
}

export class LLMClient {
  private apiKey: string
  private model: string
  private namespace: string
  private apiUrl: string
  private maxTokens: number

  constructor(config: LLMClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.ICA_API_KEY || ""
    this.model = config.model || process.env.ICA_MODEL || DEFAULT_MODEL
    this.namespace = config.namespace || (process.env.ICA_NAMESPACE as any) || DEFAULT_NAMESPACE
    this.apiUrl = `${ICA_BASE_URL}/${this.namespace}/chat/completions`
    this.maxTokens = config.maxTokens ?? 1000

    console.log(`[LLM Client] Initialized with ICA API`)
    console.log(`[LLM Client] Namespace: ${this.namespace}`)
    console.log(`[LLM Client] Model: ${this.model}`)
    console.log(`[LLM Client] API URL: ${this.apiUrl}`)
  }

  /**
   * Send chat completion request to LLM
   */
  async chat(messages: LLMMessage[]): Promise<ChatResponse> {
    if (!this.apiKey) {
      console.warn("[LLM Client] No API key configured, using mock responses")
      return this.mockResponse(messages)
    }

    try {
      console.log(`\n${"─".repeat(80)}`)
      console.log(`[LLM Client] 📤 SENDING REQUEST TO LLM`)
      console.log(`${"─".repeat(80)}`)
      console.log(`[LLM Client] 🌐 Endpoint: ${this.apiUrl}`)
      console.log(`[LLM Client] 🤖 Model: ${this.model}`)
      console.log(`[LLM Client] 📊 Max tokens: ${this.maxTokens}`)
      console.log(`[LLM Client] 💬 Messages count: ${messages.length}`)
      console.log(`\n[LLM Client] 📝 FULL MESSAGE HISTORY:`)
      messages.forEach((msg, idx) => {
        console.log(`\n[LLM Client] Message ${idx + 1}/${messages.length}:`)
        console.log(`[LLM Client]   Role: ${msg.role}`)
        console.log(`[LLM Client]   Content length: ${msg.content.length} chars`)
        console.log(`[LLM Client]   Content:`)
        console.log(`[LLM Client]   ${"-".repeat(70)}`)
        // Log content with proper indentation
        const contentLines = msg.content.split('\n')
        contentLines.forEach(line => {
          console.log(`[LLM Client]   ${line}`)
        })
        console.log(`[LLM Client]   ${"-".repeat(70)}`)
      })
      
      const requestBody = {
        model: this.model,
        messages,
        max_tokens: this.maxTokens,
        stream: false,
        tools: this.getToolDefinitions(),
        tool_choice: "auto",
      }
      
      console.log(`\n[LLM Client] 🔧 Tools available: ${this.getToolDefinitions().length}`)
      this.getToolDefinitions().forEach((tool, idx) => {
        console.log(`[LLM Client]   ${idx + 1}. ${tool.function.name}`)
      })
      
      const startTime = Date.now()
      const response = await fetch(this.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      })
      const duration = Date.now() - startTime

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`\n[LLM Client] ❌ API ERROR (${response.status}):`)
        console.error(`[LLM Client] ${errorText}`)
        console.log(`${"─".repeat(80)}\n`)
        throw new Error(`ICA API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      console.log(`\n${"─".repeat(80)}`)
      console.log(`[LLM Client] 📥 RESPONSE RECEIVED (${duration}ms)`)
      console.log(`${"─".repeat(80)}`)
      console.log(`[LLM Client] 🆔 Response ID: ${data.id}`)
      console.log(`[LLM Client] 🤖 Model used: ${data.model}`)
      console.log(`[LLM Client] 📊 Choices: ${data.choices?.length}`)
      
      if (data.usage) {
        console.log(`\n[LLM Client] 📈 TOKEN USAGE:`)
        console.log(`[LLM Client]   Prompt tokens: ${data.usage.prompt_tokens}`)
        console.log(`[LLM Client]   Completion tokens: ${data.usage.completion_tokens}`)
        console.log(`[LLM Client]   Total tokens: ${data.usage.total_tokens}`)
      }

      const choice = data.choices[0]
      
      console.log(`\n[LLM Client] 💬 RESPONSE CONTENT:`)
      console.log(`[LLM Client]   Role: ${choice.message.role}`)
      console.log(`[LLM Client]   Finish reason: ${choice.finish_reason}`)
      
      // Check if LLM wants to call a tool
      if (choice.message.tool_calls && choice.message.tool_calls.length > 0) {
        const toolCall = choice.message.tool_calls[0]
        console.log(`\n[LLM Client] 🔧 TOOL CALL REQUESTED:`)
        console.log(`[LLM Client]   Tool: ${toolCall.function.name}`)
        console.log(`[LLM Client]   Arguments:`)
        console.log(`[LLM Client]   ${JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2).split('\n').join('\n[LLM Client]   ')}`)
        
        if (choice.message.content) {
          console.log(`\n[LLM Client]   Message with tool call:`)
          console.log(`[LLM Client]   ${"-".repeat(70)}`)
          console.log(`[LLM Client]   ${choice.message.content}`)
          console.log(`[LLM Client]   ${"-".repeat(70)}`)
        }
        
        console.log(`${"─".repeat(80)}\n`)
        
        return {
          message: choice.message.content || "",
          functionCall: {
            name: toolCall.function.name,
            arguments: JSON.parse(toolCall.function.arguments),
          },
        }
      }

      // Regular text response
      console.log(`\n[LLM Client]   Content length: ${choice.message.content?.length || 0} chars`)
      console.log(`[LLM Client]   ${"-".repeat(70)}`)
      const responseLines = (choice.message.content || "").split('\n')
      responseLines.forEach((line: string) => {
        console.log(`[LLM Client]   ${line}`)
      })
      console.log(`[LLM Client]   ${"-".repeat(70)}`)
      console.log(`${"─".repeat(80)}\n`)

      return {
        message: choice.message.content || "I'm sorry, I couldn't generate a response.",
      }
    } catch (error) {
      console.error(`\n[LLM Client] ❌ ERROR:`, error)
      console.error(`[LLM Client] Stack:`, error instanceof Error ? error.stack : "N/A")
      console.log(`${"─".repeat(80)}\n`)
      return {
        message: "I'm having trouble connecting to the AI service right now. Please try again or contact a caseworker for assistance.",
      }
    }
  }

  /**
   * Define available tools/functions for the LLM
   */
  private getToolDefinitions() {
    return [
      {
        type: "function",
        function: {
          name: "lookup_application",
          description: "Look up a permit application by its reference number (e.g., BP-2024-0481)",
          parameters: {
            type: "object",
            properties: {
              reference: {
                type: "string",
                description: "The application reference number",
              },
            },
            required: ["reference"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_permit_requirements",
          description: "Get detailed requirements for a specific permit type",
          parameters: {
            type: "object",
            properties: {
              type: {
                type: "string",
                enum: ["building_permit", "renovation", "demolition", "zoning_variance"],
                description: "The type of permit",
              },
            },
            required: ["type"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "list_applications",
          description: "List all applications in the system",
          parameters: {
            type: "object",
            properties: {},
          },
        },
      },
      {
        type: "function",
        function: {
          name: "escalate_to_human",
          description: "Escalate the conversation to a human caseworker. This will summarize the conversation and create an escalation ticket.",
          parameters: {
            type: "object",
            properties: {
              reason: {
                type: "string",
                enum: ["status_unclear", "needs_correction", "documents_problem", "dispute", "other"],
                description: "The reason for escalation",
              },
              details: {
                type: "string",
                description: "Brief description of what the citizen needs help with",
              },
              conversationHistory: {
                type: "array",
                description: "The full conversation history to be included with the escalation",
                items: {
                  type: "object",
                  properties: {
                    role: {
                      type: "string",
                      enum: ["user", "assistant"],
                    },
                    content: {
                      type: "string",
                    },
                  },
                },
              },
            },
            required: ["reason", "details", "conversationHistory"],
          },
        },
      },
    ]
  }

  /**
   * Mock response for testing without API key
   */
  private mockResponse(messages: LLMMessage[]): ChatResponse {
    const lastMessage = messages[messages.length - 1]
    const userMessage = lastMessage.content.toLowerCase()

    // Simple pattern matching for demo
    if (userMessage.includes("status") || userMessage.includes("application")) {
      return {
        message: "I can help you check your application status. Could you please provide your application reference number? It should look something like BP-2024-0481.",
      }
    }

    if (userMessage.includes("permit") || userMessage.includes("apply")) {
      return {
        message: "I can help you understand permit requirements. What type of permit are you interested in? We handle building permits, renovations, demolitions, and zoning variances.",
      }
    }

    if (userMessage.match(/[A-Z]{2}-\d{4}-\d{4}/)) {
      return {
        message: "Let me look up that application for you.",
        functionCall: {
          name: "lookup_application",
          arguments: { reference: userMessage.match(/[A-Z]{2}-\d{4}-\d{4}/)?.[0] || "" },
        },
      }
    }

    return {
      message: "Hello! I'm here to help you with permit applications and status checks. How can I assist you today?",
    }
  }
}

// Singleton instance
let clientInstance: LLMClient | null = null

export function getLLMClient(): LLMClient {
  if (!clientInstance) {
    clientInstance = new LLMClient()
  }
  return clientInstance
}

// Made with Bob
