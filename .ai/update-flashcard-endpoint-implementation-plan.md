# API Endpoint Implementation Plan: Update Flashcard

## 1. Endpoint Overview
This endpoint allows authenticated users to update an existing flashcard's question and answer. The endpoint validates the input, checks ownership, updates the flashcard in the database, and returns a success message.

## 2. Request Details
- **HTTP Method**: PUT
- **URL Structure**: `/api/flashcards/{id}`
- **Parameters**:
  - **Path Parameters**:
    - `id` (string, required): UUID of the flashcard to update
  - **Body Parameters (JSON)**:
    - `question` (string, required): Updated question text (max 300 characters, non-empty)
    - `answer` (string, required): Updated answer text (max 500 characters, non-empty)

## 3. Used Types
- **Command Model**: `UpdateFlashcardCommand` (defined in `src/types.ts`)
- **Response**: Simple success message (no specific DTO needed)

## 4. Response Details
- **Success Response**: 
  - **Status Code**: 200 OK
  - **Body Structure**:
    ```json
    {
      "message": "Flashcard updated successfully"
    }
    ```
- **Error Responses**:
  - **400 Bad Request**: For invalid inputs (empty fields, exceeding max lengths, invalid UUID format).
  - **401 Unauthorized**: If user authentication fails.
  - **404 Not Found**: If flashcard with given ID doesn't exist or doesn't belong to user.
  - **500 Internal Server Error**: For unforeseen server-side errors.

## 5. Data Flow
1. **Entry Point**: The request hits the Astro API endpoint (`PUT /api/flashcards/{id}`).
2. **Authentication**: Middleware validates the JWT token. The authenticated user context is passed via the request.
3. **Path Parameter Validation**: 
   - Validate that `id` is provided and is a valid UUID format.
4. **Input Validation**: 
   - Validate that `question` and `answer` are provided.
   - Validate that `question` is non-empty and max 300 characters.
   - Validate that `answer` is non-empty and max 500 characters.
5. **Business Logic & Persistence**: 
   - Pass validated command to a dedicated flashcard update service.
   - Check that the flashcard exists and belongs to the authenticated user.
   - Transform question/answer into the flashcard content format (JSON stringified).
   - Update the flashcard in the database.
   - Return success message.
6. **Response Composition**: 
   - Return success message with 200 status.
7. **Error Handling**: Handle any exceptions from the service and return appropriate error responses.
8. **Logging**: Log errors to audit log for troubleshooting.

## 6. Security Considerations
- **Authentication & Authorization**: 
  - Ensure that the request is authenticated via a JWT token.
  - Users can only update their own flashcards (verify user_id matches).
- **Ownership Verification**: 
  - Check that the flashcard belongs to the authenticated user before updating.
  - Return 404 if flashcard doesn't exist or doesn't belong to user (don't reveal which).
- **Input Validation**: 
  - Validate all inputs to prevent injection attacks.
  - Enforce length limits to prevent resource exhaustion.
- **UUID Validation**: 
  - Validate that the ID parameter is a valid UUID format.

## 7. Error Handling
- **Validation Errors**: Return 400 Bad Request if:
  - Required fields (question, answer) are missing.
  - Question exceeds 300 characters.
  - Answer exceeds 500 characters.
  - Question or answer is empty/whitespace only.
  - ID is not a valid UUID format.
- **Authentication Errors**: Return 401 Unauthorized if the user is not authenticated.
- **Not Found**: Return 404 Not Found if:
  - Flashcard with given ID doesn't exist.
  - Flashcard exists but doesn't belong to authenticated user.
- **Server Errors**: Return 500 Internal Server Error on unexpected failures. Log these errors in an audit log.

## 8. Performance Considerations
- **Validation First**: Validate inputs before any database operations.
- **Single Query**: Use a single update query with conditions (user_id + id).
- **Optimistic Updates**: Check affected rows to determine if update was successful.

## 9. Implementation Steps
1. **Create Dynamic Route File**: 
   - Create a new API route file for `/api/flashcards/[id]` (e.g., `src/pages/api/flashcards/[id].ts`).
   - Add PUT handler with path parameter extraction.
2. **Input Validation**: 
   - Use `zod` for request body validation (question, answer).
   - Validate UUID format for the id parameter.
   - Return 400 error if validation fails.
3. **Create Service Function**: 
   - Add `updateFlashcard` function to flashcard service.
   - Query flashcard by id AND user_id (ownership check).
   - Transform question/answer into content format (JSON stringified).
   - Update the flashcard in database.
   - Return success or error status.
4. **Error Handling & Audit Logging**: 
   - Handle database errors gracefully.
   - Return 404 if flashcard not found or doesn't belong to user.
   - Log errors to audit log (validation errors, not found errors, database errors).
   - Return appropriate HTTP status codes.
5. **Response Assembly**: 
   - Return 200 status with success message.
6. **Testing**: 
   - Write unit tests for the service function.
   - Test successful update.
   - Test validation errors (empty fields, too long fields).
   - Test not found scenarios (invalid ID, other user's flashcard).
   - Test database errors.

## 10. Notes
- **Content Format**: The flashcard content is updated as JSON stringified object with question and answer fields, maintaining consistency with create operation.
- **Column Preservation**: The update operation should NOT modify the source, status, or metadata columns, only the content (question/answer) and updated_at timestamp.
- **Soft Deletes**: Should not allow updating soft-deleted flashcards (deleted_at IS NOT NULL).
- **Status Preservation**: The status column (active/pending) is not modified by this endpoint.
- **updated_at**: The database should automatically update the `updated_at` timestamp (if configured with trigger or default value).

