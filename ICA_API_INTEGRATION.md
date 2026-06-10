# IBM Consulting Advantage (ICA) API Integration

This document describes the integration with IBM Consulting Advantage (ICA) APIs for AI-powered permit assistance.

## Overview

The application uses the ICA Developer APIs to provide intelligent chat assistance for permit applications. The integration follows the OpenAI-compatible API format as specified in [`openapi.yaml`](openapi.yaml:1).

## API Configuration

### Environment Variables

Configure the following environment variables in [`.env.local`](.env.local:1):

```bash
# IBM Consulting Advantage (ICA) API Configuration
ICA_API_KEY=your-ica-api-key-here
ICA_MODEL=your-model-id-here
ICA_NAMESPACE=chat-models
```

### Getting Your API Key

1. Log into IBM Consulting Advantage UI
2. Navigate to **Settings → API Keys → ICA APIs**
3. Create a new developer API key
4. Copy the key (starts with `sk-`)

### Available Namespaces

The ICA API provides four namespaces for different use cases:

| Namespace | Endpoint | Use Case |
|-----------|----------|----------|
| `assistants` | `/assistants/chat/completions` | Pre-configured assistants with specific capabilities |
| `agents` | `/agents/chat/completions` | Autonomous agents that can use tools and make decisions |
| `digital-workforce` | `/digital-workforce/chat/completions` | Digital workers for specific business processes |
| `chat-models` | `/chat-models/chat/completions` | Raw chat models (default) |

## API Endpoints

### Base URL

```
https://api.nextgen-beta.ica.ibm.com/ica/v1
```

### Chat Completion

**Endpoint**: `/{namespace}/chat/completions`

**Method**: `POST`

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {ICA_API_KEY}
```

**Request Body**:
```json
{
  "model": "your-model-id",
  "messages": [
    {
      "role": "system",
      "content": "You are a helpful permit assistant..."
    },
    {
      "role": "user",
      "content": "What is the status of my application?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "lookup_application",
        "description": "Look up a permit application",
        "parameters": {
          "type": "object",
          "properties": {
            "reference": {
              "type": "string",
              "description": "Application reference number"
            }
          },
          "required": ["reference"]
        }
      }
    }
  ],
  "tool_choice": "auto"
}
```

**Response**:
```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1715000000,
  "model": "your-model-id",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "I can help you check your application status..."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 30,
    "total_tokens": 80
  }
}
```

### Tool Calls (Function Calling)

When the model wants to call a function, the response includes `tool_calls`:

```json
{
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": null,
        "tool_calls": [
          {
            "id": "call_abc123",
            "type": "function",
            "function": {
              "name": "lookup_application",
              "arguments": "{\"reference\":\"BP-2024-0481\"}"
            }
          }
        ]
      },
      "finish_reason": "tool_calls"
    }
  ]
}
```

## Implementation

### LLM Client

The [`lib/llm-client.ts`](lib/llm-client.ts:1) file implements the ICA API client:

```typescript
export class LLMClient {
  private apiKey: string
  private model: string
  private namespace: string
  private apiUrl: string

  constructor(config: LLMClientConfig = {}) {
    this.apiKey = config.apiKey || process.env.ICA_API_KEY || ""
    this.model = config.model || process.env.ICA_MODEL || "gpt-4o-mini"
    this.namespace = config.namespace || process.env.ICA_NAMESPACE || "chat-models"
    this.apiUrl = `${ICA_BASE_URL}/${this.namespace}/chat/completions`
  }

  async chat(messages: LLMMessage[]): Promise<ChatResponse> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: this.temperature,
        max_tokens: this.maxTokens,
        stream: false,
        tools: this.getToolDefinitions(),
        tool_choice: "auto",
      }),
    })
    // ... handle response
  }
}
```

### Available Tools

The client defines four tools that the AI can use:

1. **lookup_application**: Look up a permit application by reference number
2. **get_permit_requirements**: Get requirements for a specific permit type
3. **list_applications**: List all applications in the system
4. **escalate_to_human**: Escalate the conversation to a human caseworker

### API Route

The [`app/api/ai-chat/route.ts`](app/api/ai-chat/route.ts:1) handles chat requests:

```typescript
export async function POST(request: Request) {
  const body = await request.json() as ChatRequest
  const { messages, applicationContext } = body

  // Build RAG context
  const ragContext = buildRAGContext(applicationContext)
  
  // Add system prompt with RAG context
  const systemPrompt = buildSystemPrompt(ragContext)
  const messagesWithSystem: LLMMessage[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ]

  // Get LLM response
  const llmClient = getLLMClient()
  const response = await llmClient.chat(messagesWithSystem)

  // Handle function calls
  if (response.functionCall) {
    const functionResult = await handleFunctionCall(
      response.functionCall.name,
      response.functionCall.arguments
    )
    return NextResponse.json({ functionResult })
  }

  return NextResponse.json({ message: response.message })
}
```

## Advanced Features

### Document Collections (RAG)

The ICA API supports document collections for retrieval-augmented generation:

```json
{
  "model": "your-model-id",
  "messages": [...],
  "files": [
    {
      "type": "collection",
      "id": "kb-aaaa-bbbb-cccc-dddd",
      "context": "full"
    }
  ]
}
```

**Steps to use document collections**:

1. Upload files: `POST /ica/v1/files`
2. Create collection: `POST /ica/v1/document-collections`
3. Add files to collection: `POST /ica/v1/document-collections/{id}/file/add`
4. Reference collection in chat: Include in `files` array

### Streaming Responses

For real-time streaming, set `stream: true`:

```typescript
const response = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: modelId,
    messages,
    stream: true,
  }),
})

// Response is text/event-stream
const reader = response.body.getReader()
const decoder = new TextDecoder()

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  
  const chunk = decoder.decode(value)
  // Parse SSE format: data: {...}\n\n
  const lines = chunk.split('\n')
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6))
      if (data.choices[0].delta.content) {
        console.log(data.choices[0].delta.content)
      }
    }
  }
}
```

## Error Handling

### Common Error Codes

| Status | Error | Description |
|--------|-------|-------------|
| 400 | Bad Request | Invalid request format or parameters |
| 401 | Unauthorized | Missing, unknown, or revoked API key |
| 403 | Forbidden | Valid key but not entitled to resource |
| 404 | Not Found | Model or resource not found |

### Error Response Format

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Client-Side Error Handling

The LLM client includes comprehensive error handling:

```typescript
try {
  const response = await fetch(this.apiUrl, {...})
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error(`[LLM Client] API error (${response.status}):`, errorText)
    throw new Error(`ICA API error: ${response.status} ${response.statusText}`)
  }
  
  const data = await response.json()
  return { message: data.choices[0].message.content }
  
} catch (error) {
  console.error("[LLM Client] Error:", error)
  return {
    message: "I'm having trouble connecting to the AI service right now. Please try again or contact a caseworker for assistance.",
  }
}
```

## Testing

### Mock Mode

When no API key is configured, the client falls back to mock responses:

```typescript
if (!this.apiKey) {
  console.warn("[LLM Client] No API key configured, using mock responses")
  return this.mockResponse(messages)
}
```

### Testing with Real API

1. Set your API key in `.env.local`
2. Start the development server: `npm run dev`
3. Navigate to `/ai-chat`
4. Test various queries:
   - "What is the status of BP-2024-0481?"
   - "What documents do I need for a building permit?"
   - "I need to talk to a person"

## Monitoring & Logging

The client includes detailed logging:

```typescript
console.log(`[LLM Client] Initialized with ICA API`)
console.log(`[LLM Client] Namespace: ${this.namespace}`)
console.log(`[LLM Client] Model: ${this.model}`)
console.log(`[LLM Client] API URL: ${this.apiUrl}`)
console.log(`[LLM Client] Sending request to ${this.apiUrl}`)
console.log("[LLM Client] Response received:", {
  id: data.id,
  model: data.model,
  choices: data.choices?.length,
})
console.log("[LLM Client] Tool call requested:", toolCall.function.name)
```

## Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly
   - Use different keys for dev/staging/prod

2. **Rate Limiting**
   - Implement client-side rate limiting
   - Handle 429 (Too Many Requests) errors
   - Use exponential backoff for retries

3. **Token Management**
   - Monitor token usage via `usage` field in response
   - Set appropriate `max_tokens` limits
   - Truncate long conversation histories

4. **Error Handling**
   - Always provide fallback responses
   - Log errors for debugging
   - Show user-friendly error messages
   - Implement retry logic for transient failures

5. **Performance**
   - Use streaming for long responses
   - Cache common responses
   - Implement request timeouts
   - Consider using agents for complex workflows

## Troubleshooting

### "Unauthorized" Error

**Problem**: Getting 401 Unauthorized errors

**Solutions**:
- Verify API key is correct in `.env.local`
- Check key hasn't been revoked in ICA UI
- Ensure key is passed as `Bearer` token
- Verify key has necessary permissions

### "Model Not Found" Error

**Problem**: Getting 404 errors for model

**Solutions**:
- List available models: `GET /{namespace}/models`
- Verify model ID matches exactly
- Check you're using correct namespace
- Ensure model is available in your account

### Slow Responses

**Problem**: API responses are slow

**Solutions**:
- Reduce `max_tokens` parameter
- Use streaming for better UX
- Implement request timeout
- Consider using faster models
- Check network connectivity

### Tool Calls Not Working

**Problem**: AI not calling functions

**Solutions**:
- Verify tool definitions are correct
- Check function descriptions are clear
- Ensure `tool_choice` is set to "auto"
- Review system prompt for clarity
- Test with simpler tool definitions

## Resources

- **OpenAPI Specification**: [`openapi.yaml`](openapi.yaml:1)
- **ICA Documentation**: Contact IBM Consulting Advantage team
- **Support**: ICA UI → Settings → Support

---

**Last Updated**: 2026-06-10  
**API Version**: v1  
**Base URL**: https://api.nextgen-beta.ica.ibm.com/ica/v1