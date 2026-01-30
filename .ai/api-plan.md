# REST API Plan

## 1. Resources

- **Users**: Managed by Supabase Auth, corresponding to the `users` table. Key fields include:
  - `id`: UUID
  - `email`: Must be a valid, unique email (CHECK constraint in DB)
  - `hashed_password`
  - Timestamps: `created_at`, `updated_at`
  - `deleted_at` for soft deletion

- **Flashcards**: Represents flashcards created either via AI or manually. Mapped to the `flashcards` table. Key fields include:
  - `id`: UUID
  - `user_id`: References a user’s `id`
  - `content`: Text field (contains question/answer structure)
  - `metadata`: JSONB for additional details (e.g. tags, categories)
  - Timestamps: `created_at`, `updated_at`
  - `deleted_at` for soft delete

- **Flashcard Schedule**: Tracks per-card SRS state in the `flashcard_schedule` table. Key fields include:
  - `flashcard_id`: UUID, PK, FK → `flashcards(id)`, ON DELETE CASCADE
  - `user_id`: UUID, FK → `users(id)`, ON DELETE CASCADE
  - `next_due`: TIMESTAMPTZ (UTC) — next review date/time
  - `interval_days`: INTEGER — current interval in days
  - `repetition_count`: INTEGER — number of completed reviews (0 = new card)
  - `ease_factor`: DOUBLE PRECISION — ease factor for interval computation

- **Audit Logs**: Captures all logged actions. Mapped to the `audit_logs` table. Key fields include:
  - `id`: UUID
  - `user_id`: References the user (nullable)
  - `action`: Text description of the event
  - `occurred_at`: TIMESTAMPTZ used for partitioning and reporting

## 2. Endpoints

### Flashcards Endpoints

1. **Generate AI Flashcards**
   - **HTTP Method**: POST
   - **URL Path**: `/api/flashcards/generate`
   - **Description**: Processes pasted text (up to 5000 characters), and returns AI-generated flashcard suggestions sequentially.
   - **Request Payload**:
     ```json
     {
       "text": "User input text (max 5000 characters)",
       "limit": 5000
     }
     ```
   - **Response Payload**:
     ```json
     {
       "flashcards": [
         {
           "id": "TEMP_ID_OR_NULL",
           "question": "Generated question",
           "answer": "Generated answer"
         }
       ],
       "message": "Flashcard generated successfully"
     }
     ```
   - **Validation**:
     - `text` length must be ≤5000 characters.
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 422 Unprocessable Entity

2. **List User Flashcards**
   - **HTTP Method**: GET
   - **URL Path**: `/api/flashcards`
   - **Description**: Retrieves a paginated list of flashcards for the authenticated user.
   - **Query Parameters**:
     - `page` (page number)
     - `limit` (items per page)
     - `source` (values: "ai" or "manual")
     - `status` (e.g., "active" / "deleted")
   - **Response Payload**:
     ```json
     {
       "data": [ /* array of flashcards */ ],
       "page": 1,
       "limit": 10,
       "total": 50
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**: 401 Unauthorized

3. **Create Manual Flashcard**
   - **HTTP Method**: POST
   - **URL Path**: `/api/flashcards`
   - **Description**: Creates a new flashcard manually.
   - **Request Payload**:
     ```json
     {
       "question": "What is REST?",
       "answer": "Representational State Transfer",
       "metadata": { "tags": ["tech"] }
     }
     ```
   - **Validation**:
     - `question`: non-empty string, max length 300
     - `answer`: non-empty string, max length 500
   - **Response Payload**:
     ```json
     {
       "message": "Flashcard created successfully",
       "flashcard": {/* new flashcard object */}
     }
     ```
   - **Success Codes**: 201 Created
   - **Error Codes**: 400 Bad Request, 401 Unauthorized

4. **Update Flashcard**
   - **HTTP Method**: PUT
   - **URL Path**: `/api/flashcards/{id}`
   - **Description**: Updates existing flashcard content.
   - **Request Payload**:
     ```json
     {
       "question": "Updated question",
       "answer": "Updated answer"
     }
     ```
   - **Validation**: both fields non-empty
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

5. **Delete Flashcard**
   - **HTTP Method**: DELETE
   - **URL Path**: `/api/flashcards/{id}`
   - **Description**: Soft deletes a flashcard.
   - **Success Codes**: 200 OK
   - **Error Codes**: 401 Unauthorized, 404 Not Found

6. **Accept/Reject AI Flashcard**
   - **HTTP Method**: POST
   - **URL Path**: `/api/flashcards/{tempId}/decision`
   - **Description**: Handles user decision on an AI-generated flashcard.
   - **Request Payload**:
     ```json
     { "decision": "accept" /* or "reject" */ }
     ```
   - **Business Logic**:
     - If `accept`: persist flashcard and initialize schedule.
     - If `reject`: discard the suggestion.
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 401 Unauthorized

### Learning Endpoints (SRS)

1. **Fetch Today's Cards** ✅ IMPLEMENTED
   - **HTTP Method**: GET
   - **URL Path**: `/api/v1/learning/today`
   - **Description**: Returns all due cards (where `next_due` ≤ now) ordered by `next_due`, then up to `limit` new cards (where `repetition_count = 0`). Enforces a daily cap of 50 new cards per user (UTC timezone).
   - **Query Parameters**:
     - `limit` (integer, optional, default: 50, range: 1-50)
   - **Request Example**:
     ```http
     GET /api/v1/learning/today?limit=10
     Cookie: sb-access-token=YOUR_SESSION_TOKEN
     ```
   - **Response Payload (Success - 200 OK)**:
     ```json
     {
       "cards": [
         {
           "flashcardId": "550e8400-e29b-41d4-a716-446655440000",
           "question": "What is the capital of France?",
           "answer": "Paris",
           "schedule": {
             "next_due": "2025-01-26T10:00:00.000Z",
             "interval_days": 1,
             "repetition_count": 2,
             "ease_factor": 2.5
           }
         }
       ],
       "count": 1
     }
     ```
   - **Response Payload (Empty - 200 OK)**:
     ```json
     {
       "cards": [],
       "count": 0
     }
     ```
   - **Response Payload (Validation Error - 422)**:
     ```json
     {
       "error": "Invalid query parameter: limit",
       "details": [
         {
           "field": "limit",
           "message": "Number must be greater than or equal to 1"
         }
       ]
     }
     ```
   - **Response Payload (Unauthorized - 401)**:
     ```json
     {
       "error": "Unauthorized"
     }
     ```
   - **Validation Rules**:
     - `limit` must be integer between 1-50 (inclusive)
     - `limit` = 0 or negative → 422 Unprocessable Entity
     - `limit` > 50 → 422 Unprocessable Entity
     - Missing `limit` → defaults to 50
   - **Business Logic**:
     1. Fetch due cards (next_due ≤ now), limited by `limit` parameter
     2. If due cards ≥ limit, return early (optimization)
     3. Check how many new cards taken today (count cards with repetition_count=1 reviewed since UTC midnight)
     4. Calculate remaining new cards: `Min(50 - takenToday, limit - dueCount)`
     5. Fetch new cards (repetition_count=0) up to calculated limit
     6. Merge and return (due cards + new cards)
   - **Performance**:
     - Average: 30-115ms (4 database queries)
     - Best case: 10-50ms (1 query, early return)
     - Uses indexed queries on `(user_id, next_due)`
   - **Success Codes**: 200 OK
   - **Error Codes**: 
     - 401 Unauthorized (no session)
     - 422 Unprocessable Entity (invalid limit)
     - 500 Internal Server Error (database error)
   - **Testing Examples**:
     ```bash
     # Get default (50 cards)
     curl -X GET "http://localhost:4321/api/v1/learning/today" \
       -H "Cookie: YOUR_SESSION_COOKIE"
     
     # Get 10 cards
     curl -X GET "http://localhost:4321/api/v1/learning/today?limit=10" \
       -H "Cookie: YOUR_SESSION_COOKIE"
     
     # Get 1 card (minimum)
     curl -X GET "http://localhost:4321/api/v1/learning/today?limit=1" \
       -H "Cookie: YOUR_SESSION_COOKIE"
     
     # Test validation error (limit=0)
     curl -X GET "http://localhost:4321/api/v1/learning/today?limit=0" \
       -H "Cookie: YOUR_SESSION_COOKIE"
     
     # Test validation error (limit>50)
     curl -X GET "http://localhost:4321/api/v1/learning/today?limit=100" \
       -H "Cookie: YOUR_SESSION_COOKIE"
     
     # Test unauthorized
     curl -X GET "http://localhost:4321/api/v1/learning/today"
     ```
   - **Implementation Notes**:
     - ✅ Soft-deleted flashcards excluded
     - ✅ Daily new card limit enforced (50/day, UTC)
     - ✅ Duplicate prevention (cards don't appear twice)
     - ✅ Malformed JSON content handled gracefully
     - ✅ 15 unit tests, all passing
     - 📄 Full documentation: `src/pages/api/v1/learning/README.md`
     - 📄 Performance analysis: `Docs/learn-today-endpoint-performance-analysis.md`

2. **Record a Review Rating**
   - **HTTP Method**: POST
   - **URL Path**: `/api/v1/learning/review`
   - **Description**: Records a single review rating, updates the SRS schedule, and returns the updated entry
   - **Request Payload**:
     ```json
     {
       "flashcardId": "UUID",
       "rating": "again" /* "hard", "good", or "easy" */
     }
     ```
   - **Response Payload**:
     ```json
     {
       "reviewed": {
         "flashcardId": "UUID",
         "previous_schedule": { /* before update */ },
         "new_schedule": { /* after update */ }
       }
     }
     ```
   - **Validation**:
     - `flashcardId` must exist and belong to user.
     - `rating` must be one of [`again`,`hard`,`good`,`easy`].
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found, 422 Unprocessable Entity

## 3. Authentication and Authorization

- **Mechanism**: Cookie-based session authentication using Supabase Auth with SSR.
  - HttpOnly, Secure, SameSite=Lax cookies.
  - Middleware enforces session via `supabase.auth.getUser()` and attaches `locals.user`.
  - All endpoints scoped to `user_id` via RLS policies (matching `flashcards` and `flashcard_schedule`).
   **Cookie Configuration**:
  - `HttpOnly: true` - Prevents XSS attacks
  - `Secure: true` - Requires HTTPS (except localhost)
  - `SameSite: lax` - Protects against CSRF attacks
  - `Path: /` - Available for all routes

- **Learning Endpoints Security**:
  - RLS policy: `flashcard_schedule.user_id = current_setting('app.current_user_id')::uuid`.
  - Both `/api/v1/learning/today` and `/api/v1/learning/review` require authenticated user.

- **Rate Limiting**:
  - Apply rate limiting on heavy operations (e.g., `/api/flashcards/generate`, `/api/v1/learning/review`).

## 4. Validation and Business Logic

- **Validation Conditions (Schema)**:
  - `email`: valid regex, unique.
  - `text` length ≤ 5000 for AI generation.
  - `question`: non-empty, max 300 characters.
  - `answer`: non-empty, max 500 characters.
  - `limit` (learning): integer, 1 ≤ limit ≤ 50.
  - `rating`: enum [`again`,`hard`,`good`,`easy`].
  - `flashcardId`: valid UUID belonging to user.

- **Business Logic Implementation**:
  1. **Flashcard Generation & Decision**:
     - `/generate` enforces char limit.
     - `/decision` persists or discards suggestions, initializes schedule via `initializeSchedule()`.
  2. **Learning Session**:
     - `GET /today`: uses `getDueCards()` to fetch all due cards and then up to `limit` new cards per call; enforces cap only on new cards.
     - `POST /review`: uses `processReview()` to compute `next_due`, `interval_days`, `ease_factor`, updates `flashcard_schedule`, returns updated record and next card.
  3. **Session Summary**:
     - Client infers session end when `nextCard` is `null`, then displays counts and duration.

- **Indexes & Performance**:
  - Index on `(user_id, next_due)` for efficient due-card queries.
  - Queries performed in UTC zone.

- **Assumptions**:
  - New card pool defined by `repetition_count = 0`.
  - No per-user SRS settings in MVP; global defaults used.
  - All scheduling logic encapsulated in `src/lib/srsService.ts`.
