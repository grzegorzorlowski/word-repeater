# API Endpoint Implementation Plan: Create Manual Flashcard

## 1. Endpoint Overview
This endpoint allows authenticated users to manually create a flashcard by providing a question and answer. The endpoint validates the input, persists the flashcard to the database, and returns the created flashcard summary.

## 2. Request Details
- **HTTP Method**: POST
- **URL Structure**: `/api/flashcards`
- **Parameters**:
  - **Body Parameters (JSON)**:
    - `question` (string, required): The question text (max 300 characters, non-empty)
    - `answer` (string, required): The answer text (max 500 characters, non-empty)
    - `metadata` (object, optional): Additional metadata (e.g., tags, categories)

## 3. Used Types
- **Command Model**: `CreateManualFlashcardCommand` (defined in `src/types.ts`)
- **DTO for Response**: `CreateManualFlashcardResponseDTO` (defined in `src/types.ts`)
- **DTO for Flashcard Summary**: `FlashcardSummaryDTO` (defined in `src/types.ts`)

## 4. Response Details
- **Success Response**: 
  - **Status Code**: 201 Created
  - **Body Structure**:
    ```json
    {
      "message": "Flashcard created successfully",
      "flashcard": {
        "id": "UUID",
        "content": "JSON stringified question/answer",
        "created_at": "ISO8601 timestamp"
      }
    }
    ```
- **Error Responses**:
  - **400 Bad Request**: For invalid inputs (empty fields, exceeding max lengths).
  - **401 Unauthorized**: If user authentication fails.
  - **500 Internal Server Error**: For unforeseen server-side errors.

## 5. Data Flow
1. **Entry Point**: The request hits the Astro API endpoint (`POST /api/flashcards`).
2. **Authentication**: Middleware validates the JWT token. The authenticated user context is passed via the request (e.g., `context.locals.supabase`).
3. **Input Validation**: 
   - Validate that `question` and `answer` are provided.
   - Validate that `question` is non-empty and max 300 characters.
   - Validate that `answer` is non-empty and max 500 characters.
   - Validate that `metadata` is a valid object if provided.
4. **Business Logic & Persistence**: 
   - Pass validated command to a dedicated flashcard creation service.
   - Transform question/answer into the flashcard content format (JSON stringified).
   - Set metadata source to "manual" to distinguish from AI-generated flashcards.
   - Persist the flashcard to the database with user_id.
5. **Response Composition**: 
   - Return the created flashcard summary with 201 status.
   - Include success message and flashcard details (id, content, created_at).
6. **Error Handling**: Handle any exceptions from the service and return appropriate error responses.
7. **Logging**: Log errors to audit log for troubleshooting.

## 6. Security Considerations
- **Authentication & Authorization**: 
  - Ensure that the request is authenticated via a JWT token.
  - Users can only create flashcards for themselves (use authenticated user_id).
- **Input Validation**: 
  - Validate all inputs to prevent injection attacks.
  - Enforce length limits to prevent resource exhaustion.
- **Input Sanitization**: 
  - Validate that question and answer are strings.
  - Validate metadata structure if provided.

## 7. Error Handling
- **Validation Errors**: Return 400 Bad Request if:
  - Required fields (question, answer) are missing.
  - Question exceeds 300 characters.
  - Answer exceeds 500 characters.
  - Question or answer is empty/whitespace only.
- **Authentication Errors**: Return 401 Unauthorized if the user is not authenticated.
- **Server Errors**: Return 500 Internal Server Error on unexpected failures. Log these errors in an audit log.

## 8. Performance Considerations
- **Validation First**: Validate inputs before any database operations.
- **Database Operations**: Use single insert operation for efficiency.
- **Error Handling**: Fast-fail on validation errors to prevent unnecessary processing.

## 9. Implementation Steps
1. **Add POST Handler to Existing Endpoint**: 
   - Update the existing `/api/flashcards` file (`src/pages/api/flashcards/index.ts`) to add POST handler alongside GET.
2. **Input Validation**: 
   - Use `zod` for request body validation.
   - Validate question (non-empty, max 300 chars).
   - Validate answer (non-empty, max 500 chars).
   - Validate metadata as optional object.
   - Return 400 error if validation fails.
3. **Create Service Function**: 
   - Add `createManualFlashcard` function to flashcard service.
   - Transform question/answer into content format (JSON stringified).
   - Set metadata.source to "manual".
   - Insert flashcard into database.
   - Return flashcard summary.
4. **Error Handling & Audit Logging**: 
   - Handle database errors gracefully.
   - Log errors to audit log (validation errors, database errors, unexpected errors).
   - Return appropriate HTTP status codes.
5. **Response Assembly**: 
   - Format response using `CreateManualFlashcardResponseDTO`.
   - Return 201 status with created flashcard summary.
6. **Testing**: 
   - Write unit tests for the service function.
   - Test successful creation.
   - Test validation errors (empty fields, too long fields).
   - Test database errors.
   - Test metadata handling (with and without metadata).

## 10. Notes
- **Content Format**: The flashcard content is stored as JSON stringified object with question and answer fields, matching the format used for AI-generated flashcards.
- **Metadata Source**: Set `metadata.source = "manual"` to distinguish from AI-generated flashcards (`metadata.source = "ai_generated"`).
- **Endpoint Reuse**: The POST handler shares the same route as the GET handler (`/api/flashcards`), following REST conventions.
- **Trimming**: Consider trimming whitespace from question and answer before validation.

