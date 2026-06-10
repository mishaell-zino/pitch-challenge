import { CitizenHeader } from "@/components/citizen/citizen-header"
import { CitizenChat } from "@/components/citizen/citizen-chat"
import { SkipToChat } from "@/components/citizen/skip-to-chat"

export default function Page() {
  return (
    <div className="flex h-dvh flex-col bg-background">
      <SkipToChat />
      <CitizenHeader />
      <main className="flex-1 overflow-hidden" aria-label="Permit help conversation">
        <CitizenChat />
      </main>
    </div>
  )
}
