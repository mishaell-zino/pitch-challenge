# AI-Powered Chat with RAG Integration

This document describes the new AI-powered chat feature integrated into the permit application system.

## Overview

A new page at `/ai-chat` provides an LLM-powered conversational interface with RAG (Retrieval-Augmented Generation) capabilities. This allows citizens to interact naturally with the permit system using AI.

## Architecture

### Components

1. **Page**: `app/ai-chat/page.tsx`
   - Main page with two-column layout
   - Left sidebar: Applications list
   - Right: AI chat interface

2. **Applications Sidebar**: `components/ai-chat/applications-sidebar.tsx`
   - Displays all user applications
   - Shows status badges and outstanding actions
   - Click to inject application into chat context

3. **AI Chat Interface**: `components/ai-chat/ai-chat-interface.tsx`
   - Chat UI with message history
   - Integrates StatusTimeline component for application display
   - Handles streaming responses and function calls

### Backend

1. **API Endpoint**: `app/api/ai-chat/route.ts`
   - Receives chat messages
   - Builds RAG context
   - Calls LLM with system prompt
   - Handles function/tool calls
   - Returns responses

2. **LLM Client**: `lib/llm-client.ts`
   - Wrapper for OpenAI API (or compatible)
   - Supports function calling
   - Includes mock mode for testing without API key

3. **RAG Context Builder**: `lib/rag-context.ts`
   - Retrieves relevant application data
   - Formats permit requirements
   - Builds system prompts with context
   - Enriches LLM knowledge with real-time data

4. **Types**: `lib/llm-types.ts`
   - TypeScript interfaces for LLM messages
   - Chat request/response types
   - RAG context structures

## Features

### Available Tools/Functions

The LLM can call these functions to interact with the system:

1. **lookup_application(reference)**
   - Look up application by reference number
   - Returns full application details
   - Displays StatusTimeline in chat

2. **get_permit_requirements(type)**
   - Get requirements for permit types
   - Returns documents, fees, timeline
   - Formatted for easy reading

3. **list_applications()**
   - List all applications in system
   - Returns summary information

4. **escalate_to_human(reason, details)**
   - Create escalation to caseworker
   - Returns escalation ID
   - Preserves conversation context

### RAG Pipeline

1. **Retrieval**: Query in-memory case store for relevant applications
2. **Augmentation**: Inject application data, permit requirements into system prompt
3. **Generation**: LLM generates contextually-aware responses

### User Experience

- Natural language interaction
- Click applications in sidebar to view status
- Ask questions about permits, requirements, timelines
- Get personalized help based on application context
- Escalate to human when needed

## Setup

### Environment Variables

```bash
# Optional: Set OpenAI API key for production
OPENAI_API_KEY=sk-...
```

Without an API key, the system uses a mock LLM for testing.

### Configuration

Edit `lib/llm-client.ts` to configure:
- Model selection (gpt-4o-mini, gpt-4o, etc.)
- Temperature
- Max tokens
- API endpoint (for alternative providers)

## Usage

### Access the AI Chat

Navigate to: `http://localhost:3000/ai-chat`

### Example Interactions

**Check Status:**
```
User: What's the status of BP-2024-0481?
AI: [Looks up application and displays StatusTimeline]
```

**Get Requirements:**
```
User: What do I need for a building permit?
AI: [Lists documents, fees, timeline]
```

**Natural Questions:**
```
User: How long does plan review usually take?
AI: [Provides contextual answer based on RAG data]
```

**Escalation:**
```
User: I need to speak with someone about my application
AI: [Initiates escalation process]
```

## Integration with Existing System

- **No modifications** to existing pages or components
- Reuses `StatusTimeline` component for consistency
- Shares same backend data store (`case-store.ts`)
- Uses same types and utilities
- Maintains existing API endpoints

## Testing

### Without API Key (Mock Mode)

The system includes a mock LLM that responds to basic patterns:
- Status queries
- Permit questions
- Reference number detection

### With API Key

Set `OPENAI_API_KEY` environment variable for full LLM capabilities.

## Future Enhancements

1. **Streaming Responses**: Implement SSE for real-time streaming
2. **Multi-language Support**: Integrate with existing i18n system
3. **Voice Input**: Add speech-to-text capabilities
4. **Conversation Memory**: Persist chat history across sessions
5. **Advanced RAG**: Vector embeddings for semantic search
6. **Analytics**: Track common questions and improve responses

## File Structure

```
app/
  ai-chat/
    page.tsx                    # Main AI chat page
  api/
    ai-chat/
      route.ts                  # Chat API endpoint
    applications/
      route.ts                  # Updated to list all apps

components/
  ai-chat/
    applications-sidebar.tsx    # Applications list sidebar
    ai-chat-interface.tsx       # Chat UI component

lib/
  llm-client.ts                 # LLM API wrapper
  llm-types.ts                  # TypeScript types
  rag-context.ts                # RAG context builder
```

## Notes

- The existing rule-based chat at `/` remains unchanged
- Both systems can coexist for comparison
- AI chat provides more flexible, natural interaction
- RAG ensures responses are grounded in real data
- Function calling enables structured actions