# API Endpoint Implementation Plan: Delete Flashcard

## 1. Endpoint Overview
This endpoint allows authenticated users to soft delete an existing flashcard. The endpoint validates the flashcard ID, checks ownership, performs a soft delete (sets `deleted_at` timestamp), and returns a success message.

## 2. Request Details
- **HTTP Method**: DELETE
- **URL Structure**: `/api/flashcards/{id}`
- **Parameters**:
  - **Path Parameters**:
    - `id` (string, required): UUID of the flashcard to delete

## 3. Used Types
- No specific DTO needed for request or response
- Simple success message response

## 4. Response Details
- **Success Response**: 
  - **Status Code**: 200 OK
  - **Body Structure**:
    ```json
    {
      "message": "Flashcard deleted successfully"
    }
    ```
- **Error Responses**:
  - **400 Bad Request**: For invalid UUID format.
  - **401 Unauthorized**: If user authentication fails.
  - **404 Not Found**: If flashcard with given ID doesn't exist or doesn't belong to user.
  - **500 Internal Server Error**: For unforeseen server-side errors.

## 5. Data Flow
1. **Entry Point**: The request hits the Astro API endpoint (`DELETE /api/flashcards/{id}`).
2. **Authentication**: Middleware validates the JWT token. The authenticated user context is passed via the request.
3. **Path Parameter Validation**: 
   - Validate that `id` is provided and is a valid UUID format.
4. **Business Logic & Persistence**: 
   - Pass validated ID to a dedicated flashcard delete service.
   - Check that the flashcard exists and belongs to the authenticated user.
   - Perform soft delete by setting `deleted_at` timestamp to current time.
   - Return success message.
5. **Response Composition**: 
   - Return success message with 200 status.
6. **Error Handling**: Handle any exceptions from the service and return appropriate error responses.
7. **Logging**: Log errors to audit log for troubleshooting.

## 6. Security Considerations
- **Authentication & Authorization**: 
  - Ensure that the request is authenticated via a JWT token.
  - Users can only delete their own flashcards (verify user_id matches).
- **Ownership Verification**: 
  - Check that the flashcard belongs to the authenticated user before deleting.
  - Return 404 if flashcard doesn't exist or doesn't belong to user (don't reveal which).
- **UUID Validation**: 
  - Validate that the ID parameter is a valid UUID format.
- **Soft Delete**: 
  - Use soft delete (set `deleted_at`) instead of hard delete to preserve data.
  - Don't allow deleting already deleted flashcards (idempotency consideration).

## 7. Error Handling
- **Validation Errors**: Return 400 Bad Request if:
  - ID is not a valid UUID format.
- **Authentication Errors**: Return 401 Unauthorized if the user is not authenticated.
- **Not Found**: Return 404 Not Found if:
  - Flashcard with given ID doesn't exist.
  - Flashcard exists but doesn't belong to authenticated user.
  - Flashcard is already deleted (for idempotency).
- **Server Errors**: Return 500 Internal Server Error on unexpected failures. Log these errors in an audit log.

## 8. Performance Considerations
- **Validation First**: Validate UUID format before any database operations.
- **Single Query**: Use a single update query with conditions (user_id + id + not already deleted).
- **Optimistic Updates**: Check affected rows to determine if delete was successful.

## 9. Implementation Steps
1. **Add DELETE Handler to Dynamic Route**: 
   - Update existing `/api/flashcards/[id]` file to add DELETE handler alongside PUT.
   - Reuse UUID validation from PUT handler.
2. **Create Service Function**: 
   - Add `deleteFlashcard` function to flashcard service.
   - Query flashcard by id AND user_id (ownership check).
   - Check that flashcard is not already deleted.
   - Set `deleted_at` to current timestamp.
   - Return success or error status.
3. **Implement Soft Delete Logic**: 
   - Update query with conditions: id matches, user_id matches, deleted_at IS NULL.
   - Set deleted_at = NOW().
   - Return 404 if no rows affected (doesn't exist, wrong owner, or already deleted).
4. **Error Handling & Audit Logging**: 
   - Handle database errors gracefully.
   - Return 404 if flashcard not found or doesn't belong to user.
   - Log errors to audit log (validation errors, not found errors, database errors).
   - Return appropriate HTTP status codes.
5. **Testing**: 
   - Write unit tests for the service function.
   - Test successful soft delete.
   - Test idempotency (deleting already deleted flashcard).
   - Test not found scenarios (invalid ID, other user's flashcard).
   - Test database errors.

## 10. Notes
- **Soft Delete**: The operation sets `deleted_at` to the current timestamp instead of removing the record from the database. This allows for potential recovery and audit trails.
- **Idempotency**: Attempting to delete an already deleted flashcard returns 404 (consistent with "not found" behavior for deleted resources).
- **No Confirmation**: The client is expected to have performed a confirmation step before calling this endpoint.
- **updated_at**: The database should automatically update the `updated_at` timestamp when `deleted_at` is set.

