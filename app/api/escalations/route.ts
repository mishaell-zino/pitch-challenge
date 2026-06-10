import { NextResponse } from "next/server"
import { createEscalation, listEscalations, updateEscalation } from "@/lib/case-store"
import type { CreateEscalationInput } from "@/lib/case-store"

export async function GET() {
  return NextResponse.json({ escalations: listEscalations() })
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateEscalationInput
  const escalation = createEscalation(body)
  return NextResponse.json({ escalation }, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id: string
    status?: "new" | "claimed" | "resolved"
    claimedBy?: string
    resolvedNote?: string
  }
  const { id, ...patch } = body
  const escalation = updateEscalation(id, patch)
  if (!escalation) {
    return NextResponse.json({ error: "not_found" }, { status: 404 })
  }
  return NextResponse.json({ escalation })
}
