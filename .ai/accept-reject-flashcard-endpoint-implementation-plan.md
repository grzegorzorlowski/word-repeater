# API Endpoint Implementation Plan: Accept/Reject AI Flashcard

## 1. Endpoint Overview
This endpoint allows users to accept or reject AI-generated flashcard suggestions. When a flashcard is accepted, it transitions from `pending` to `active` status. When rejected, it's soft-deleted (sets `deleted_at` timestamp). This endpoint only works with AI-generated flashcards (source = 'ai_generated').

## 2. Request Details
- **HTTP Method**: POST
- **URL Structure**: `/api/flashcards/{id}/decision`
- **Parameters**:
  - **Path Parameters**:
    - `id` (string, required): UUID of the AI-generated flashcard
  - **Request Body**:
    - `decision` (string, required): Either "accept" or "reject"

## 3. Used Types
Add to `src/types.ts`:

```typescript
// Request DTO for accepting/rejecting AI flashcards
export interface AcceptRejectFlashcardCommand {
  decision: "accept" | "reject";
}

// Response DTO for accept/reject operation
export interface AcceptRejectFlashcardResponseDTO {
  message: string;
  flashcard_id: string;
  status: "active" | "deleted";
}
```

## 4. Response Details
- **Success Response**: 
  - **Status Code**: 200 OK
  - **Body Structure**:
    ```json
    {
      "message": "Flashcard accepted successfully",
      "flashcard_id": "uuid",
      "status": "active"
    }
    ```
    OR
    ```json
    {
      "message": "Flashcard rejected successfully",
      "flashcard_id": "uuid",
      "status": "deleted"
    }
    ```
- **Error Responses**:
  - **400 Bad Request**: Invalid decision value or flashcard is not AI-generated/pending.
  - **401 Unauthorized**: If user authentication fails.
  - **404 Not Found**: If flashcard doesn't exist or doesn't belong to user.
  - **500 Internal Server Error**: For unforeseen server-side errors.

## 5. Data Flow
1. **Entry Point**: Request hits the Astro API endpoint (`POST /api/flashcards/{id}/decision`).
2. **Authentication**: Middleware validates JWT token. User context is passed via request.
3. **Path Parameter & Body Validation**: 
   - Validate `id` is a valid UUID
   - Validate `decision` is either "accept" or "reject"
4. **Business Logic & Persistence**: 
   - Pass validated data to dedicated accept/reject service
   - Verify flashcard exists, belongs to user, is AI-generated, and has pending status
   - If accept: Update status to 'active'
   - If reject: Set `deleted_at` to current timestamp
5. **Response Composition**: Return success message with flashcard ID and new status
6. **Error Handling**: Handle exceptions and return appropriate error responses
7. **Logging**: Log both successful decisions and failures to audit log

## 6. Security Considerations
- **Authentication & Authorization**: 
  - Ensure request is authenticated via JWT token
  - Users can only accept/reject their own flashcards
- **Ownership Verification**: Check flashcard belongs to authenticated user
- **Source Validation**: Only AI-generated flashcards can be accepted/rejected
- **Status Validation**: Only pending flashcards can be accepted/rejected
- **UUID Validation**: Validate ID parameter is valid UUID format
- **Decision Validation**: Only "accept" or "reject" values allowed

## 7. Error Handling
- **Validation Errors**: Return 400 Bad Request if:
  - ID is not valid UUID format
  - Decision is not "accept" or "reject"
  - Flashcard is not AI-generated (source != 'ai_generated')
  - Flashcard is not pending (status != 'pending')
- **Authentication Errors**: Return 401 Unauthorized if user not authenticated
- **Not Found**: Return 404 Not Found if:
  - Flashcard with given ID doesn't exist
  - Flashcard doesn't belong to authenticated user
  - Flashcard is already deleted
- **Server Errors**: Return 500 Internal Server Error on unexpected failures. Log to audit log.

## 8. Performance Considerations
- **Validation First**: Validate UUID and decision before database operations
- **Single Transaction**: Use single update query with all conditions
- **Atomic Operation**: Accept/reject should be atomic (no partial updates)

## 9. Implementation Steps
1. **Add DTOs to types.ts**: 
   - Define `AcceptRejectFlashcardCommand` interface
   - Define `AcceptRejectFlashcardResponseDTO` interface
2. **Create API Route File**: 
   - Create `/api/flashcards/[id]/decision.ts` file
   - Define POST handler with UUID validation
   - Add request body validation using Zod
3. **Create Service Function**: 
   - Add `acceptRejectFlashcard` function to flashcard service
   - Query flashcard by id AND user_id (ownership check)
   - Validate source is 'ai_generated' and status is 'pending'
   - Update based on decision (accept = set status to 'active', reject = set deleted_at)
4. **Implement Decision Logic**: 
   - If accept: Update status to 'active'
   - If reject: Set deleted_at to current timestamp
   - Return appropriate success message and status
5. **Error Handling & Audit Logging**: 
   - Handle all validation errors (400)
   - Handle not found scenarios (404)
   - Handle database errors (500)
   - Log successful accepts/rejects to audit log
   - Log all errors to audit log
6. **Testing**: 
   - Write unit tests for the service function
   - Test successful accept
   - Test successful reject
   - Test validation errors (wrong source, wrong status, invalid decision)
   - Test not found scenarios
   - Test database errors

## 10. Notes
- **AI-Generated Only**: This endpoint only works with flashcards where `source = 'ai_generated'`
- **Pending Only**: Only flashcards with `status = 'pending'` can be accepted/rejected
- **Idempotency Consideration**: Attempting to accept/reject an already processed flashcard returns 400 (not 404)
- **Audit Trail**: Both successful accepts and rejects are logged, plus all errors
- **No Undo**: Once accepted or rejected, the decision cannot be reversed through this endpoint (would require update endpoint)

