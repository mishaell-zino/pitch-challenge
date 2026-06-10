# Permit Type Selection Flow

## Overview

This document describes the enhanced user flow for permit application assistance in the AI chat interface.

## User Flow

### Step 1: User Clicks "Help me apply for a permit"

When the user clicks the suggested action button "Help me apply for a permit":

1. **User Message Sent**: "I need help applying for a permit"
2. **AI Response**: The AI asks "What kind of permit do you need?" (based on system prompt)
3. **Context Detection**: The system detects this is a permit type selection scenario
4. **Suggested Actions Displayed**: Four permit type buttons appear:
   - 🏢 Building permit
   - 🔨 Renovation permit
   - 🗑️ Demolition permit
   - 🗺️ Zoning variance

### Step 2: User Selects Permit Type

When the user clicks one of the permit type buttons (e.g., "Building permit"):

1. **User Message Sent**: "I need a building permit for new construction"
2. **AI Function Call**: `get_permit_requirements({"type": "building_permit"})`
3. **Requirements Retrieved**: System fetches building permit requirements
4. **AI Response**: Displays requirements in formatted message:
   - Documents needed
   - Fees
   - Timeline
5. **Context Detection**: System detects requirements were shown
6. **Suggested Actions Updated**: New action buttons appear:
   - ✅ Start my application (primary)
   - ❓ I have a question
   - 👤 Talk to a person

### Step 3: User Takes Next Action

User can now:
- Start the application process
- Ask follow-up questions
- Request human assistance

## Implementation Details

### Context Detection Logic

Located in `lib/suggested-actions.ts`:

```typescript
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
  // If user asked about applying for a permit
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
  
  // ... other contexts
}
```

### Permit Type Actions

Located in `lib/suggested-actions.ts`:

```typescript
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
```

### AI System Prompt

Located in `lib/rag-context.ts`:

```typescript
Guidelines:
- When asked about applying for a permit, ask "What kind of permit do you need?" 
  to help them select the right type
```

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Welcome Screen                            │
│  Suggested Actions:                                          │
│  [Check my application status]                               │
│  [Help me apply for a permit] ← USER CLICKS THIS            │
│  [Talk to a person]                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  User: "I need help applying for a permit"                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AI: "What kind of permit do you need?"                     │
│                                                              │
│  Suggested Actions:                                          │
│  [🏢 Building permit]                                        │
│  [🔨 Renovation permit]                                      │
│  [🗑️ Demolition permit]                                      │
│  [🗺️ Zoning variance]                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  User: "I need a building permit for new construction"      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AI: "Building Permit Requirements:                         │
│                                                              │
│  Documents Needed:                                           │
│  • Site plan showing property boundaries                     │
│  • Architectural drawings (floor plans, elevations)          │
│  • Structural engineering plans                              │
│  • Energy compliance calculations                            │
│  • Proof of property ownership                               │
│                                                              │
│  Fees: $850 base fee + $12 per $1,000 of construction value │
│  Timeline: 6-8 weeks for standard residential projects"     │
│                                                              │
│  Suggested Actions:                                          │
│  [✅ Start my application]                                   │
│  [❓ I have a question]                                      │
│  [👤 Talk to a person]                                       │
└─────────────────────────────────────────────────────────────┘
```

## Benefits

1. **Reduced Cognitive Load**: Users don't need to know permit type names
2. **Faster Navigation**: One click to select permit type instead of typing
3. **Guided Experience**: Clear visual options prevent confusion
4. **Consistent UX**: Matches the pattern of other suggested actions
5. **Accessibility**: Buttons are keyboard navigable and screen reader friendly

## Testing Checklist

- [ ] Click "Help me apply for a permit" button
- [ ] Verify AI asks about permit type
- [ ] Verify 4 permit type buttons appear
- [ ] Click "Building permit" button
- [ ] Verify requirements are displayed
- [ ] Verify follow-up action buttons appear
- [ ] Test with other permit types (renovation, demolition, zoning)
- [ ] Test keyboard navigation through buttons
- [ ] Test screen reader announcements

## Future Enhancements

1. **Visual Icons**: Add permit type icons for better recognition
2. **Tooltips**: Show brief descriptions on hover
3. **Recent Selections**: Remember user's last permit type
4. **Smart Suggestions**: Suggest permit type based on user's description
5. **Multi-language**: Translate permit type labels

---

**Document Version**: 1.0  
**Last Updated**: June 10, 2026  
**Author**: Bob (AI Software Engineer)