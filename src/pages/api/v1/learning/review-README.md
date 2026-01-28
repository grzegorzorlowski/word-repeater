# POST /api/v1/learning/review

Records a user's review rating for a flashcard, updates its SRS schedule using the FSRS algorithm, logs the review, and returns the updated schedule information.

## Authentication

- **Required**: Yes (user must be authenticated via Supabase session)
- **Returns**: 401 Unauthorized if not authenticated

## Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `flashcardId` | string (UUID) | Yes | The ID of the flashcard being reviewed |
| `rating` | string (enum) | Yes | The review rating - one of: `"again"`, `"hard"`, `"good"`, `"easy"` |

### Rating Values

- `"again"` - Card was forgotten, needs to be reviewed again soon
- `"hard"` - Card was difficult to recall
- `"good"` - Card was recalled correctly (default/typical rating)
- `"easy"` - Card was very easy to recall

## Response

### Success (200 OK)

```json
{
  "reviewed": {
    "flashcardId": "550e8400-e29b-41d4-a716-446655440000",
    "previous_schedule": {
      "next_due": "2025-01-26T10:00:00.000Z",
      "interval_days": 1,
      "repetition_count": 2,
      "ease_factor": 2.5
    },
    "new_schedule": {
      "next_due": "2025-01-28T10:00:00.000Z",
      "interval_days": 2,
      "repetition_count": 3,
      "ease_factor": 2.6
    }
  }
}
```

### Validation Error (400 Bad Request)

```json
{
  "error": "Validation failed",
  "details": {
    "flashcardId": ["flashcardId must be a valid UUID"],
    "rating": ["rating must be one of: \"again\", \"hard\", \"good\", \"easy\""]
  }
}
```

### Not Found (404 Not Found)

```json
{
  "error": "Not Found"
}
```

This occurs when:
- The flashcard schedule doesn't exist
- The flashcard schedule exists but belongs to a different user

### Authentication Error (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```

### Server Error (500 Internal Server Error)

```json
{
  "error": "Internal server error"
}
```

## Logic Flow

1. **Validate Request**
   - Check authentication
   - Validate JSON body
   - Validate `flashcardId` is a valid UUID
   - Validate `rating` is one of the allowed enum values

2. **Fetch Schedule**
   - Query `flashcard_schedule` table by `flashcardId` and `userId`
   - Verify ownership (user_id matches)
   - Return 404 if not found or not owned

3. **Compute New Schedule**
   - Convert current schedule to ts-fsrs Card format
   - Process review using FSRS algorithm with the given rating
   - Calculate new `interval_days`, `ease_factor`, `repetition_count`, and `next_due`

4. **Update Database**
   - Update `flashcard_schedule` row with new values
   - Insert record into `review_logs` table
   - If review log insertion fails, rollback the schedule update

5. **Return Response**
   - Map database results to DTO format
   - Return previous and new schedule for comparison

## SRS Algorithm Details

The endpoint uses the **Free Spaced Repetition Scheduler (FSRS)** algorithm via the `ts-fsrs` library:

- **Request Retention**: 0.9 (90% target recall probability)
- **Maximum Interval**: 36500 days (100 years)
- **Fuzz Enabled**: Yes (adds random delay to prevent cards reviewing on same day)
- **Short-term Scheduling**: Disabled (for MVP)

The algorithm automatically adjusts:
- **Interval**: Days until next review
- **Ease Factor**: Difficulty rating (1-10)
- **Repetition Count**: Number of successful reviews

## Edge Cases Handled

- ✅ Flashcard schedule not found → 404
- ✅ Schedule belongs to different user → 404 (security)
- ✅ Invalid UUID format → 400
- ✅ Invalid rating value → 400
- ✅ Missing required fields → 400
- ✅ Database update failure → 500 with rollback attempt
- ✅ Review log insertion failure → 500 with schedule rollback

## Performance Considerations

- Uses indexed queries on `(user_id, flashcard_id)` for fast schedule lookup
- SRS computation is in-memory (no database round-trips)
- Sequential database operations (update then insert)
- Manual rollback on failure (MVP limitation - consider RPC functions for true transactions in production)

## Security

- **Authentication**: Required via Supabase session
- **Authorization**: Verifies schedule ownership before update
- **Input Validation**: Strict UUID and enum validation via Zod
- **SQL Injection**: Prevented by Supabase query builder
- **Data Isolation**: Row-Level Security (RLS) policies enforce user data separation

## Example Usage

```bash
# Record a "good" rating for a flashcard
curl -X POST "https://api.example.com/api/v1/learning/review" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "flashcardId": "550e8400-e29b-41d4-a716-446655440000",
    "rating": "good"
  }'

# Record an "again" rating (card was forgotten)
curl -X POST "https://api.example.com/api/v1/learning/review" \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-access-token=YOUR_TOKEN" \
  -d '{
    "flashcardId": "550e8400-e29b-41d4-a716-446655440000",
    "rating": "again"
  }'
```

## Related Endpoints

- `GET /api/v1/learning/today` - Fetch flashcards due for review today

## Testing

Unit tests: `src/lib/services/__tests__/learningService.test.ts`
- Tests for successful review recording
- Tests for all rating types (again, hard, good, easy)
- Tests for error cases (not found, database errors, rollback)
- Tests for edge cases (new cards, ownership verification)

Integration tests: `scripts/api-test.http`
- HTTP tests for all scenarios
- Validation error tests
- Authentication tests
