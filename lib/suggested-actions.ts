import { Search, ClipboardList, UserRound, HelpCircle, Building, Hammer, Trash2, Map, RefreshCw } from "lucide-react"
import type { SuggestedAction } from "@/components/ai-chat/suggested-actions"
import type { PermitType } from "./types"

/**
 * Suggested actions for different conversation contexts
 */

// Welcome actions shown on initial load
export const WELCOME_ACTIONS: SuggestedAction[] = [
  {
    id: "check-status",
    label: "Check my application status",
    icon: Search,
    prompt: "I want to check the status of my application",
    tone: "primary"
  },
  {
    id: "apply-permit",
    label: "Help me apply for a permit",
    icon: ClipboardList,
    prompt: "I need help applying for a permit",
  },
  {
    id: "talk-human",
    label: "Talk to a person",
    icon: UserRound,
    prompt: "I need to speak with a caseworker",
  }
]

// Actions shown after displaying application status
export const STATUS_FOLLOWUP_ACTIONS: SuggestedAction[] = [
  {
    id: "explain-stage",
    label: "What does this stage mean?",
    icon: HelpCircle,
    prompt: "Can you explain what the current stage means?"
  },
  {
    id: "check-another",
    label: "Check another application",
    icon: Search,
    prompt: "I want to check another application"
  },
  {
    id: "talk-human",
    label: "Talk to a person",
    icon: UserRound,
    prompt: "I need to speak with a caseworker about this application",
  }
]

// Actions for selecting permit type
export const PERMIT_TYPE_ACTIONS: SuggestedAction[] = [
  {
    id: "building-permit",
    label: "Building permit",
    icon: Building,
    prompt: "I need a building permit for new construction"
  },
  {
    id: "renovation",
    label: "Renovation permit",
    icon: Hammer,
    prompt: "I need a renovation permit"
  },
  {
    id: "demolition",
    label: "Demolition permit",
    icon: Trash2,
    prompt: "I need a demolition permit"
  },
  {
    id: "zoning-variance",
    label: "Zoning variance",
    icon: Map,
    prompt: "I need a zoning variance"
  }
]

// Actions shown after displaying permit requirements
export const REQUIREMENTS_FOLLOWUP_ACTIONS: SuggestedAction[] = [
  {
    id: "start-application",
    label: "Start my application",
    icon: ClipboardList,
    prompt: "I'm ready to start my application",
    tone: "primary"
  },
  {
    id: "ask-question",
    label: "I have a question",
    icon: HelpCircle,
    prompt: "I have a question about the requirements"
  },
  {
    id: "talk-human",
    label: "Talk to a person",
    icon: UserRound,
    prompt: "I need help from a caseworker",
  }
]

// Generic conversation actions
export const CONVERSATION_ACTIONS: SuggestedAction[] = [
  {
    id: "start-over",
    label: "Start over",
    icon: RefreshCw,
    prompt: "I want to start over",
    tone: "muted"
  },
  {
    id: "talk-human",
    label: "Talk to a person",
    icon: UserRound,
    prompt: "I need to speak with a caseworker",
  }
]

/**
 * Context types for determining which actions to show
 */
export type SuggestionContext = 
  | "welcome"
  | "after-status-check"
  | "permit-type-selection"
  | "after-requirements"
  | "conversation-active"
  | "none"

/**
 * Get suggested actions based on conversation context
 */
export function getSuggestedActions(
  context: SuggestionContext,
  metadata?: {
    hasApplication?: boolean
    permitType?: PermitType
    lastFunctionCall?: string
  }
): SuggestedAction[] {
  switch (context) {
    case "welcome":
      return WELCOME_ACTIONS
    
    case "after-status-check":
      return STATUS_FOLLOWUP_ACTIONS
    
    case "permit-type-selection":
      return PERMIT_TYPE_ACTIONS
    
    case "after-requirements":
      return REQUIREMENTS_FOLLOWUP_ACTIONS
    
    case "conversation-active":
      return CONVERSATION_ACTIONS
    
    case "none":
    default:
      return []
  }
}

/**
 * Determine context from conversation state
 */
export function detectSuggestionContext(
  messageCount: number,
  lastMessage?: {
    role: "user" | "assistant"
    content: string
    application?: any
    hasRequirements?: boolean
  },
  lastFunctionCall?: string
): SuggestionContext {
  // Welcome state - no messages yet or just welcome message
  if (messageCount <= 1) {
    return "welcome"
  }

  // After status check - last message has application data
  if (lastMessage?.application) {
    return "after-status-check"
  }

  // After showing requirements
  if (lastMessage?.hasRequirements || lastFunctionCall === "get_permit_requirements") {
    return "after-requirements"
  }

  // If user asked about applying for a permit - show permit type selection
  if (lastMessage?.role === "user" &&
      (lastMessage.content.toLowerCase().includes("help applying") ||
       lastMessage.content.toLowerCase().includes("apply for a permit") ||
       lastMessage.content.toLowerCase().includes("need help applying"))) {
    return "permit-type-selection"
  }

  // If AI asked about permit type
  if (lastMessage?.role === "assistant" &&
      (lastMessage.content.toLowerCase().includes("what type") ||
       lastMessage.content.toLowerCase().includes("which permit") ||
       lastMessage.content.toLowerCase().includes("what kind of permit"))) {
    return "permit-type-selection"
  }

  // Active conversation
  if (messageCount > 2) {
    return "conversation-active"
  }

  return "none"
}

// Made with Bob
