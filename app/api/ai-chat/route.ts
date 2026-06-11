import { NextResponse } from "next/server"
import { getLLMClient } from "@/lib/llm-client"
import { buildSystemPrompt, buildRAGContext, formatApplicationForContext, getPermitRequirements } from "@/lib/rag-context"
import { findApplication, listApplications, createEscalation } from "@/lib/case-store"
import { translate } from "@/lib/i18n"
import type { LLMMessage, ChatRequest } from "@/lib/llm-types"
import type { Locale, TranscriptEntry } from "@/lib/types"

export async function POST(request: Request) {
  const requestId = `req-${Date.now()}`
  console.log(`\n${"=".repeat(80)}`)
  console.log(`[${requestId}] 🚀 NEW CHAT REQUEST`)
  console.log(`${"=".repeat(80)}`)
  
  try {
    const body = await request.json() as ChatRequest
    const { messages, applicationContext, locale = "en" } = body

    console.log(`[${requestId}] 📥 Request received:`)
    console.log(`[${requestId}]   - Messages count: ${messages.length}`)
    console.log(`[${requestId}]   - Application context: ${applicationContext?.join(", ") || "none"}`)
    console.log(`[${requestId}]   - Locale: ${locale}`)
    console.log(`[${requestId}]   - Last user message: "${messages[messages.length - 1]?.content.substring(0, 100)}..."`)

    // Build RAG context
    console.log(`[${requestId}] 🔍 Building RAG context...`)
    const ragContext = buildRAGContext(applicationContext)
    console.log(`[${requestId}]   - Applications in context: ${ragContext.applications.length}`)
    console.log(`[${requestId}]   - Permit requirements: ${ragContext.permitRequirements ? "yes" : "no"}`)
    
    // Add system prompt with RAG context
    console.log(`[${requestId}] 📝 Building system prompt...`)
    const systemPrompt = buildSystemPrompt(ragContext)
    console.log(`[${requestId}]   - System prompt length: ${systemPrompt.length} chars`)
    
    const messagesWithSystem: LLMMessage[] = [
      { role: "system", content: systemPrompt },
      ...messages,
    ]
    console.log(`[${requestId}]   - Total messages to LLM: ${messagesWithSystem.length}`)

    // Get LLM response
    console.log(`[${requestId}] 🤖 Calling LLM client...`)
    const llmClient = getLLMClient()
    const response = await llmClient.chat(messagesWithSystem)
    console.log(`[${requestId}] ✅ LLM response received`)
    console.log(`[${requestId}]   - Has function call: ${!!response.functionCall}`)
    if (response.functionCall) {
      console.log(`[${requestId}]   - Function name: ${response.functionCall.name}`)
      console.log(`[${requestId}]   - Function args:`, JSON.stringify(response.functionCall.arguments, null, 2))
    }
    console.log(`[${requestId}]   - Message preview: "${response.message.substring(0, 100)}..."`)

    // Handle function calls
    if (response.functionCall) {
      console.log(`[${requestId}] 🔧 Handling function call: ${response.functionCall.name}`)
      const functionResult = await handleFunctionCall(
        response.functionCall.name,
        response.functionCall.arguments,
        requestId,
        locale
      )
      console.log(`[${requestId}] ✅ Function executed successfully`)
      console.log(`[${requestId}]   - Result:`, JSON.stringify(functionResult, null, 2))

      // Return both the function result and a follow-up message
      const responseData = {
        message: response.message,
        functionCall: response.functionCall,
        functionResult,
      }
      console.log(`[${requestId}] 📤 Sending response with function result`)
      console.log(`${"=".repeat(80)}\n`)
      return NextResponse.json(responseData)
    }

    console.log(`[${requestId}] 📤 Sending text response`)
    console.log(`${"=".repeat(80)}\n`)
    return NextResponse.json({
      message: response.message,
    })
  } catch (error) {
    console.error(`[${requestId}] ❌ ERROR:`, error)
    console.error(`[${requestId}] Stack trace:`, error instanceof Error ? error.stack : "N/A")
    console.log(`${"=".repeat(80)}\n`)
    return NextResponse.json(
      { error: "Failed to process chat request" },
      { status: 500 }
    )
  }
}

/**
 * Handle function/tool calls from the LLM
 */
async function handleFunctionCall(name: string, args: Record<string, any>, requestId: string, locale: Locale = "en") {
  console.log(`[${requestId}]   🔧 Executing function: ${name}`)
  console.log(`[${requestId}]   📋 Arguments:`, JSON.stringify(args, null, 2))
  
  switch (name) {
    case "lookup_application": {
      console.log(`[${requestId}]   🔍 Looking up application: ${args.reference}`)
      const app = findApplication(args.reference)
      if (!app) {
        console.log(`[${requestId}]   ❌ Application not found: ${args.reference}`)
        return {
          success: false,
          message: `Application ${args.reference} not found. Please check the reference number and try again.`,
        }
      }
      console.log(`[${requestId}]   ✅ Application found: ${app.id} (${app.type})`)
      console.log(`[${requestId}]   📊 Current stage: ${app.stages.find(s => s.status === "current")?.key}`)
      return {
        success: true,
        application: app,
        formatted: formatApplicationForContext(app),
      }
    }

    case "get_permit_requirements": {
      console.log(`[${requestId}]   📋 Getting requirements for: ${args.type}`)
      const requirements = getPermitRequirements(args.type)
      console.log(`[${requestId}]   ✅ Requirements retrieved`)
      console.log(`[${requestId}]   📄 Documents needed: ${requirements.documents.length}`)
      return {
        success: true,
        requirements,
      }
    }

    case "list_applications": {
      console.log(`[${requestId}]   📋 Listing all applications`)
      const apps = listApplications()
      console.log(`[${requestId}]   ✅ Found ${apps.length} applications`)
      const result = {
        success: true,
        applications: apps.map(app => ({
          id: app.id,
          type: app.type,
          address: app.address,
          currentStage: app.stages.find(s => s.status === "current")?.key,
        })),
      }
      console.log(`[${requestId}]   📊 Applications:`, result.applications.map(a => a.id).join(", "))
      return result
    }

    case "escalate_to_human": {
      console.log(`[${requestId}]   🚨 Creating escalation`)
      console.log(`[${requestId}]   📋 Reason: ${args.reason}`)
      console.log(`[${requestId}]   💬 Details: ${args.details}`)
      console.log(`[${requestId}]   📝 Conversation messages: ${args.conversationHistory?.length || 0}`)
      
      // Summarize conversation using LLM
      let summary = args.details || "User requested to speak with a caseworker"
      let transcript: TranscriptEntry[] = []
      
      if (args.conversationHistory && args.conversationHistory.length > 0) {
        console.log(`[${requestId}]   🤖 Generating conversation summary...`)
        try {
          const summaryPrompt = `Summarize the following conversation between a citizen and an AI assistant. Focus on:
1. What the citizen needs help with
2. Key details mentioned (application IDs, permit types, specific issues)
3. Any outstanding questions or concerns

Keep the summary concise (2-3 sentences) and professional.

Conversation:
${args.conversationHistory.map((msg: any) => `${msg.role === 'user' ? 'Citizen' : 'Assistant'}: ${msg.content}`).join('\n')}

Summary:`

          const llmClient = getLLMClient()
          const summaryResponse = await llmClient.chat([
            { role: "user", content: summaryPrompt }
          ])
          
          summary = summaryResponse.message.trim()
          console.log(`[${requestId}]   ✅ Summary generated: "${summary.substring(0, 100)}..."`)
        } catch (error) {
          console.error(`[${requestId}]   ❌ Failed to generate summary:`, error)
          // Fall back to basic summary
        }
        
        // Convert conversation to transcript format
        transcript = args.conversationHistory.map((msg: any) => ({
          role: msg.role === 'user' ? 'citizen' as const : 'bot' as const,
          text: msg.content,
        }))
        console.log(`[${requestId}]   📋 Transcript entries: ${transcript.length}`)
      }
      
      const escalation = createEscalation({
        locale,
        reason: args.reason,
        detail: summary,
        transcript,
      })
      
      console.log(`[${requestId}]   ✅ Escalation created: ${escalation.id}`)
      console.log(`[${requestId}]   📊 Summary: "${summary}"`)
      console.log(`[${requestId}]   📝 Full transcript: ${transcript.length} messages`)
      
      // Use translated escalation success message
      const translatedMessage = translate(locale, "ai.escalation.success", { id: escalation.id })
      
      return {
        success: true,
        escalationId: escalation.id,
        summary,
        message: translatedMessage,
      }
    }

    default:
      console.log(`[${requestId}]   ❌ Unknown function: ${name}`)
      return {
        success: false,
        message: `Unknown function: ${name}`,
      }
  }
}

// Made with Bob
