# OpenRouter Service Implementation Guide

## 1. Service Description

The OpenRouter service is responsible for interacting with the OpenRouter API interface to drive LLM-based chat interactions. Its main responsibilities include:

1. **Message Assembly:** Constructing the input payload containing system and user messages.
2. **API Integration:** Sending requests to, and handling responses from, the OpenRouter API.
3. **Structured Response Parsing:** Enforcing and parsing JSON schema-based responses.
4. **Configuration Management:** Handling dynamic configuration for model name, model parameters, and response format.
5. **Error Handling:** Managing potential error scenarios and implementing retry strategies.
6. **Logging and Auditing:** Capturing interactions and errors for monitoring and debugging.

## 2. Constructor Description

The constructor sets up the service with essential configurations. It accepts:

- **Configuration Object:** Contains default settings such as API endpoint, model name, model parameters, and the default response format.
- **Logger Instance:** For capturing debug, info, and error logs.
- **HTTP Client Interface:** For making POST requests to the OpenRouter API.
- **Optional Overrides:** System message or any dynamic parameters to be appended to requests.

Example:

```typescript
// Pseudocode
const openRouterService = new OpenRouterService({
  apiEndpoint: "https://openrouter.example.com/api/chat",
  modelName: "gpt-4",
  modelParameters: { temperature: 0.7, max_tokens: 150 },
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "ChatResponseSchema",
      strict: true,
      schema: {
        answer: { type: "string" },
        citations: { type: "array" },
      },
    },
  },
});
```

## 3. Public Methods and Fields

### Public Methods

1. **sendMessage(userMessage: string, [systemMessage?: string]): Promise\<Response\>**
   - **Functionality:** Combines the optional system message and user message into the structured request payload. It then calls the API and returns the parsed response.
   - **Example Payload:**
     ```json
     {
       "model": "gpt-4",
       "messages": [
         { "role": "system", "content": "Your system configuration message" },
         { "role": "user", "content": "User query goes here" }
       ],
       "response_format": {
         "type": "json_schema",
         "json_schema": {
           "name": "ChatResponseSchema",
           "strict": true,
           "schema": {
             "answer": { "type": "string" },
             "citations": { "type": "array" }
           }
         }
       },
       "model_parameters": { "temperature": 0.7, "max_tokens": 150 }
     }
     ```
2. **setConfiguration(config: Partial\<Configuration\>): void**
   - **Functionality:** Dynamically updates service configurations such as model name, parameters, or response format.
3. **getLastResponse(): Response | null**
   - **Functionality:** Returns the most recent API response for debugging or further processing.

### Public Fields

- **apiEndpoint:** The base URL for the OpenRouter API.
- **modelName:** The default model name to be used for API requests.
- **modelParameters:** Default parameters such as `temperature` and `max_tokens`.
- **responseFormat:** The expected response format in terms of JSON schema.

## 4. Private Methods and Fields

### Private Methods

1. **\_buildPayload(userMessage: string, systemMessage?: string): RequestPayload**
   - **Functionality:** Creates the full payload object by combining system and user messages along with configuration fields.
2. **\_parseResponse(rawResponse: any): Response**
   - **Functionality:** Validates and parses the API response based on the configured JSON schema. If the schema check fails and `strict` is enabled, an error is thrown.
3. **\_handleError(error: any): void**
   - **Functionality:** Centralizes error management, logs errors, and prepares informative error messages.

### Private Fields

- **\_httpClient:** Abstraction for making HTTP requests.
- **\_logger:** Instance for logging debug and error messages.
- **\_lastResponse:** Cache of the last successful response.
- **\_currentConfig:** Internal privacy for the current configuration parameters.

## 5. Error Handling

The service should address potential error scenarios:

1. **Network Errors:** Unreachable API or connectivity issues.
   - **Solution:** Implement retries with exponential backoff and friendly error messaging.
2. **Invalid Response Format:** The API returns a payload not matching the JSON schema.
   - **Solution:** Use schema validation libraries, log discrepancies, and throw a descriptive error if `strict` mode is enabled.
3. **HTTP Status Errors:** Non-200 status codes (e.g., 401 Unauthorized, 500 Internal Server Error).
   - **Solution:** Check status codes, log error details, and optionally implement custom error maps for handling each code.
4. **Timeouts:** API fRequest takes too long.
   - **Solution:** Set a timeout value on HTTP requests and handle aborts gracefully.

## 6. Security Considerations

- **API Credentials:** Ensure that API keys or tokens are stored securely and not exposed in the client code.
- **Input Sanitization:** Sanitize the user inputs to prevent injection or malformed requests.
- **Logging:** Avoid logging sensitive data.
- **Strict Schema Validation:** Ensure responses strictly adhere to the defined JSON schema to avoid unexpected behavior.

## 7. Step-by-Step Implementation Plan

1. **Module & File Setup:**
   - Create a new file at `.ai/openrouter-service-implementation-plan.md` for documentation.
   - Develop the service module (e.g., `src/lib/openRouterService.ts`).

2. **Define Types and Interfaces:**
   - Create interfaces for the configuration object, request payload, and expected response.
   - Example:

     ```typescript
     interface ResponseFormat {
       type: "json_schema";
       json_schema: {
         name: string;
         strict: boolean;
         schema: object;
       };
     }

     interface Configuration {
       apiEndpoint: string;
       modelName: string;
       modelParameters: object;
       responseFormat: ResponseFormat;
     }

     interface RequestPayload {
       model: string;
       messages: { role: string; content: string }[];
       response_format: ResponseFormat;
       model_parameters: object;
     }
     ```

3. **Implement the Constructor:**
   - Store initial configuration and set up HTTP client and logger instances.
   - Assign defaults that follow best practices outlined in the tech stack.

4. **Implement Public Methods:**
   - `sendMessage(userMessage, systemMessage?)`:
     - Use `_buildPayload` to create the payload.
     - Send the payload via the HTTP client.
     - Use `_parseResponse` to validate and return the response.
   - `setConfiguration`: Allow updates to internal configuration.
   - `getLastResponse`: Retrieve the stored response.

5. **Develop Private Methods:**
   - Implement `_buildPayload` to handle assembling system and user messages.
   - Implement `_parseResponse` using available JSON schema libraries to enforce the structure.
   - Implement `_handleError` to centralize logging and error conversion.

6. **Incorporate OpenRouter API Elements:**
   - **System Message:** Include as a dedicated message in the payload (e.g., `role: "system", content: "<system_message>"`).
     - _Example:_ `{ "role": "system", "content": "You are using a secure LLM interface" }`
   - **User Message:** Include as the primary query message in the payload.
     - _Example:_ `{ "role": "user", "content": "What is the weather today?" }`
   - **Structured Responses:** Use a `response_format` field in the payload.
     - _Example:_
       ```json
       "response_format": {
         "type": "json_schema",
         "json_schema": {
           "name": "ChatResponseSchema",
           "strict": true,
           "schema": {
             "answer": { "type": "string" },
             "citations": { "type": "array" }
           }
         }
       }
       ```
   - **Model Name:** Pass as part of the payload in the `model` field.
   - **Model Parameters:** Include any additional parameters (e.g., `temperature` and `max_tokens`) in the `model_parameters` field.

7. **Implement Error Handling:**
   - Set up try-catch blocks around API calls.
   - Use the `_handleError` method to log and throw informative errors.
   - Implement specific handling for network and HTTP status errors.

8. **Security and Review:**
   - Review all external inputs and ensure they’re sanitized.
   - Verify that API keys or sensitive tokens are managed securely (e.g., via environment variables).
