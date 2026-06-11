import { Search, ClipboardList, UserRound, HelpCircle, Building, Hammer, Trash2, Map, RefreshCw } from "lucide-react"
import type { SuggestedAction } from "@/components/ai-chat/suggested-actions"
import type { PermitType, Locale } from "./types"
import { translate } from "./i18n"

/**
 * Suggested actions for different conversation contexts
 */

// Helper function to get translated actions
function getWelcomeActions(locale: Locale): SuggestedAction[] {
  return [
    {
      id: "check-status",
      label: translate(locale, "ai.action.checkStatus"),
      icon: Search,
      prompt: translate(locale, "ai.action.checkStatus"),
      tone: "primary"
    },
    {
      id: "apply-permit",
      label: translate(locale, "ai.action.applyPermit"),
      icon: ClipboardList,
      prompt: translate(locale, "ai.action.applyPermit"),
    },
    {
      id: "talk-human",
      label: translate(locale, "ai.action.talkPerson"),
      icon: UserRound,
      prompt: translate(locale, "ai.action.talkPerson"),
    }
  ]
}

function getStatusFollowupActions(locale: Locale): SuggestedAction[] {
  return [
    {
      id: "explain-stage",
      label: translate(locale, "ai.action.explainStage"),
      icon: HelpCircle,
      prompt: translate(locale, "ai.action.explainStage")
    },
    {
      id: "check-another",
      label: translate(locale, "ai.action.checkAnother"),
      icon: Search,
      prompt: translate(locale, "ai.action.checkAnother")
    },
    {
      id: "talk-human",
      label: translate(locale, "ai.action.talkPerson"),
      icon: UserRound,
      prompt: translate(locale, "ai.action.talkPerson"),
    }
  ]
}

function getPermitTypeActions(locale: Locale): SuggestedAction[] {
  return [
    {
      id: "building-permit",
      label: translate(locale, "ai.action.buildingPermit"),
      icon: Building,
      prompt: translate(locale, "ai.action.buildingPermit")
    },
    {
      id: "renovation",
      label: translate(locale, "ai.action.renovation"),
      icon: Hammer,
      prompt: translate(locale, "ai.action.renovation")
    },
    {
      id: "demolition",
      label: translate(locale, "ai.action.demolition"),
      icon: Trash2,
      prompt: translate(locale, "ai.action.demolition")
    },
    {
      id: "zoning-variance",
      label: translate(locale, "ai.action.zoningVariance"),
      icon: Map,
      prompt: translate(locale, "ai.action.zoningVariance")
    }
  ]
}

function getRequirementsFollowupActions(locale: Locale): SuggestedAction[] {
  return [
    {
      id: "start-application",
      label: translate(locale, "ai.action.startApplication"),
      icon: ClipboardList,
      prompt: translate(locale, "ai.action.startApplication"),
      tone: "primary"
    },
    {
      id: "ask-question",
      label: translate(locale, "ai.action.askQuestion"),
      icon: HelpCircle,
      prompt: translate(locale, "ai.action.askQuestion")
    },
    {
      id: "talk-human",
      label: translate(locale, "ai.action.talkPerson"),
      icon: UserRound,
      prompt: translate(locale, "ai.action.talkPerson"),
    }
  ]
}

function getConversationActions(locale: Locale): SuggestedAction[] {
  return [
    {
      id: "start-over",
      label: translate(locale, "ai.action.startOver"),
      icon: RefreshCw,
      prompt: translate(locale, "ai.action.startOver"),
      tone: "muted"
    },
    {
      id: "talk-human",
      label: translate(locale, "ai.action.talkPerson"),
      icon: UserRound,
      prompt: translate(locale, "ai.action.talkPerson"),
    }
  ]
}

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
  locale: Locale = "en",
  metadata?: {
    hasApplication?: boolean
    permitType?: PermitType
    lastFunctionCall?: string
  }
): SuggestedAction[] {
  switch (context) {
    case "welcome":
      return getWelcomeActions(locale)
    
    case "after-status-check":
      return getStatusFollowupActions(locale)
    
    case "permit-type-selection":
      return getPermitTypeActions(locale)
    
    case "after-requirements":
      return getRequirementsFollowupActions(locale)
    
    case "conversation-active":
      return getConversationActions(locale)
    
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
