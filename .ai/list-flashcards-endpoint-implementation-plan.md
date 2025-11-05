# API Endpoint Implementation Plan: List User Flashcards

## 1. Endpoint Overview
This endpoint retrieves a paginated list of flashcards for the authenticated user. It supports optional filtering by source (AI-generated or manual) and status (active or pending), and returns flashcard summaries with pagination metadata. Soft-deleted flashcards are always excluded from results.

## 2. Request Details
- **HTTP Method**: GET
- **URL Structure**: `/api/flashcards`
- **Parameters**:
  - **Query Parameters**:
    - `page` (number, optional, default: 1): Page number for pagination
    - `limit` (number, optional, default: 10): Number of items per page (max: 100)
    - `source` (string, optional): Filter by source ("ai_generated" or "manual")
    - `status` (string, optional): Filter by status ("active" or "pending")

## 3. Used Types
- **DTO for Response**: `ListUserFlashcardsResponseDTO` (defined in `src/types.ts`)
- **DTO for Flashcard Summary**: `FlashcardSummaryDTO` (defined in `src/types.ts`)

## 4. Response Details
- **Success Response**: 
  - **Status Code**: 200 OK
  - **Body Structure**:
    ```json
    {
      "data": [
        {
          "id": "UUID",
          "content": "Flashcard content (JSON stringified question/answer)",
          "created_at": "ISO8601 timestamp"
        }
      ],
      "page": 1,
      "limit": 10,
      "total": 50
    }
    ```
- **Error Responses**:
  - **400 Bad Request**: For invalid query parameters (e.g., negative page, limit too large).
  - **401 Unauthorized**: If user authentication fails.
  - **500 Internal Server Error**: For unforeseen server-side errors.

## 5. Data Flow
1. **Entry Point**: The request hits the Astro API endpoint (`/api/flashcards`).
2. **Authentication**: Middleware validates the JWT token. The authenticated user context is passed via the request (e.g., `context.locals.supabase`).
3. **Query Parameter Validation**: 
   - Validate and parse query parameters (page, limit, source, status).
   - Apply defaults for missing parameters (page=1, limit=10).
   - Ensure page >= 1, limit between 1 and 100.
   - Validate source is either "ai_generated" or "manual" if provided.
   - Validate status is either "active" or "pending" if provided.
4. **Business Logic & Data Retrieval**: 
   - Pass validated parameters to a dedicated flashcard list service.
   - Service builds database query with filters and pagination.
   - Query ALWAYS excludes soft-deleted flashcards (deleted_at IS NULL).
   - Query includes:
     - Filter by user_id (from authenticated user)
     - Always filter: deleted_at IS NULL (soft-deleted flashcards are never returned)
     - Filter by source column if source parameter provided
     - Filter by status column if status parameter provided
     - Apply pagination (offset and limit)
     - Get total count for pagination metadata
5. **Response Composition**: 
   - Format the response using `ListUserFlashcardsResponseDTO`.
   - Include the flashcard data array, current page, limit, and total count.
6. **Error Handling**: Handle any exceptions from the service and return appropriate error responses.

## 6. Security Considerations
- **Authentication & Authorization**: 
  - Ensure that the request is authenticated via a JWT token.
  - Users can only see their own flashcards (filter by authenticated user_id).
- **Input Validation**: 
  - Validate all query parameters to prevent injection attacks.
  - Limit maximum page size to prevent resource exhaustion.
- **Data Exposure**: 
  - Only return necessary flashcard summary fields (id, content, created_at).
  - Don't expose internal metadata unless necessary.

## 7. Error Handling
- **Validation Errors**: Return 400 Bad Request if:
  - Page number is less than 1.
  - Limit is less than 1 or greater than 100.
  - Source or status values are invalid.
- **Authentication Errors**: Return 401 Unauthorized if the user is not authenticated.
- **Server Errors**: Return 500 Internal Server Error on unexpected failures. Log these errors in an audit log.

## 8. Performance Considerations
- **Database Optimization**: 
  - Use indexed fields for filtering (user_id, deleted_at).
  - Limit query results to prevent large data transfers.
- **Caching**: 
  - Consider caching frequently accessed pages for better performance.
- **Pagination**: 
  - Use offset-based pagination for simplicity.
  - Calculate total count efficiently (consider caching if expensive).

## 9. Implementation Steps
1. **Endpoint Setup**: 
   - Create a new API route file for `/api/flashcards` with GET handler (e.g., `src/pages/api/flashcards/index.ts`).
2. **Query Parameter Validation**: 
   - Use `zod` for query parameter validation.
   - Parse and validate page, limit, source, and status parameters.
   - Apply default values and constraints.
   - Return a 400 error if validation fails.
3. **Invoke Business Logic**: 
   - Extract the flashcard listing logic into a dedicated service (e.g., `src/lib/services/flashcardService.ts` - add new function).
   - Pass validated parameters and authenticated user ID to the service.
4. **Database Query**: 
   - Build query with filters for user_id and deleted_at (always IS NULL).
   - Apply optional filters for source column and status column if provided.
   - Apply pagination with offset and limit.
   - Execute query to get flashcards and total count.
5. **Error Handling**: 
   - Handle any exceptions from the service.
   - Return appropriate error responses with status codes.
6. **Response Assembly**: 
   - Format the response using `ListUserFlashcardsResponseDTO`.
   - Return a 200 status with the flashcard list and pagination metadata.
7. **Testing**: 
   - Write unit tests covering successful retrieval, pagination, filtering, and error scenarios.
   - Test edge cases (empty results, invalid parameters, large page numbers).

## 10. Notes
- **Soft-Deleted Exclusion**: Soft-deleted flashcards (deleted_at IS NOT NULL) are ALWAYS excluded from all queries. There is no way to retrieve deleted flashcards through this endpoint.
- **Source Filtering**: The source filter checks the `source` column which is set to "ai_generated" for AI flashcards and "manual" for manual ones.
- **Status Filtering**: The status filter checks the `status` column ("active" or "pending"). If not provided, returns all flashcards regardless of status.
- **Independent Filters**: Source and status filters are independent and optional. Each only restricts results when explicitly provided.
- **Default Behavior**: Without any filters, returns ALL non-deleted flashcards (both active and pending, both AI-generated and manual).

