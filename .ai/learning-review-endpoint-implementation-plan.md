# API Endpoint Implementation Plan: Record Review Rating

## 1. Endpoint Overview
This endpoint records a user’s review rating for a flashcard, updates its SRS schedule, logs the review, and returns both the updated schedule for the reviewed card and the next due card.

## 2. Request Details
- HTTP Method: POST  
- URL Path: `/api/v1/learning/review`  
- Parameters:  
  - Required (in JSON body):  
    - `flashcardId` (string, UUID)  
    - `rating` (string enum: `"again"` | `"hard"` | `"good"` | `"easy"`)

- Validation Schema (Zod):  
```typescript
const RecordReviewRatingSchema = z.object({
  flashcardId: z.string().uuid(),
  rating: z.enum(["again", "hard", "good", "easy"]),
});
```  
- Authentication: require a valid session; extract `userId` from `context.locals.session.user.id`.

## 3. Used Types
- Input DTO: `RecordReviewRatingRequestDTO`  
- Command Model: `RecordReviewRatingCommand` (augment DTO with `userId`)  
- Service Input: `RecordReviewRatingInput = { userId: string } & RecordReviewRatingRequestDTO`  
- Output DTOs:  
  - `ReviewScheduleChangeDTO`  
  - `RecordReviewResponseDTO`  

## 4. Response Details
- Success (200 OK) with JSON body:  
```json
{
  "reviewed": {
    "flashcardId": "UUID",
    "previous_schedule": { /* next_due, interval_days, repetition_count, ease_factor */ },
    "new_schedule": { /* same shape */ }
  },
  "nextCard": {
    "flashcardId": "UUID",
    "previous_schedule": { /* ... */ },
    "new_schedule": { /* ... */ }
  } | null
}
```
- Error responses:  
  - 400 Bad Request: validation errors  
  - 401 Unauthorized: missing or invalid session  
  - 404 Not Found: flashcard schedule not found or not owned by user  
  - 422 Unprocessable Entity: business rule violation (e.g., reviewing too early)  
  - 500 Internal Server Error: unexpected errors

## 5. Data Flow
1. **Route Handler** (`src/pages/api/v1/learning/review.ts`)  
   - Validate JSON body via Zod schema.  
   - Ensure authenticated session → extract `userId`.  
   - Call service: `learningService.recordReviewRating({ userId, flashcardId, rating })`.

2. **Service** (`src/lib/services/learningService.ts`)  
   - Start a Supabase transaction.  
   - Fetch existing `flashcard_schedule` by `flashcardId` & `userId`.  
     - If not found → throw `NotFoundError`.  
   - Compute new schedule using SRS algorithm (update `interval_days`, `ease_factor`, `repetition_count`, recalc `next_due`).  
   - Update `flashcard_schedule` row.  
   - Insert into `review_logs` with `{ user_id, flashcard_id, rating }`.  
   - Map both schedule records to `ReviewScheduleChangeDTO` (previous vs. new for reviewed; for nextCard, previous=new of that record).
   
3. **Response**: service returns `RecordReviewResponseDTO` → route handler sends 200.

## 6. Security Considerations
- **Authentication**: require valid session; reject 401 otherwise.  
- **Authorization**: verify schedule’s `user_id` matches session `userId`; reject 404 if mismatched.  
- **Input Validation**: strict UUID and enum checks via Zod.  
- **SQL Injection**: Supabase query builder prevents injection.  
- **Rate Limiting**: consider global or per-user rate-limiter to prevent abuse.  
- **Race Conditions**: wrap schedule update + log insert in a DB transaction.

## 7. Error Handling
| Error Condition                            | Status Code | Handling                                             |
|---------------------------------------------|-------------|------------------------------------------------------|
| Invalid JSON or schema validation fails     | 400         | Return `ErrorResponseDTO` with field errors          |
| No session/auth missing                     | 401         | Return `{ error: "Unauthorized" }`                 |
| Schedule not found or not owned             | 404         | Return `{ error: "Not Found" }`                    |
| Business rule violation (e.g., too early)   | 422         | Return `{ error: "Unprocessable Entity" }`         |
| Unexpected DB or server error               | 500         | Log error and return `{ error: "Internal Error" }` |

## 8. Performance Considerations
- Use a single transaction to reduce round trips.  
- Index on `(user_id, next_due)` ensures quick next-card lookup.  
- Ensure SRS computation is in-memory.  
- Paginate if expanding to batch reviews in future.

## 9. Implementation Steps
1. **Create Route File**: `src/pages/api/v1/learning/review.ts`.  
2. **Define Zod Schema**: for request validation.  
3. **Extend `learningService`**: add method `recordReviewRating(input)`.  
4. **Implement SRS Algorithm**: factor in `rating` weight to compute new interval/ease.  
5. **DB Transaction**: update schedule, insert review log, query next due.  
6. **Map and Return DTO**: transform DB rows to `ReviewScheduleChangeDTO` and `RecordReviewResponseDTO`.  
7. **Error Classes**: define `NotFoundError`, `ValidationError`, `BusinessError` in `src/lib/errors`.  
8. **Route Handler**: wire up validation, auth, service call, and HTTP response codes.  
9. **Unit Tests**: in `src/lib/services/__tests__/learningService.test.ts` for normal and edge cases.  
10. **Integration Tests**: add HTTP tests in `scripts/api-test.http`.  
11. **Linter & Type Check**: run and fix any errors.  
12. **PR & Review**: submit for code review following repository conventions.