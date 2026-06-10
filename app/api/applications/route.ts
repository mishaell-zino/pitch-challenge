import { NextResponse } from "next/server"
import { findApplication, listApplications } from "@/lib/case-store"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get("ref")
  
  // If no ref provided, return all applications
  if (!ref) {
    const apps = listApplications()
    return NextResponse.json({ applications: apps })
  }
  
  // Otherwise, find specific application
  const app = findApplication(ref)
  if (!app) {
    return NextResponse.json({ found: false }, { status: 404 })
  }
  return NextResponse.json({ found: true, application: app })
}
