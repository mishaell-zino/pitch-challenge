import { listApplications, findApplication } from "./case-store"
import type { Application, PermitType } from "./types"
import type { RAGContext } from "./llm-types"

/**
 * Build RAG context from available data sources
 */
export function buildRAGContext(
  applicationIds?: string[],
  permitType?: PermitType
): RAGContext {
  const applications = listApplications()
  
  // Filter applications if specific IDs requested
  const relevantApps = applicationIds
    ? applications.filter(app => applicationIds.includes(app.id))
    : applications

  const appSummaries = relevantApps.map(app => ({
    id: app.id,
    type: app.type,
    status: getCurrentStageLabel(app),
    summary: `${app.type} application for ${app.address}, currently at ${getCurrentStageLabel(app)} stage`,
  }))

  const context: RAGContext = {
    applications: appSummaries,
    conversationHistory: "",
  }

  // Add permit requirements if requested
  if (permitType) {
    context.permitRequirements = getPermitRequirements(permitType)
  }

  return context
}

/**
 * Get current stage label for an application
 */
function getCurrentStageLabel(app: Application): string {
  const currentStage = app.stages.find(s => s.status === "current")
  return currentStage?.key || "unknown"
}

/**
 * Get permit requirements for a specific type
 */
export function getPermitRequirements(type: PermitType) {
  const requirements: Record<PermitType, any> = {
    building_permit: {
      type: "Building Permit",
      documents: [
        "Site plan showing property boundaries",
        "Architectural drawings (floor plans, elevations)",
        "Structural engineering plans",
        "Energy compliance calculations",
        "Proof of property ownership",
      ],
      fees: "$850 base fee + $12 per $1,000 of construction value",
      timeline: "6-8 weeks for standard residential projects",
    },
    renovation: {
      type: "Renovation Permit",
      documents: [
        "Detailed scope of work description",
        "Floor plans showing existing and proposed changes",
        "Structural plans (if load-bearing walls affected)",
        "Electrical/plumbing plans (if applicable)",
      ],
      fees: "$450 base fee + $8 per $1,000 of renovation value",
      timeline: "4-6 weeks for standard renovations",
    },
    demolition: {
      type: "Demolition Permit",
      documents: [
        "Site plan showing structure to be demolished",
        "Asbestos inspection report",
        "Utility disconnection confirmation",
        "Neighbor notification proof",
        "Waste disposal plan",
      ],
      fees: "$600 flat fee",
      timeline: "3-4 weeks",
    },
    zoning_variance: {
      type: "Zoning Variance",
      documents: [
        "Variance application form",
        "Site plan showing proposed use",
        "Written justification for variance",
        "Neighbor notification proof",
        "Photos of property and surrounding area",
      ],
      fees: "$1,200 application fee",
      timeline: "8-12 weeks (includes public hearing)",
    },
  }

  return requirements[type]
}

/**
 * Format application data for LLM context
 */
export function formatApplicationForContext(app: Application): string {
  const currentStage = app.stages.find(s => s.status === "current")
  const outstandingActions = app.outstandingActions.length > 0
    ? `Outstanding actions: ${app.outstandingActions.map(a => a.key).join(", ")}`
    : "No outstanding actions"

  return `
Application ID: ${app.id}
Type: ${app.type}
Address: ${app.address}
Submitted: ${app.submittedDate}
Current Stage: ${currentStage?.key || "unknown"}
Estimated Decision: ${app.estimatedDecisionDate}
Assigned Office: ${app.assignedOffice}
${outstandingActions}
`.trim()
}

/**
 * Build system prompt with RAG context
 */
export function buildSystemPrompt(context: RAGContext): string {
  const appsContext = context.applications.length > 0
    ? `\n\nCurrent Applications:\n${context.applications.map(app =>
        `- ${app.id}: ${app.summary}`
      ).join("\n")}`
    : ""

  const permitContext = context.permitRequirements
    ? `\n\nPermit Requirements for ${context.permitRequirements.type}:
Documents needed: ${context.permitRequirements.documents.join(", ")}
Fees: ${context.permitRequirements.fees}
Timeline: ${context.permitRequirements.timeline}`
    : ""

  return `You are a helpful government permit assistant for a city's building and planning department.

IMPORTANT: When you need to perform an action, use this exact format:
FUNCTION_CALL: function_name({"arg": "value"})

Available Functions:
1. lookup_application({"reference": "BP-2024-0481"}) - Look up application by reference number
2. get_permit_requirements({"type": "building_permit"}) - Get permit requirements (types: building_permit, renovation, demolition, zoning_variance)
3. list_applications({}) - List all applications in the system
4. escalate_to_human({"reason": "status_unclear", "details": "explanation"}) - Escalate to a caseworker

Your Responsibilities:
1. Check application status and explain the permit process
2. Explain permit requirements and documentation needed
3. Guide citizens through application procedures
4. Answer questions about fees, timelines, and next steps
5. Escalate complex issues to human caseworkers when needed

Guidelines:
- Be friendly, clear, and concise
- Use simple language
- When a citizen mentions an application reference (like BP-2024-0481), use lookup_application
- When asked about applying for a permit, ask "What kind of permit do you need?" to help them select the right type
- When asked about permit requirements, use get_permit_requirements
- If you don't know something or the citizen needs personalized help, offer to escalate
${appsContext}${permitContext}

Always be helpful and guide citizens to the information they need.`
}

// Made with Bob
