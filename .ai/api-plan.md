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
   - **Validation**: 
    - `question` must be non-empty string and maximum length should 300 
    - `answer` must be non-empty string and maximum length should 500 
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


## 3. Authentication and Authorization

- **Mechanism**: Cookie-based session authentication using Supabase Auth with SSR.
  - Session tokens are managed via secure HttpOnly cookies (`sb-access-token`, `sb-refresh-token`).
  - Cookies are automatically set upon successful login via `POST /api/auth/login`.
  - Cookies are automatically sent with subsequent requests by the browser/client.
  - No manual Authorization header is required - authentication is handled via cookies.
  
- **Authentication Flow**:
  1. User logs in via `POST /api/auth/login` with email/password
  2. Supabase Auth validates credentials and creates a session
  3. Session tokens are stored in HttpOnly cookies (Set-Cookie headers)
  4. Subsequent requests automatically include these cookies
  5. Middleware validates the session on each request using `supabase.auth.getUser()`
  
- **Cookie Configuration**:
  - `HttpOnly: true` - Prevents XSS attacks
  - `Secure: true` - Requires HTTPS (except localhost)
  - `SameSite: lax` - Protects against CSRF attacks
  - `Path: /` - Available for all routes

- **Authorization**:
  - Middleware validates session cookies and attaches user context to `locals.user`.
  - All flashcard operations are scoped to the authenticated user's ID.
  - Unauthenticated API requests return 401 JSON responses.
  - Unauthenticated page requests redirect to `/login`.

- **Security Measures**:
  - Token validation with Supabase Auth server on every request (using `getUser()`).
  - Automatic token refresh handled by Supabase SSR.
  - All endpoints should be served over HTTPS in production.
  - Rate limiting should be applied especially on endpoints such as flashcard generation to mitigate abuse.
  - Standard error handling is enforced to avoid disclosure of internal details.

- **Testing with HTTP Clients**:
  - **Browser**: Cookies are handled automatically ✅
  - **REST Client (VS Code)**: Should handle cookies automatically, but may require settings adjustment
  - **Postman**: Cookies are handled automatically when "Automatically follow redirects" is enabled
  - **cURL**: Use `-c cookies.txt` to save cookies and `-b cookies.txt` to send them
  
  **If REST Client doesn't send cookies**: Check that "Rest-client: Follow Redirect" is enabled in VS Code settings.

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
  