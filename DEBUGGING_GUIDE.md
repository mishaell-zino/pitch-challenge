# Debugging Guide: AI Chat Flow

This guide explains the comprehensive logging system implemented for debugging chat message flows.

## Overview

The application now includes detailed logging at every step of the chat message processing pipeline. All logs are visible in the browser console (client-side) and server console (API routes).

## Log Format

All logs follow this format:
```
[request-id] 🔍 Step description
[request-id]   - Detail 1
[request-id]   - Detail 2
```

### Request IDs

Each request gets a unique ID for tracking:
- **Client-side**: `msg-{timestamp}` (e.g., `msg-1715000000000`)
- **Server-side**: `req-{timestamp}` (e.g., `req-1715000000000`)

## Client-Side Logging

### Location
[`components/ai-chat/ai-chat-interface.tsx`](components/ai-chat/ai-chat-interface.tsx:67)

### Log Flow

#### 1. User Sends Message
```
================================================================================
[msg-1715000000000] 💬 USER SENT MESSAGE
================================================================================
[msg-1715000000000] 📝 Message: "What is the status of BP-2024-0481?"
[msg-1715000000000] 📊 Current conversation length: 3 messages
[msg-1715000000000] 🔗 Selected application: none
```

#### 2. Building Conversation History
```
[msg-1715000000000] 🔄 Building conversation history...
[msg-1715000000000]   - Filtered 3 → 2 messages
[msg-1715000000000]   - Total messages for API: 3
```

#### 3. API Call
```
[msg-1715000000000] 🌐 Calling /api/ai-chat...
[msg-1715000000000]   - Request body: {
  "messages": [...],
  "applicationContext": undefined
}
```

#### 4. API Response
```
[msg-1715000000000] ✅ API response received (1234ms)
[msg-1715000000000]   - Status: 200 OK
[msg-1715000000000] 📦 Response data: {...}
```

#### 5. Processing Response

**Function Call Result:**
```
[msg-1715000000000] 🔧 Processing function result...
[msg-1715000000000]   - Function: lookup_application
[msg-1715000000000]   - Success: true
[msg-1715000000000] 📋 Displaying application: BP-2024-0481
[msg-1715000000000] ✅ Added application message to chat
```

**Text Response:**
```
[msg-1715000000000] 💬 Displaying text response
[msg-1715000000000]   - Message preview: "I can help you check your application status..."
[msg-1715000000000] ✅ Added text message to chat
```

#### 6. Completion
```
[msg-1715000000000] ✅ Message processing complete
================================================================================
[msg-1715000000000] 🏁 Request complete
```

#### 7. Error Handling
```
[msg-1715000000000] ❌ ERROR: Error message
[msg-1715000000000] Stack trace: ...
[msg-1715000000000] ⚠️ Added error message to chat
================================================================================
```

## Server-Side Logging

### Location
[`app/api/ai-chat/route.ts`](app/api/ai-chat/route.ts:8)

### Log Flow

#### 1. Request Received
```
================================================================================
[req-1715000000000] 🚀 NEW CHAT REQUEST
================================================================================
[req-1715000000000] 📥 Request received:
[req-1715000000000]   - Messages count: 3
[req-1715000000000]   - Application context: none
[req-1715000000000]   - Last user message: "What is the status of BP-2024-0481?..."
```

#### 2. RAG Context Building
```
[req-1715000000000] 🔍 Building RAG context...
[req-1715000000000]   - Applications in context: 0
[req-1715000000000]   - Permit requirements: no
```

#### 3. System Prompt
```
[req-1715000000000] 📝 Building system prompt...
[req-1715000000000]   - System prompt length: 1234 chars
[req-1715000000000]   - Total messages to LLM: 4
```

#### 4. LLM Call
```
[req-1715000000000] 🤖 Calling LLM client...
[LLM Client] Sending request to https://api.nextgen-beta.ica.ibm.com/ica/v1/chat-models/chat/completions
[LLM Client] Response received: {
  id: "chatcmpl-abc123",
  model: "gpt-4o",
  choices: 1
}
[req-1715000000000] ✅ LLM response received
[req-1715000000000]   - Has function call: true
[req-1715000000000]   - Function name: lookup_application
[req-1715000000000]   - Function args: {
  "reference": "BP-2024-0481"
}
[req-1715000000000]   - Message preview: "Let me look up that application for you..."
```

#### 5. Function Execution
```
[req-1715000000000] 🔧 Handling function call: lookup_application
[req-1715000000000]   🔧 Executing function: lookup_application
[req-1715000000000]   📋 Arguments: {
  "reference": "BP-2024-0481"
}
[req-1715000000000]   🔍 Looking up application: BP-2024-0481
[req-1715000000000]   ✅ Application found: BP-2024-0481 (building_permit)
[req-1715000000000]   📊 Current stage: plan_review
[req-1715000000000] ✅ Function executed successfully
[req-1715000000000]   - Result: {...}
```

#### 6. Response Sent
```
[req-1715000000000] 📤 Sending response with function result
================================================================================
```

## LLM Client Logging

### Location
[`lib/llm-client.ts`](lib/llm-client.ts:1)

### Initialization
```
[LLM Client] Initialized with ICA API
[LLM Client] Namespace: chat-models
[LLM Client] Model: gpt-4o
[LLM Client] API URL: https://api.nextgen-beta.ica.ibm.com/ica/v1/chat-models/chat/completions
```

### Request/Response
```
[LLM Client] Sending request to https://api.nextgen-beta.ica.ibm.com/ica/v1/chat-models/chat/completions
[LLM Client] Response received: {
  id: "chatcmpl-abc123",
  model: "gpt-4o",
  choices: 1
}
[LLM Client] Tool call requested: lookup_application
```

### Errors
```
[LLM Client] API error (401): {"detail":"Invalid API key"}
[LLM Client] Error: Error message
```

### Mock Mode
```
[LLM Client] No API key configured, using mock responses
```

## Function-Specific Logging

### lookup_application
```
[req-xxx]   🔍 Looking up application: BP-2024-0481
[req-xxx]   ✅ Application found: BP-2024-0481 (building_permit)
[req-xxx]   📊 Current stage: plan_review
```

### get_permit_requirements
```
[req-xxx]   📋 Getting requirements for: building_permit
[req-xxx]   ✅ Requirements retrieved
[req-xxx]   📄 Documents needed: 4
```

### list_applications
```
[req-xxx]   📋 Listing all applications
[req-xxx]   ✅ Found 4 applications
[req-xxx]   📊 Applications: BP-2024-0481, RN-2024-1192, DM-2024-0067, ZV-2023-0904
```

### escalate_to_human
```
[req-xxx]   🚨 Creating escalation
[req-xxx]   📋 Reason: status_unclear
[req-xxx]   💬 Details: I don't understand my status
[req-xxx]   ✅ Escalation created: ESC-101
```

## Emoji Legend

| Emoji | Meaning |
|-------|---------|
| 🚀 | New request started |
| 💬 | User message |
| 📥 | Request received |
| 📤 | Response sent |
| 🔍 | Searching/looking up |
| 📝 | Building/writing |
| 🔄 | Processing/transforming |
| 🌐 | Network call |
| 🤖 | LLM interaction |
| 🔧 | Function execution |
| 📋 | Data retrieval |
| 📊 | Statistics/summary |
| 📦 | Data package |
| ✅ | Success |
| ❌ | Error |
| ⚠️ | Warning |
| 🚨 | Escalation |
| 🏁 | Completion |

## How to Use Logs for Debugging

### 1. Finding a Specific Request

Search for the request ID in console:
```
Ctrl+F (or Cmd+F) → "msg-1715000000000"
```

### 2. Tracking Request Flow

Follow the request through both consoles:
1. Browser console: Client-side processing
2. Server console: API and LLM processing
3. Match timestamps to correlate

### 3. Identifying Bottlenecks

Look for timing information:
```
[msg-xxx] ✅ API response received (1234ms)
```

### 4. Debugging Function Calls

Check function execution:
```
[req-xxx]   🔧 Executing function: lookup_application
[req-xxx]   📋 Arguments: {...}
[req-xxx]   ✅ Application found: BP-2024-0481
```

### 5. Debugging Errors

Errors include full stack traces:
```
[msg-xxx] ❌ ERROR: Error message
[msg-xxx] Stack trace: ...
```

## Common Issues and Solutions

### Issue: No logs appearing

**Problem**: Console is empty

**Solutions**:
- Check browser console is open (F12)
- Check server console (terminal running `npm run dev`)
- Verify logging hasn't been disabled

### Issue: Request ID mismatch

**Problem**: Client and server IDs don't match

**Explanation**: This is normal - client and server use different ID schemes. Match by timestamp or message content.

### Issue: Missing function logs

**Problem**: Function execution logs not appearing

**Solutions**:
- Check if function was actually called (look for "Has function call: true")
- Verify function name matches exactly
- Check function switch statement includes the function

### Issue: LLM errors

**Problem**: API errors from LLM

**Solutions**:
1. Check API key is valid: `[LLM Client] API error (401)`
2. Check model exists: `[LLM Client] API error (404)`
3. Check rate limits: `[LLM Client] API error (429)`
4. Review full error message in logs

## Performance Monitoring

### Key Metrics to Watch

1. **API Response Time**
   ```
   [msg-xxx] ✅ API response received (1234ms)
   ```
   - Good: < 2000ms
   - Acceptable: 2000-5000ms
   - Slow: > 5000ms

2. **Message Count**
   ```
   [req-xxx]   - Total messages to LLM: 10
   ```
   - Watch for growing conversation history
   - Consider truncating after 20+ messages

3. **Function Execution**
   ```
   [req-xxx] ✅ Function executed successfully
   ```
   - Should be near-instant for local functions
   - Database queries may take longer

## Best Practices

1. **Keep Console Open**: Always have browser console open during development
2. **Monitor Both Consoles**: Watch both client and server logs
3. **Use Request IDs**: Track specific requests using their IDs
4. **Check Timestamps**: Correlate events across logs
5. **Review Error Stacks**: Full stack traces help identify issues
6. **Monitor Performance**: Watch response times for bottlenecks

## Disabling Logs (Production)

For production, you may want to reduce logging:

### Option 1: Environment Variable
```typescript
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('[req-xxx] Debug info')
}
```

### Option 2: Log Levels
```typescript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info'

function log(level: string, message: string) {
  if (shouldLog(level, LOG_LEVEL)) {
    console.log(message)
  }
}
```

### Option 3: Remove Console Logs
Use a build tool to strip console.log statements in production builds.

---

**Last Updated**: 2026-06-10  
**Version**: 1.0