// src/lib/services/openrouter.service.ts

/**
 * OpenRouter Service
 *
 * Responsible for interacting with the OpenRouter API to drive LLM-based chat interactions.
 * Handles message assembly, API integration, structured response parsing, configuration management,
 * error handling, and logging.
 */

// ============================================================================
// Types and Interfaces (Step 2)
// ============================================================================

/**
 * JSON Schema definition for structured API responses.
 */
export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: boolean;
    schema: Record<string, unknown>;
  };
}

/**
 * Model parameters for controlling LLM behavior.
 */
export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Configuration object for the OpenRouter service.
 */
export interface OpenRouterConfiguration {
  apiEndpoint: string;
  modelName: string;
  modelParameters: ModelParameters;
  responseFormat: ResponseFormat;
  apiKey?: string;
  timeout?: number;
}

/**
 * Message structure for the chat API.
 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Request payload structure for OpenRouter API.
 */
export interface OpenRouterRequestPayload {
  model: string;
  messages: ChatMessage[];
  response_format: ResponseFormat;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

/**
 * Parsed response from OpenRouter API.
 */
export interface OpenRouterResponse {
  content: Record<string, unknown>;
  raw?: unknown;
}

/**
 * Logger interface for dependency injection.
 */
export interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  error(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
}

/**
 * HTTP Client interface for making API requests.
 */
export interface HttpClient {
  post<T>(url: string, data: unknown, config?: RequestConfig): Promise<HttpResponse<T>>;
}

/**
 * HTTP request configuration.
 */
export interface RequestConfig {
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * HTTP response structure.
 */
export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

/**
 * OpenRouter API error response structure.
 */
export interface OpenRouterErrorResponse {
  error?: {
    message: string;
    type?: string;
    code?: string;
  };
  message?: string;
}

// ============================================================================
// OpenRouter Service Class (Step 3: Constructor Implementation)
// ============================================================================

/**
 * Service class for interacting with the OpenRouter API.
 *
 * Provides methods for sending chat messages with structured responses,
 * dynamic configuration management, and comprehensive error handling.
 *
 * @example
 * ```typescript
 * const service = new OpenRouterService({
 *   apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
 *   modelName: "openai/gpt-4-turbo",
 *   modelParameters: { temperature: 0.7, max_tokens: 150 },
 *   responseFormat: {
 *     type: 'json_schema',
 *     json_schema: {
 *       name: 'FlashcardSchema',
 *       strict: true,
 *       schema: {
 *         question: { type: 'string' },
 *         answer: { type: 'string' }
 *       }
 *     }
 *   },
 *   apiKey: process.env.OPENROUTER_API_KEY
 * });
 *
 * const response = await service.sendMessage(
 *   "Generate a flashcard about TypeScript",
 *   "You are a helpful flashcard generator"
 * );
 * ```
 */
export class OpenRouterService {
  // Private fields
  private _currentConfig: OpenRouterConfiguration;
  private _httpClient: HttpClient;
  private _logger: Logger;
  private _lastResponse: OpenRouterResponse | null = null;

  // Public fields (readonly accessors)
  public readonly apiEndpoint: string;
  public readonly modelName: string;
  public readonly modelParameters: ModelParameters;
  public readonly responseFormat: ResponseFormat;

  /**
   * Creates a new instance of OpenRouterService.
   *
   * @param config - Configuration object containing API settings
   * @param httpClient - HTTP client for making API requests
   * @param logger - Logger instance for capturing debug and error logs
   *
   * @throws {Error} If required configuration fields are missing
   *
   * @example
   * ```typescript
   * const service = new OpenRouterService(config, fetchHttpClient, consoleLogger);
   * ```
   */
  constructor(config: OpenRouterConfiguration, httpClient: HttpClient, logger: Logger) {
    // Validate required configuration
    if (!config.apiEndpoint) {
      throw new Error("OpenRouterService: apiEndpoint is required");
    }
    if (!config.modelName) {
      throw new Error("OpenRouterService: modelName is required");
    }
    if (!config.responseFormat) {
      throw new Error("OpenRouterService: responseFormat is required");
    }

    // Store dependencies
    this._httpClient = httpClient;
    this._logger = logger;

    // Initialize configuration with defaults
    this._currentConfig = {
      ...config,
      timeout: config.timeout ?? 30000, // Default 30 second timeout
      modelParameters: {
        temperature: 0.7,
        max_tokens: 150,
        ...config.modelParameters,
      },
    };

    // Set public readonly fields
    this.apiEndpoint = this._currentConfig.apiEndpoint;
    this.modelName = this._currentConfig.modelName;
    this.modelParameters = this._currentConfig.modelParameters;
    this.responseFormat = this._currentConfig.responseFormat;

    this._logger.debug("OpenRouterService initialized", {
      apiEndpoint: this.apiEndpoint,
      modelName: this.modelName,
    });
  }

  // ============================================================================
  // Public Methods (Step 4)
  // ============================================================================

  /**
   * Sends a message to the OpenRouter API and returns the parsed response.
   *
   * @param userMessage - The user's message/query
   * @param systemMessage - Optional system message for context
   * @returns Promise resolving to the parsed API response
   *
   * @throws {Error} If the API request fails or response validation fails
   *
   * @example
   * ```typescript
   * const response = await service.sendMessage(
   *   "Generate a flashcard about TypeScript",
   *   "You are a helpful flashcard generator"
   * );
   * console.log(response.content);
   * ```
   */
  public async sendMessage(userMessage: string, systemMessage?: string): Promise<OpenRouterResponse> {
    // Input validation
    if (!userMessage || userMessage.trim().length === 0) {
      this._logger.error("sendMessage called with empty user message");
      throw new Error("User message cannot be empty");
    }

    this._logger.debug("Sending message to OpenRouter API", {
      userMessageLength: userMessage.length,
      hasSystemMessage: !!systemMessage,
    });

    try {
      // Build the request payload
      const payload = this._buildPayload(userMessage, systemMessage);

      // Prepare request headers
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      // Add API key if provided
      if (this._currentConfig.apiKey) {
        headers["Authorization"] = `Bearer ${this._currentConfig.apiKey}`;
      }

      // Make the API request
      const response = await this._httpClient.post<unknown>(this._currentConfig.apiEndpoint, payload, {
        headers,
        timeout: this._currentConfig.timeout,
      });

      this._logger.debug("Received response from OpenRouter API", {
        status: response.status,
      });

      // Parse and validate the response
      const parsedResponse = this._parseResponse(response.data);

      // Cache the last response
      this._lastResponse = parsedResponse;

      this._logger.info("Message sent successfully");

      return parsedResponse;
    } catch (error) {
      this._handleError(error);
    }
  }

  /**
   * Dynamically updates the service configuration.
   *
   * Allows updating model parameters, response format, and other settings
   * without recreating the service instance.
   *
   * @param config - Partial configuration object with fields to update
   *
   * @example
   * ```typescript
   * service.setConfiguration({
   *   modelParameters: { temperature: 0.9, max_tokens: 200 }
   * });
   * ```
   */
  public setConfiguration(config: Partial<OpenRouterConfiguration>): void {
    this._logger.debug("Updating configuration", config);

    // Merge new config with existing config
    this._currentConfig = {
      ...this._currentConfig,
      ...config,
      // Deep merge model parameters
      modelParameters: {
        ...this._currentConfig.modelParameters,
        ...(config.modelParameters || {}),
      },
    };

    this._logger.info("Configuration updated successfully");
  }

  /**
   * Returns the most recent API response for debugging or further processing.
   *
   * @returns The last response or null if no requests have been made
   */
  public getLastResponse(): OpenRouterResponse | null {
    return this._lastResponse;
  }

  // ============================================================================
  // Private Methods (Step 5 & 6: OpenRouter API Integration)
  // ============================================================================

  /**
   * Builds the request payload for the OpenRouter API.
   *
   * Constructs a properly formatted payload including:
   * - System message (if provided) with role "system"
   * - User message with role "user"
   * - Model name and parameters
   * - Structured response format (JSON schema)
   *
   * @param userMessage - The user's message
   * @param systemMessage - Optional system message for context
   * @returns Formatted request payload ready to send to OpenRouter API
   */
  private _buildPayload(userMessage: string, systemMessage?: string): OpenRouterRequestPayload {
    // Sanitize inputs to prevent injection attacks
    const sanitizedUserMessage = this._sanitizeInput(userMessage);
    const sanitizedSystemMessage = systemMessage ? this._sanitizeInput(systemMessage) : undefined;

    // Build messages array
    const messages: ChatMessage[] = [];

    // Add system message if provided (Step 6: System Message)
    if (sanitizedSystemMessage) {
      messages.push({
        role: "system",
        content: sanitizedSystemMessage,
      });
    }

    // Add user message (Step 6: User Message)
    messages.push({
      role: "user",
      content: sanitizedUserMessage,
    });

    // Construct the full payload (Step 6: Complete API Integration)
    const payload: OpenRouterRequestPayload = {
      model: this._currentConfig.modelName, // Step 6: Model Name
      messages,
      response_format: this._currentConfig.responseFormat, // Step 6: Structured Responses
      ...this._currentConfig.modelParameters, // Step 6: Model Parameters
    };

    this._logger.debug("Built payload", {
      messageCount: messages.length,
      model: payload.model,
      hasSystemMessage: !!sanitizedSystemMessage,
    });

    return payload;
  }

  /**
   * Parses and validates the API response against the configured JSON schema.
   *
   * OpenRouter API returns responses in the format:
   * {
   *   choices: [{ message: { content: string } }]
   * }
   *
   * This method extracts the content and validates it against the schema.
   *
   * @param rawResponse - The raw API response
   * @returns Parsed and validated response
   *
   * @throws {Error} If response format is invalid or schema validation fails in strict mode
   */
  private _parseResponse(rawResponse: unknown): OpenRouterResponse {
    // Validate response structure
    if (!rawResponse || typeof rawResponse !== "object") {
      this._logger.error("Invalid response: not an object", rawResponse);
      throw new Error("OpenRouter API returned invalid response format");
    }

    const response = rawResponse as Record<string, unknown>;

    // Check for error in response
    if (response.error) {
      const errorData = response as OpenRouterErrorResponse;
      const errorMessage = errorData.error?.message || errorData.message || "Unknown API error";
      this._logger.error("API returned error", errorData);
      throw new Error(`OpenRouter API Error: ${errorMessage}`);
    }

    // Extract choices array
    if (!Array.isArray(response.choices) || response.choices.length === 0) {
      this._logger.error("Invalid response: missing or empty choices array", response);
      throw new Error("OpenRouter API response missing choices");
    }

    // Extract message content from first choice
    const firstChoice = response.choices[0] as Record<string, unknown>;
    const message = firstChoice.message as Record<string, unknown>;

    if (!message || typeof message.content !== "string") {
      this._logger.error("Invalid response: missing message content", firstChoice);
      throw new Error("OpenRouter API response missing message content");
    }

    // Parse JSON content if using json_schema response format
    let parsedContent: Record<string, unknown>;
    try {
      const parsed = JSON.parse(message.content);

      // Handle case where AI returns array directly instead of object
      // If schema expects an object with a single array property, wrap the array
      if (Array.isArray(parsed)) {
        this._logger.warn("AI returned array directly, attempting to wrap in expected schema format");

        const schema = this._currentConfig.responseFormat.json_schema.schema;
        const properties = schema.properties as Record<string, unknown> | undefined;

        // Find the first array property in the schema
        if (properties) {
          const arrayPropertyKey = Object.keys(properties).find((key) => {
            const prop = properties[key] as { type?: string };
            return prop.type === "array";
          });

          if (arrayPropertyKey) {
            this._logger.debug(`Wrapping array in '${arrayPropertyKey}' property`);
            parsedContent = { [arrayPropertyKey]: parsed };
          } else {
            // Array doesn't match schema expectations, let validation handle it
            throw new Error("AI returned array but schema does not define array properties");
          }
        } else {
          // No properties defined in schema, let validation handle it
          throw new Error("AI returned array but schema does not define properties");
        }
      } else {
        parsedContent = parsed as Record<string, unknown>;
      }
    } catch (error) {
      this._logger.error("Failed to parse JSON content", { content: message.content, error });
      throw new Error("OpenRouter API returned invalid JSON content");
    }

    // Validate against schema if strict mode is enabled
    if (this._currentConfig.responseFormat.json_schema.strict) {
      const validationResult = this._validateAgainstSchema(
        parsedContent,
        this._currentConfig.responseFormat.json_schema.schema
      );

      if (!validationResult.valid) {
        this._logger.error("Schema validation failed", {
          errors: validationResult.errors,
          content: parsedContent,
        });
        throw new Error(
          `Response validation failed: ${validationResult.errors?.join(", ") || "Unknown validation error"}`
        );
      }
    }

    this._logger.debug("Response parsed and validated successfully");

    return {
      content: parsedContent,
      raw: rawResponse,
    };
  }

  /**
   * Centralizes error handling, logging, and error message formatting.
   *
   * Handles different error types:
   * - Network errors (connectivity issues)
   * - HTTP status errors (401, 500, etc.)
   * - Timeout errors
   * - Validation errors
   *
   * @param error - The error object to handle
   * @throws {Error} Formatted error with additional context
   */
  private _handleError(error: unknown): never {
    // Handle different error types with specific messages
    if (error instanceof Error) {
      // Check for network errors
      if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
        this._logger.error("Network error: Unable to reach OpenRouter API", error);
        throw new Error("Network error: Unable to reach OpenRouter API. Please check your connection.");
      }

      // Check for timeout errors
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        this._logger.error("Request timeout", error);
        throw new Error(`Request timeout: OpenRouter API did not respond within ${this._currentConfig.timeout}ms`);
      }

      // Check for HTTP response errors
      const httpError = error as { status?: number; statusText?: string };
      if (httpError.status) {
        this._logger.error(`HTTP ${httpError.status} error`, error);

        switch (httpError.status) {
          case 401:
            throw new Error("Authentication failed: Invalid or missing API key");
          case 403:
            throw new Error("Access forbidden: Check your API permissions");
          case 429:
            throw new Error("Rate limit exceeded: Too many requests to OpenRouter API");
          case 500:
          case 502:
          case 503:
            throw new Error("OpenRouter API server error: Please try again later");
          default:
            throw new Error(`OpenRouter API error (${httpError.status}): ${httpError.statusText || "Unknown error"}`);
        }
      }

      // Re-throw known errors with context
      this._logger.error("OpenRouter service error", error);
      throw new Error(`OpenRouter service error: ${error.message}`);
    }

    // Handle unknown error types
    this._logger.error("Unknown error type", error);
    throw new Error(`OpenRouter service encountered an unknown error: ${String(error)}`);
  }

  /**
   * Sanitizes input strings to prevent injection attacks.
   *
   * @param input - The input string to sanitize
   * @returns Sanitized string
   */
  private _sanitizeInput(input: string): string {
    // Basic sanitization: trim whitespace and remove null bytes
    return input.trim().replace(/\0/g, "");
  }

  /**
   * Validates parsed content against the configured JSON schema.
   *
   * Performs basic schema validation to ensure response structure matches expectations.
   * For production use, consider using a full JSON schema validation library like Ajv.
   *
   * @param content - The parsed content to validate
   * @param schema - The JSON schema to validate against
   * @returns Validation result with valid flag and any errors
   */
  private _validateAgainstSchema(
    content: Record<string, unknown>,
    schema: Record<string, unknown>
  ): { valid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Validate root type
    const schemaType = schema.type as string | undefined;
    if (schemaType === "object" && typeof content !== "object") {
      errors.push(`Expected type 'object' but got '${typeof content}'`);
      return { valid: false, errors };
    }

    // Check required fields
    const requiredFields = schema.required as string[] | undefined;
    if (requiredFields && Array.isArray(requiredFields)) {
      for (const field of requiredFields) {
        if (!(field in content)) {
          errors.push(`Missing required field: ${field}`);
        }
      }
    }

    // Validate properties
    const properties = schema.properties as Record<string, unknown> | undefined;
    if (properties) {
      for (const [key, propertySchema] of Object.entries(properties)) {
        if (key in content) {
          const propertyDef = propertySchema as { type?: string };
          const contentValue = content[key];
          const actualType = Array.isArray(contentValue) ? "array" : typeof contentValue;

          if (propertyDef.type && propertyDef.type !== actualType) {
            errors.push(`Field '${key}' expected type '${propertyDef.type}' but got '${actualType}'`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }
}

// ============================================================================
// Default Console Logger Implementation
// ============================================================================

/**
 * Simple console-based logger implementation for development.
 * In production, replace with a proper logging service.
 */
export class ConsoleLogger implements Logger {
  debug(message: string, meta?: unknown): void {
    console.debug(`[DEBUG] ${message}`, meta ?? "");
  }

  info(message: string, meta?: unknown): void {
    console.info(`[INFO] ${message}`, meta ?? "");
  }

  error(message: string, meta?: unknown): void {
    console.error(`[ERROR] ${message}`, meta ?? "");
  }

  warn(message: string, meta?: unknown): void {
    console.warn(`[WARN] ${message}`, meta ?? "");
  }
}

// ============================================================================
// Default Fetch-based HTTP Client Implementation
// ============================================================================

/**
 * Fetch-based HTTP client implementation for making API requests.
 * Works in both browser and Node.js environments (Node 18+).
 *
 * For advanced features (retries, interceptors), consider using axios or similar libraries.
 */
export class FetchHttpClient implements HttpClient {
  /**
   * Makes a POST request to the specified URL.
   *
   * @param url - The endpoint URL
   * @param data - The request payload
   * @param config - Optional request configuration (headers, timeout)
   * @returns Promise resolving to HTTP response
   *
   * @throws {Error} On network errors, timeouts, or non-2xx status codes
   */
  async post<T>(url: string, data: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    const controller = new AbortController();
    const timeoutId = config?.timeout ? setTimeout(() => controller.abort(), config.timeout) : undefined;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...config?.headers,
        },
        body: JSON.stringify(data),
        signal: controller.signal,
      });

      // Clear timeout if request completed
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Parse response body
      const responseData = await response.json();

      // Check for HTTP errors
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`) as Error & {
          status: number;
          statusText: string;
          data: unknown;
        };
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = responseData;
        throw error;
      }

      // Convert Headers to plain object
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
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle abort (timeout) errors
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${config?.timeout}ms`);
      }

      // Re-throw other errors
      throw error;
    }
  }
}

// ============================================================================
// Factory Function for Easy Service Creation
// ============================================================================

/**
 * Creates a new OpenRouterService instance with default dependencies.
 *
 * @param config - Service configuration
 * @param options - Optional custom logger and HTTP client
 * @returns Configured OpenRouterService instance
 *
 * @example
 * ```typescript
 * const service = createOpenRouterService({
 *   apiEndpoint: "https://openrouter.ai/api/v1/chat/completions",
 *   modelName: "openai/gpt-4o-mini",
 *   apiKey: process.env.OPENROUTER_API_KEY,
 *   modelParameters: { temperature: 0.7, max_tokens: 150 },
 *   responseFormat: {
 *     type: 'json_schema',
 *     json_schema: {
 *       name: 'FlashcardSchema',
 *       strict: true,
 *       schema: {
 *         question: { type: 'string' },
 *         answer: { type: 'string' }
 *       }
 *     }
 *   }
 * });
 *
 * const response = await service.sendMessage("Create a flashcard about TypeScript");
 * ```
 */
export function createOpenRouterService(
  config: OpenRouterConfiguration,
  options?: {
    logger?: Logger;
    httpClient?: HttpClient;
  }
): OpenRouterService {
  const logger = options?.logger || new ConsoleLogger();
  const httpClient = options?.httpClient || new FetchHttpClient();

  return new OpenRouterService(config, httpClient, logger);
}
