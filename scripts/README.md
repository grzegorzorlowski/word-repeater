# API Testing Scripts

This folder contains HTTP files for testing the Word Repeater API endpoints.

## Files

- **`api-test.http`**: Complete collection of HTTP requests for testing all API endpoints

## Usage

### Option 1: VS Code REST Client Extension

1. Install the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension for VS Code
2. Open `api-test.http`
3. Click "Send Request" above any request
4. View the response in a new panel

### Option 2: IntelliJ IDEA / WebStorm

1. Open `api-test.http`
2. Click the play icon (▶) next to any request
3. View the response in the Run tool window

### Option 3: cURL (convert from HTTP file)

You can convert any request to cURL format. Example:

```bash
curl -X POST http://localhost:4321/api/flashcards/generate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your text here...",
    "limit": 3
  }'
```

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Ensure Supabase is running** (if using local Supabase):
   ```bash
   cd supabase
   supabase start
   ```

## Available Endpoints

### 1. Generate AI Flashcards
- **POST** `/api/flashcards/generate`
- Generates flashcards from text using AI
- Text must be 500-5000 characters
- Creates flashcards with `source: "ai_generated"` and `status: "pending"`

### 2. List User Flashcards
- **GET** `/api/flashcards`
- Lists flashcards with pagination and filtering
- Query parameters: `page`, `limit`, `source`, `status`

### 3. Create Manual Flashcard
- **POST** `/api/flashcards`
- Creates a manual flashcard
- Creates flashcards with `source: "manual"` and `status: "active"`

### 4. Update Flashcard
- **PUT** `/api/flashcards/{id}`
- Updates question and/or answer of a flashcard
- Only owner can update their flashcards

### 5. Accept/Reject AI Flashcard
- **POST** `/api/flashcards/{id}/decision`
- Accept: Changes status from `pending` to `active`
- Reject: Soft deletes the flashcard (sets `deleted_at`)
- Only works with AI-generated pending flashcards

### 6. Delete Flashcard
- **DELETE** `/api/flashcards/{id}`
- Soft deletes a flashcard
- Only owner can delete their flashcards

## Workflow Examples

### Workflow 1: AI Flashcard Generation and Review

1. Generate AI flashcards:
   ```http
   POST /api/flashcards/generate
   ```

2. List pending flashcards:
   ```http
   GET /api/flashcards?source=ai_generated&status=pending
   ```

3. Accept or reject each flashcard:
   ```http
   POST /api/flashcards/{id}/decision
   { "decision": "accept" }
   ```

### Workflow 2: Manual Flashcard Management

1. Create a flashcard:
   ```http
   POST /api/flashcards
   ```

2. Update it:
   ```http
   PUT /api/flashcards/{id}
   ```

3. Delete it:
   ```http
   DELETE /api/flashcards/{id}
   ```

## Variables

Update these variables in `api-test.http`:

- `@baseUrl`: API base URL (default: `http://localhost:4321`)
- `@flashcardId`: Replace with actual flashcard ID for testing

## Response Codes

- **200**: Success
- **400**: Bad Request (validation errors)
- **404**: Not Found
- **500**: Internal Server Error

## Tips

1. **Get flashcard IDs**: Run list requests first to get IDs for update/delete operations
2. **Test in order**: Create flashcards before trying to update/delete them
3. **Check responses**: Look for `flashcard_id` in responses to use in subsequent requests
4. **Validation testing**: Included examples for testing validation errors
5. **Pagination**: Adjust `page` and `limit` parameters as needed

## Troubleshooting

- **Connection refused**: Make sure the dev server is running (`npm run dev`)
- **404 errors**: Check that the flashcard ID exists and belongs to the test user
- **Validation errors**: Review request body against the schema requirements
- **500 errors**: Check server logs for detailed error messages

