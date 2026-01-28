# Learning API Endpoints

This directory contains API endpoints for the Spaced Repetition System (SRS) learning functionality.

## Endpoints

### GET `/api/v1/learning/today`

Retrieves flashcards due for review today plus new cards for learning.

#### Authentication
- **Required**: Yes (user must be authenticated via Supabase session)
- **Returns**: 401 Unauthorized if not authenticated

#### Query Parameters

| Parameter | Type | Required | Default | Range | Description |
|-----------|------|----------|---------|-------|-------------|
| `limit` | integer | No | 50 | 1-50 | Maximum total number of cards to return |

#### Response

**Success (200 OK)**
```json
{
  "cards": [
    {
      "flashcardId": "uuid",
      "question": "What is the capital of France?",
      "answer": "Paris",
      "schedule": {
        "next_due": "2025-01-26T10:00:00Z",
        "interval_days": 1,
        "repetition_count": 2,
        "ease_factor": 2.5
      }
    }
  ],
  "count": 25
}
```

**Validation Error (422 Unprocessable Entity)**
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

**Authentication Error (401 Unauthorized)**
```json
{
  "error": "Unauthorized"
}
```

**Server Error (500 Internal Server Error)**
```json
{
  "error": "Failed to fetch today's cards"
}
```

#### Logic

1. **Fetches due cards** (where `next_due ≤ now`)
   - Ordered by `next_due` ascending
   - Limited by `limit` parameter
   
2. **If due cards fill the limit**, returns early
   
3. **Otherwise, checks daily new card limit**
   - Maximum 50 new cards per day (UTC timezone)
   - Counts cards where `repetition_count` changed from 0 to 1 today
   
4. **Fetches new cards** (where `repetition_count = 0`)
   - Up to `Min(50 - alreadyTakenToday, limit - dueCardsCount)`
   - Excludes duplicates (cards already in due list)
   
5. **Returns merged list**
   - Due cards first, then new cards
   - Total count never exceeds `limit` parameter

#### Edge Cases Handled

- ✅ Soft-deleted flashcards are excluded
- ✅ Daily limit of 50 new cards enforced
- ✅ No duplicate cards in response
- ✅ Malformed content returns empty question/answer
- ✅ User with no flashcards returns empty array

#### Performance Considerations

- Uses database indexes on `(user_id, next_due)` for due cards
- Uses partial index on `(user_id) WHERE repetition_count = 0` for new cards
- Separate queries to avoid full table scans
- Early return optimization when limit is reached

#### Example Usage

```bash
# Get default (50 cards)
curl -X GET "https://api.example.com/api/v1/learning/today" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get specific number of cards
curl -X GET "https://api.example.com/api/v1/learning/today?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Related Endpoints

- `POST /api/v1/learning/review` - Record a review for a flashcard (to be implemented)

## Security

All endpoints require:
- Valid Supabase authentication session
- Row-Level Security (RLS) policies enforce user data isolation
- Input validation via Zod schemas
- Parameterized queries prevent SQL injection

## Testing

Unit tests: `src/lib/services/__tests__/learningService.test.ts`
- 15 test cases covering all scenarios
- 100% coverage of main logic paths
