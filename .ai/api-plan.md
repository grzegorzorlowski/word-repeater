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

- **Audit Logs**: Captures all logged actions. Mapped to the `audit_logs` table with fields:
  - `id`: UUID
  - `user_id`: References the user (nullable)
  - `action`: Text description of the event
  - `occurred_at`: TIMESTAMPTZ used for partitioning and reporting

## 2. Endpoints

### Users Endpoints

1. **Register New User**
   - **HTTP Method**: POST
   - **URL Path**: `/api/users/register`
   - **Description**: Creates a new user account.
   - **Request Payload**:
     ```json
     {
       "email": "user@example.com",
       "password": "StrongPassword123!",
       "acceptTerms": true
     }
     ```
   - **Response Payload**:
     ```json
     {
       "message": "Registration successful",
       "user": {
         "id": "UUID",
         "email": "user@example.com",
         "created_at": "ISO8601"
       }
     }
     ```
   - **Query Parameters**: None
   - **Success Codes**: 201 Created
   - **Error Codes**: 400 Bad Request, 409 Conflict (if email already exists)
   - **Validation**: 
     - Email format (CHECK constraint) and uniqueness enforced by DB.
     - Password requirements must be applied.
     - `acceptTerms` must be true.

2. **User Login**
   - **HTTP Method**: POST
   - **URL Path**: `/api/users/login`
   - **Description**: Authenticates the user and returns a JWT token.
   - **Request Payload**:
     ```json
     {
       "email": "user@example.com",
       "password": "StrongPassword123!"
     }
     ```
   - **Response Payload**:
     ```json
     {
       "token": "JWT_TOKEN",
       "user": {
         "id": "UUID",
         "email": "user@example.com"
       }
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 401 Unauthorized

3. **Password Reset**
   - **HTTP Method**: POST
   - **URL Path**: `/api/users/reset-password`
   - **Description**: Initiates the password reset process.
   - **Request Payload**:
     ```json
     {
       "email": "user@example.com"
     }
     ```
   - **Response Payload**:
     ```json
     {
       "message": "Password reset email sent"
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 404 Not Found

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
     - Text length must be ≤5000 characters. 
     - In case of excess, the client may choose to truncate or cancel.
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 422 Unprocessable Entity

2. **List User Flashcards**
   - **HTTP Method**: GET
   - **URL Path**: `/api/flashcards`
   - **Description**: Retrieves a paginated list of flashcards for the authenticated user.
   - **Query Parameters**:
     - `page` (e.g., page number)
     - `limit` (e.g., items per page)
     - `source` (values: "ai" or "manual")
     - `status` (e.g., active/deleted)
   - **Response Payload**:
     ```json
     {
       "data": [
         {
           "id": "UUID",
           "content": "Flashcard content",
           "created_at": "ISO8601"
         }
       ],
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
   - **Response Payload**:
     ```json
     {
       "message": "Flashcard created successfully",
       "flashcard": {
         "id": "UUID",
         "content": "...",
         "created_at": "ISO8601"
       }
     }
     ```
   - **Validation**: Both `question` and `answer` must be non-empty strings.
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
   - **Response Payload**:
     ```json
     {
       "message": "Flashcard updated successfully"
     }
     ```
   - **Validation**: Validate that both fields are non-empty. Updates should preserve repetition history unless a critical change is detected.
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 401 Unauthorized, 404 Not Found

5. **Delete Flashcard**
   - **HTTP Method**: DELETE
   - **URL Path**: `/api/flashcards/{id}`
   - **Description**: Soft deletes a flashcard. Client is expected to have performed a confirmation step.
   - **Response Payload**:
     ```json
     {
       "message": "Flashcard deleted successfully"
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**: 401 Unauthorized, 404 Not Found

6. **Accept/Reject AI Flashcard**
   - **HTTP Method**: POST
   - **URL Path**: `/api/flashcards/{tempId}/decision`
   - **Description**: Processes user decision on an AI-generated flashcard in a one-at-a-time flow.
   - **Request Payload**:
     ```json
     {
       "decision": "accept"  // or "reject"
     }
     ```
   - **Response Payload**:
     ```json
     {
       "message": "Flashcard accepted and saved"
     }
     ```
   - **Business Logic**: 
     - If accepted: persist flashcard and schedule for review.
     - If rejected: discard the suggestion.
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 401 Unauthorized

### Learning Session Endpoints

1. **Start Learning Session**
   - **HTTP Method**: POST
   - **URL Path**: `/api/learning/start`
   - **Description**: Initiates a learning session by retrieving flashcards scheduled for review today. The order can be randomized or determined by the repetition algorithm.
   - **Response Payload**:
     ```json
     {
       "sessionId": "UUID",
       "flashcards": [
         {
           "id": "UUID",
           "content": "Flashcard question text",
           "metadata": {}
         }
       ]
     }
     ```
   - **Success Codes**: 200 OK
   - **Error Codes**: 401 Unauthorized, 404 Not Found

2. **Submit Learning Result**
   - **HTTP Method**: POST
   - **URL Path**: `/api/learning/{sessionId}/result`
   - **Description**: Submits the outcome for a flashcard during a learning session. The result (“remembered” or “dont_remember”) is used to update the next review date via the repetition algorithm.
   - **Request Payload**:
     ```json
     {
       "flashcardId": "UUID",
       "result": "remembered"  // or "dont_remember"
     }
     ```
   - **Response Payload**:
     ```json
     {
       "message": "Learning result recorded successfully"
     }
     ```
   - **Business Logic**: Applies an abstraction layer for the repetition algorithm to schedule the next review date.
   - **Success Codes**: 200 OK
   - **Error Codes**: 400 Bad Request, 401 Unauthorized

### Audit Logs Endpoints (Admin Only)

1. **List Audit Logs**
   - **HTTP Method**: GET
   - **URL Path**: `/api/audit-logs`
   - **Description**: Retrieves audit logs with support for filtering by user and date range.
   - **Query Parameters**:
     - `user_id`
     - `start_date`
     - `end_date`
     - `page`
     - `limit`
   - **Response Payload**:
     ```json
     {
       "data": [
         {
           "id": "UUID",
           "user_id": "UUID",
           "action": "Action description",
           "occurred_at": "ISO8601"
         }
       ],
       "page": 1,
       "limit": 10,
       "total": 100
     }
     ```
   - **Security**: Accessible only to users with administrative privileges.
   - **Success Codes**: 200 OK
   - **Error Codes**: 401 Unauthorized, 403 Forbidden

## 3. Authentication and Authorization

- **Mechanism**: JWT-based authentication.
  - A JWT token is issued upon a successful login.
  - The token must be included in the `Authorization` header (e.g., `Bearer JWT_TOKEN`) for all protected endpoints.
- **Authorization**:
  - Middleware will validate JWT tokens and attach the respective user context.
  - Additional role-based checks are implemented for administrative endpoints (e.g., audit logs).
- **Security Measures**:
  - All endpoints should be served over HTTPS.
  - Rate limiting should be applied especially on endpoints such as flashcard generation to mitigate abuse.
  - Standard error handling is enforced to avoid disclosure of internal details.

## 4. Validation and Business Logic

- **Validation Conditions (from Schema)**:
  - **Email**: Must validate against a regex and be unique.
  - **Text Length**: For AI flashcard generation, input text must not exceed 5000 characters.
  - **Non-empty Fields**: For manual flashcards, both `question` and `answer` fields must be non-empty.

- **Business Logic (from PRD Requirements)**:
  1. **Flashcard Generation**:
     - Endpoint `/api/flashcards/generate` implements character limit validation and returns suggestions in a sequential, one-at-a-time flow (RF-001 to RF-007).
     - Endpoint `/api/flashcards/{tempId}/decision` manages acceptance and rejection; rejected flashcards cannot be restored.
  2. **Manual Flashcard Management**:
     - Endpoints for creation, updating, and deletion are designed to handle manual input with validations ensuring non-empty content (RF-009 to RF-012).
  3. **Learning Sessions**:
     - Endpoints `/api/learning/start` and `/api/learning/{sessionId}/result` facilitate a review session where flashcards are presented based on a scheduled review algorithm (RF-013 to RF-016).
  4. **Account Management**:
     - Endpoints for user registration, login, and password reset ensure proper input validations and secure session management (RF-017 to RF-019).
  5. **Audit Trail**:
     - The audit logs endpoint records critical actions initiated by users to support internal analytics and monitoring (RF-024, RF-025).

- **Additional Considerations**:
  - **Pagination, Filtering, and Sorting**: Implemented in list endpoints to manage large data sets.
  - **Rate Limiting**: Enforced to protect endpoints against abuse.
  - **Error Handling**: Consistent error messages with appropriate HTTP status codes, particularly for generation errors related to network or model limitations.

*Assumptions*: Some detailed behaviors (such as the specific internal handling of flashcard generation errors or the scheduling logic calculation) are encapsulated within service layers separate from the API layer.
