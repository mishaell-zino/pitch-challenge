import { NextResponse } from "next/server"
import { getLLMClient } from "@/lib/llm-client"
import { buildSystemPrompt, buildRAGContext, formatApplicationForContext, getPermitRequirements } from "@/lib/rag-context"
import { findApplication, listApplications, createEscalation } from "@/lib/case-store"
import type { LLMMessage, ChatRequest } from "@/lib/llm-types"
import type { Locale } from "@/lib/types"

export async function POST(request: Request) {
  const requestId = `req-${Date.now()}`
  console.log(`\n${"=".repeat(80)}`)
  console.log(`[${requestId}] 🚀 NEW CHAT REQUEST`)
  console.log(`${"=".repeat(80)}`)
  
  try {
    const body = await request.json() as ChatRequest
    const { messages, applicationContext } = body

    console.log(`[${requestId}] 📥 Request received:`)
    console.log(`[${requestId}]   - Messages count: ${messages.length}`)
    console.log(`[${requestId}]   - Application context: ${applicationContext?.join(", ") || "none"}`)
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
        requestId
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
async function handleFunctionCall(name: string, args: Record<string, any>, requestId: string) {
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
      
      const escalation = createEscalation({
        locale: "en" as Locale,
        reason: args.reason,
        detail: args.details,
        transcript: [],
      })
      
      console.log(`[${requestId}]   ✅ Escalation created: ${escalation.id}`)
      return {
        success: true,
        escalationId: escalation.id,
        message: `Your request has been escalated to a caseworker. Reference number: ${escalation.id}`,
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
