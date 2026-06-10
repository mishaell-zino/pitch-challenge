"use client"

import { useState } from "react"
import { ApplicationsSidebar } from "@/components/ai-chat/applications-sidebar"
import { AIChatInterface } from "@/components/ai-chat/ai-chat-interface"
import { CitizenHeader } from "@/components/citizen/citizen-header"
import type { Application } from "@/lib/types"

export default function AIChatPage() {
  const [selectedApplication, setSelectedApplication] = useState<Application | undefined>()

  return (
    <div className="flex h-dvh flex-col bg-background">
      <CitizenHeader />
      
      <div className="flex flex-1 overflow-hidden">
        <ApplicationsSidebar
          onSelectApplication={setSelectedApplication}
          selectedId={selectedApplication?.id}
        />
        
        <main className="flex-1 overflow-hidden" aria-label="AI-powered permit assistant">
          <AIChatInterface selectedApplication={selectedApplication} />
        </main>
      </div>
    </div>
  )
}

// Made with Bob
