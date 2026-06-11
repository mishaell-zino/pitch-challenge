# Enhanced Escalation Flow with Conversation Summarization

## Overview

This document describes the enhanced escalation flow that automatically summarizes conversations and provides full context to caseworkers when citizens request human assistance.

## User Flow

### Step 1: User Requests Human Help

When the user clicks "Talk to a person" or asks to speak with a caseworker:

1. **User Action**: Clicks suggested action button or types request
2. **AI Detection**: Recognizes escalation request
3. **Function Call**: AI calls `escalate_to_human()` with:
   - Reason for escalation
   - Brief details
   - **Full conversation history**

### Step 2: Automatic Conversation Summarization

The system automatically processes the escalation:

1. **Conversation Collection**: Gathers all messages from the chat session
2. **LLM Summarization**: Uses AI to create a concise summary focusing on:
   - What the citizen needs help with
   - Key details mentioned (application IDs, permit types, issues)
   - Outstanding questions or concerns
3. **Transcript Conversion**: Converts messages to transcript format
4. **Escalation Creation**: Creates escalation ticket with:
   - AI-generated summary (2-3 sentences)
   - Full conversation transcript
   - Escalation reference number

### Step 3: Thank You Message

After successful escalation:

1. **Confirmation Message**: "Thank you! I've connected you with a caseworker..."
2. **Reference Number**: Provides escalation ID (e.g., ESC-101)
3. **Follow-up Prompt**: "Is there anything else I can help you with?"
4. **Suggested Actions**: Shows options to continue or end conversation

## Technical Implementation

### 1. Updated Function Definition (`lib/llm-client.ts`)

```typescript
{
  type: "function",
  function: {
    name: "escalate_to_human",
    description: "Escalate the conversation to a human caseworker. This will summarize the conversation and create an escalation ticket.",
    parameters: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          enum: ["status_unclear", "needs_correction", "documents_problem", "dispute", "other"],
          description: "The reason for escalation",
        },
        details: {
          type: "string",
          description: "Brief description of what the citizen needs help with",
        },
        conversationHistory: {
          type: "array",
          description: "The full conversation history to be included with the escalation",
          items: {
            type: "object",
            properties: {
              role: { type: "string", enum: ["user", "assistant"] },
              content: { type: "string" }
            }
          }
        }
      },
      required: ["reason", "details", "conversationHistory"]
    }
  }
}
```

### 2. Enhanced Escalation Handler (`app/api/ai-chat/route.ts`)

```typescript
case "escalate_to_human": {
  console.log(`[${requestId}]   🚨 Creating escalation`)
  
  // Summarize conversation using LLM
  let summary = args.details || "User requested to speak with a caseworker"
  let transcript: TranscriptEntry[] = []
  
  if (args.conversationHistory && args.conversationHistory.length > 0) {
    console.log(`[${requestId}]   🤖 Generating conversation summary...`)
    
    const summaryPrompt = `Summarize the following conversation between a citizen and an AI assistant. Focus on:
1. What the citizen needs help with
2. Key details mentioned (application IDs, permit types, specific issues)
3. Any outstanding questions or concerns

Keep the summary concise (2-3 sentences) and professional.

Conversation:
${args.conversationHistory.map((msg: any) => 
  `${msg.role === 'user' ? 'Citizen' : 'Assistant'}: ${msg.content}`
).join('\n')}

Summary:`

    const llmClient = getLLMClient()
    const summaryResponse = await llmClient.chat([
      { role: "user", content: summaryPrompt }
    ])
    
    summary = summaryResponse.message.trim()
    
    // Convert to transcript format
    transcript = args.conversationHistory.map((msg: any) => ({
      role: msg.role === 'user' ? 'citizen' as const : 'bot' as const,
      text: msg.content,
    }))
  }
  
  const escalation = createEscalation({
    locale: "en" as Locale,
    reason: args.reason,
    detail: summary,
    transcript,
  })
  
  return {
    success: true,
    escalationId: escalation.id,
    summary,
    message: `Thank you! I've connected you with a caseworker who will review your request. Your reference number is ${escalation.id}. A caseworker will reach out to you soon.\n\nIs there anything else I can help you with?`,
  }
}
```

### 3. Updated System Prompt (`lib/rag-context.ts`)

```typescript
Guidelines:
- When escalating to a human, ALWAYS include the full conversationHistory array 
  with all messages from the conversation
```

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  User: "I need to speak with a caseworker"                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  AI: Calls escalate_to_human() function                     │
│  Parameters:                                                 │
│  - reason: "other"                                           │
│  - details: "User needs personalized assistance"            │
│  - conversationHistory: [                                    │
│      {role: "user", content: "Hello"},                       │
│      {role: "assistant", content: "Hi! How can I help?"},   │
│      {role: "user", content: "Check BP-2024-0481"},         │
│      ...                                                     │
│    ]                                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend: Process Escalation                                 │
│  1. Receive conversation history (N messages)                │
│  2. Build summarization prompt                               │
│  3. Call LLM to generate summary                             │
│  4. Convert messages to transcript format                    │
│  5. Create escalation record                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Escalation Record Created:                                  │
│  {                                                           │
│    id: "ESC-101",                                            │
│    summary: "Citizen inquired about building permit         │
│              BP-2024-0481 status and needs clarification    │
│              on outstanding document requirements.",         │
│    transcript: [                                             │
│      {role: "citizen", text: "Hello"},                       │
│      {role: "bot", text: "Hi! How can I help?"},            │
│      ...                                                     │
│    ],                                                        │
│    status: "new",                                            │
│    createdAt: "2024-03-20T10:30:00Z"                        │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Response to User:                                           │
│  "Thank you! I've connected you with a caseworker who will  │
│   review your request. Your reference number is ESC-101.    │
│   A caseworker will reach out to you soon.                  │
│                                                              │
│   Is there anything else I can help you with?"              │
│                                                              │
│  Suggested Actions:                                          │
│  [Check another application]                                 │
│  [Start over]                                                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Caseworker Dashboard:                                       │
│  New escalation appears with:                                │
│  - AI-generated summary (quick overview)                     │
│  - Full conversation transcript (complete context)           │
│  - Citizen details and application context                   │
│  - Priority and timestamp                                    │
└─────────────────────────────────────────────────────────────┘
```

## Example Conversation Summary

### Input Conversation:
```
User: Hello, I need help with my building permit
Assistant: I'd be happy to help! Do you have an application reference number?
User: Yes, it's BP-2024-0481
Assistant: Let me look that up for you... [displays status]
User: I don't understand what "plan review" means
Assistant: Plan review is when our engineers check your submitted plans...
User: I need to talk to someone about this
```

### AI-Generated Summary:
```
Citizen inquired about building permit application BP-2024-0481 and 
requested clarification on the "plan review" stage. They would like 
personalized assistance from a caseworker to better understand the 
process and next steps.
```

## Benefits

### For Citizens:
1. **No Repetition**: Caseworkers have full context, citizens don't need to re-explain
2. **Faster Resolution**: Caseworkers can prepare before contacting citizen
3. **Clear Reference**: Escalation ID for tracking
4. **Seamless Transition**: Smooth handoff from AI to human

### For Caseworkers:
1. **Complete Context**: Full conversation history available
2. **Quick Overview**: AI-generated summary for rapid triage
3. **Better Preparation**: Can review details before contacting citizen
4. **Efficient Workflow**: Prioritize based on summary and context

### For the System:
1. **Quality Assurance**: Conversation logs for training and improvement
2. **Analytics**: Track common escalation reasons
3. **Compliance**: Complete audit trail of citizen interactions
4. **Continuous Improvement**: Identify patterns to enhance AI responses

## Caseworker Dashboard Integration

The escalation appears in the caseworker dashboard with:

```typescript
interface EscalationCard {
  id: string                    // "ESC-101"
  summary: string               // AI-generated summary
  transcript: TranscriptEntry[] // Full conversation
  status: "new" | "claimed" | "resolved"
  createdAt: string
  priority: "high" | "normal" | "low"
  
  // Quick actions
  actions: [
    "Claim",
    "View Full Transcript",
    "Contact Citizen",
    "Resolve"
  ]
}
```

## Testing Checklist

- [ ] User clicks "Talk to a person" button
- [ ] AI calls escalate_to_human with conversation history
- [ ] Backend generates summary using LLM
- [ ] Escalation created with summary and transcript
- [ ] User receives thank you message with reference number
- [ ] Escalation appears in caseworker dashboard
- [ ] Caseworker can view AI summary
- [ ] Caseworker can expand full transcript
- [ ] Test with various conversation lengths (short, medium, long)
- [ ] Test with different escalation reasons
- [ ] Verify summary quality and relevance

## Future Enhancements

1. **Multi-language Summaries**: Generate summaries in caseworker's preferred language
2. **Sentiment Analysis**: Detect citizen frustration or urgency
3. **Auto-prioritization**: Assign priority based on conversation content
4. **Smart Routing**: Route to specialized caseworkers based on topic
5. **Follow-up Automation**: Automatic status updates to citizen
6. **Summary Refinement**: Allow caseworkers to edit AI summaries
7. **Template Responses**: Suggest responses based on similar cases

## Error Handling

### If Summary Generation Fails:
- Falls back to using the `details` parameter
- Logs error for monitoring
- Still creates escalation with full transcript
- Caseworker can manually review conversation

### If Conversation History Missing:
- Uses basic escalation with details only
- Logs warning for investigation
- Prompts user for more information

### If Escalation Creation Fails:
- Returns error message to user
- Suggests trying again or alternative contact methods
- Logs error for system monitoring

---

**Document Version**: 1.0  
**Last Updated**: June 10, 2026  
**Author**: Bob (AI Software Engineer)