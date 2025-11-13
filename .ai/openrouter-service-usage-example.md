# OpenRouter Service Usage Examples

This document provides practical examples of how to use the OpenRouterService in your application.

## Basic Usage

### 1. Quick Start with Factory Function

The easiest way to get started is using the `createOpenRouterService` factory function:

```typescript
import { createOpenRouterService } from "@/lib/services/openrouter.service";

// Create service instance with default dependencies
const service = createOpenRouterService({
  apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
  modelName: "openai/gpt-4o-mini",
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  modelParameters: {
    temperature: 0.7,
    max_tokens: 150,
  },
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "FlashcardSchema",
      strict: true,
      schema: {
        question: { type: "string" },
        answer: { type: "string" },
      },
    },
  },
});

// Send a message
try {
  const response = await service.sendMessage(
    "Generate a flashcard about TypeScript interfaces",
    "You are a helpful flashcard generator that creates educational content."
  );

  console.log(response.content);
  // Output: { question: "...", answer: "..." }
} catch (error) {
  console.error("Error:", error.message);
}
```

### 2. Manual Instantiation with Custom Dependencies

For more control, instantiate the service manually:

```typescript
import {
  OpenRouterService,
  ConsoleLogger,
  FetchHttpClient,
} from "@/lib/services/openrouter.service";

const logger = new ConsoleLogger();
const httpClient = new FetchHttpClient();

const service = new OpenRouterService(
  {
    apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
    modelName: "anthropic/claude-3.5-sonnet",
    apiKey: import.meta.env.OPENROUTER_API_KEY,
    modelParameters: {
      temperature: 0.8,
      max_tokens: 200,
    },
    timeout: 60000, // 60 seconds
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "SummarySchema",
        strict: true,
        schema: {
          summary: { type: "string" },
          keyPoints: { type: "array" },
        },
      },
    },
  },
  httpClient,
  logger
);
```

## Integration with Flashcard Generation

### Example: Generate Flashcards from Text

```typescript
// src/lib/services/flashcard-generator.service.ts
import { createOpenRouterService } from "./openrouter.service";
import type { FlashcardSuggestionDTO } from "@/types";

export class FlashcardGeneratorService {
  private openRouterService;

  constructor() {
    this.openRouterService = createOpenRouterService({
      apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
      modelName: "openai/gpt-4-turbo",
      apiKey: import.meta.env.OPENROUTER_API_KEY,
      modelParameters: {
        temperature: 0.7,
        max_tokens: 500,
      },
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "FlashcardsResponse",
          strict: true,
          schema: {
            flashcards: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" },
                },
              },
            },
          },
        },
      },
    });
  }

  async generateFlashcards(
    text: string,
    limit: number = 5
  ): Promise<FlashcardSuggestionDTO[]> {
    // Input validation
    if (!text || text.trim().length === 0) {
      throw new Error("Input text cannot be empty");
    }

    if (text.length > 5000) {
      throw new Error("Input text exceeds maximum length of 5000 characters");
    }

    // Prepare system message
    const systemMessage = `You are an expert educational content creator specializing in creating effective flashcards.
Your task is to generate high-quality question-answer pairs from the provided text.
Focus on key concepts, definitions, and important facts.
Generate exactly ${limit} flashcards.`;

    // Prepare user message
    const userMessage = `Create ${limit} flashcards from the following text:\n\n${text}`;

    try {
      // Call OpenRouter API
      const response = await this.openRouterService.sendMessage(
        userMessage,
        systemMessage
      );

      // Extract flashcards from response
      const flashcardsData = response.content.flashcards as Array<{
        question: string;
        answer: string;
      }>;

      // Transform to DTOs
      const flashcards: FlashcardSuggestionDTO[] = flashcardsData.map((fc) => ({
        id: null,
        question: fc.question,
        answer: fc.answer,
      }));

      return flashcards;
    } catch (error) {
      console.error("Failed to generate flashcards:", error);
      throw new Error(`Flashcard generation failed: ${error.message}`);
    }
  }
}
```

### Example: Using in an API Endpoint

```typescript
// src/pages/api/flashcards/generate.ts
import type { APIRoute } from "astro";
import { FlashcardGeneratorService } from "@/lib/services/flashcard-generator.service";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse request body
    const body = await request.json();
    const { text, limit = 5 } = body;

    // Validate inputs
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate flashcards
    const generatorService = new FlashcardGeneratorService();
    const flashcards = await generatorService.generateFlashcards(text, limit);

    // Return response
    return new Response(
      JSON.stringify({
        flashcards,
        message: "Flashcards generated successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("API Error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Failed to generate flashcards",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

## Advanced Usage

### Dynamic Configuration Updates

```typescript
const service = createOpenRouterService(config);

// Later, update configuration
service.setConfiguration({
  modelParameters: {
    temperature: 0.9, // More creative
    max_tokens: 300, // Longer responses
  },
});

// Send message with new configuration
const response = await service.sendMessage("Generate creative content...");
```

### Accessing Last Response for Debugging

```typescript
const service = createOpenRouterService(config);

await service.sendMessage("Test message");

// Get last response for debugging
const lastResponse = service.getLastResponse();
console.log("Raw response:", lastResponse?.raw);
console.log("Parsed content:", lastResponse?.content);
```

### Custom Logger Implementation

```typescript
import type { Logger } from "@/lib/services/openrouter.service";

class CustomLogger implements Logger {
  debug(message: string, meta?: unknown): void {
    // Send to logging service
    LoggingService.log("debug", message, meta);
  }

  info(message: string, meta?: unknown): void {
    LoggingService.log("info", message, meta);
  }

  error(message: string, meta?: unknown): void {
    LoggingService.log("error", message, meta);
    // Maybe send to error tracking service
    ErrorTracker.capture(message, meta);
  }

  warn(message: string, meta?: unknown): void {
    LoggingService.log("warn", message, meta);
  }
}

// Use custom logger
const service = createOpenRouterService(config, {
  logger: new CustomLogger(),
});
```

### Custom HTTP Client with Retry Logic

```typescript
import type { HttpClient, HttpResponse, RequestConfig } from "@/lib/services/openrouter.service";

class RetryHttpClient implements HttpClient {
  private maxRetries = 3;
  private retryDelay = 1000;

  async post<T>(
    url: string,
    data: unknown,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        // Use fetch with retry logic
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...config?.headers,
          },
          body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
          // Only retry on 5xx errors
          if (response.status >= 500 && attempt < this.maxRetries - 1) {
            await this.delay(this.retryDelay * (attempt + 1));
            continue;
          }

          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const headers: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });

        return {
          data: responseData as T,
          status: response.status,
          statusText: response.statusText,
          headers,
        };
      } catch (error) {
        lastError = error as Error;
        if (attempt < this.maxRetries - 1) {
          await this.delay(this.retryDelay * (attempt + 1));
        }
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Use custom HTTP client
const service = createOpenRouterService(config, {
  httpClient: new RetryHttpClient(),
});
```

## Error Handling Best Practices

```typescript
async function generateWithErrorHandling(text: string) {
  const service = createOpenRouterService(config);

  try {
    const response = await service.sendMessage(text);
    return { success: true, data: response.content };
  } catch (error) {
    // Handle specific error types
    if (error.message.includes("Authentication failed")) {
      return { success: false, error: "API key is invalid or missing" };
    }

    if (error.message.includes("Rate limit exceeded")) {
      return { success: false, error: "Too many requests, please try again later" };
    }

    if (error.message.includes("timeout")) {
      return { success: false, error: "Request took too long, please try again" };
    }

    if (error.message.includes("Network error")) {
      return { success: false, error: "Unable to connect to the API" };
    }

    // Generic error
    return { success: false, error: "An unexpected error occurred" };
  }
}
```

## Environment Variables

Add to your `.env` file:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_API_ENDPOINT=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL_NAME=openai/gpt-4-turbo
```

Access in your code:

```typescript
const service = createOpenRouterService({
  apiEndpoint: import.meta.env.OPENROUTER_API_ENDPOINT,
  modelName: import.meta.env.OPENROUTER_MODEL_NAME,
  apiKey: import.meta.env.OPENROUTER_API_KEY,
  // ... other config
});
```

## Testing

### Mocking the Service for Tests

```typescript
// __tests__/flashcard-generator.test.ts
import { vi, describe, it, expect } from "vitest";
import type { OpenRouterService } from "@/lib/services/openrouter.service";

describe("FlashcardGeneratorService", () => {
  it("should generate flashcards from text", async () => {
    // Mock OpenRouter service
    const mockService = {
      sendMessage: vi.fn().mockResolvedValue({
        content: {
          flashcards: [
            { question: "What is TypeScript?", answer: "A typed superset of JavaScript" },
          ],
        },
      }),
    } as unknown as OpenRouterService;

    // Use mock in your tests
    const result = await mockService.sendMessage("test");
    expect(result.content.flashcards).toHaveLength(1);
  });
});
```

## Security Considerations

1. **Never expose API keys in client-side code**
2. **Always use environment variables for sensitive configuration**
3. **Implement rate limiting on your API endpoints**
4. **Validate and sanitize all user inputs before sending to OpenRouter**
5. **Use HTTPS for all API communications**
6. **Consider implementing request signing for additional security**

## Performance Tips

1. **Set appropriate timeout values based on expected response times**
2. **Consider caching responses for identical requests**
3. **Implement retry logic for transient failures**
4. **Monitor API usage to stay within rate limits**
5. **Use lower temperature values (0.3-0.5) for more deterministic responses**
6. **Adjust max_tokens based on your needs to optimize costs**

