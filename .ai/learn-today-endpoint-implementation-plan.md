# API Endpoint Implementation Plan: Fetch Today’s Cards

## 1. Endpoint Overview
Retrieve all due flashcards (those with `next_due` ≤ now) plus up to `limit` new flashcards (`repetition_count = 0`) for the authenticated user. Due cards are unlimited; new cards are capped per call.

## 2. Request Details
- HTTP Method: GET  
- URL Path: `/api/v1/learning/today`  
- Query Parameters:  
  - Optional  
    - `limit` (integer): number of new cards to fetch. Default 50, maximum 50.  

### Input Validation
- Use a Zod schema in the route:  
  ```ts
  const querySchema = z.object({
    limit: z.preprocess(
      (val) => parseInt(String(val), 10),
      z.number().int().min(0).max(50).default(50)
    )
  });
  ```
- On parse/validation failure, respond with **422 Unprocessable Entity** and a validation error payload.

## 3. Used Types
```ts
// src/types.ts or src/db/database.types.ts
export interface ScheduleDTO {
  next_due: string;          // ISO8601
  interval_days: number;
  repetition_count: number;
  ease_factor: number;
}

export interface CardDTO {
  flashcardId: string;       // UUID
  question: string;
  answer: string;
  schedule: ScheduleDTO;
}

export interface FetchTodayResponse {
  cards: CardDTO[];
  count: number;
}

export interface FetchTodayCommand {
  userId: string;
  limit: number;
}
```

## 4. Response Details
- **200 OK**  
  ```json
  {
    "cards": [
      {
        "flashcardId": "UUID",
        "question": "...",
        "answer": "...",
        "schedule": {
          "next_due": "ISO8601",
          "interval_days": 1,
          "repetition_count": 2,
          "ease_factor": 2.5
        }
      }
    ],
    "count": 25
  }
  ```
- **401 Unauthorized**: user not authenticated  
- **422 Unprocessable Entity**: invalid `limit`  
- **500 Internal Server Error**: unexpected errors  

## 5. Data Flow
1. **Route Handler** (`src/pages/api/v1/learning/today.ts`)  
   - Extract `supabase` client from `context.locals`  
   - Parse & validate `limit` via Zod  
   - Retrieve `userId` from the session (`await supabase.auth.getUser()`)  
   - Call service: `fetchTodaysCards({ userId, limit })`  
   - Return JSON payload  

2. **Service Layer** (`src/lib/services/learningService.ts`)  
   ```ts
   export async function fetchTodaysCards(cmd: FetchTodayCommand): Promise<FetchTodayResponse> {
     const { userId, limit } = cmd;
     // 1. Fetch due cards
     const { data: dueRows, error: dueError } = await supabase
       .from('flashcard_schedule')
       .select(`
         next_due, interval_days, repetition_count, ease_factor,
         flashcards ( id, question, answer )
       `)
       .eq('user_id', userId)
       .lte('next_due', new Date().toISOString())
       .order('next_due', { ascending: true });
     if (dueError) throw dueError;

     // 2. Fetch new cards (repetition_count = 0)
     const { data: newRows, error: newError } = await supabase
       .from('flashcard_schedule')
       .select(`
         next_due, interval_days, repetition_count, ease_factor,
         flashcards ( id, question, answer )
       `)
       .eq('user_id', userId)
       .eq('repetition_count', 0)
       .limit(limit);
     if (newError) throw newError;

     // 3. Merge and map to DTOs
     const allRows = [...dueRows, ...newRows];
     const cards: CardDTO[] = allRows.map(row => ({
       flashcardId: row.flashcards.id,
       question: row.flashcards.question,
       answer: row.flashcards.answer,
       schedule: {
         next_due: row.next_due,
         interval_days: row.interval_days,
         repetition_count: row.repetition_count,
         ease_factor: row.ease_factor
       }
     }));

     return { cards, count: cards.length };
   }
   ```

3. **Database Interaction**  
   - Tables:  
     - `flashcard_schedule` (indexed on `(user_id, next_due)`)  
     - `flashcards` (join for `question`/`answer`)  

## 6. Security Considerations
- **Authentication**: require user session; return 401 if missing.  
- **Authorization**: RLS in Supabase ensures user only sees their own schedule.  
- **Input sanitization**: `limit` coerced and bounded via Zod.  
- **Injection protection**: Supabase client parameterizes queries.  
- **Rate limiting** (optional): prevent abuse by capping endpoint calls per minute.  

## 7. Error Handling
| Condition                              | Status Code | Action                                           |
|----------------------------------------|-------------|--------------------------------------------------|
| Missing/invalid session                | 401         | `{ error: 'Unauthorized' }`                      |
| `limit` validation failure             | 422         | `{ error: 'Invalid query parameter: limit' }`    |
| Supabase query error (due/new fetch)   | 500         | Log error; `{ error: 'Internal server error' }`  |
| Success (no cards)                     | 200         | `{ cards: [], count: 0 }`                        |

- Log all unexpected errors via a central logger (`console.error` or external service).

## 8. Performance Considerations
- Leverage existing indexes on `(user_id, next_due)` for due/new queries.  
- Separate queries to avoid full table scans.  
- Limit result set for new cards.  
- Consider cursor-based pagination if card set grows large.  

## 9. Implementation Steps
1. **Create Zod schema** for `limit` in the route file.  
2. **Implement GET handler** in `src/pages/api/v1/learning/today.ts`:  
   - Import Zod, types, service.  
   - Validate query, authenticate user, call service, return JSON.  
3. **Create or extend service** in `src/lib/services/learningService.ts` with `fetchTodaysCards()`.  
4. **Define DTOs** in `src/types.ts` (or `src/db/database.types.ts`) if not present.  
5. **Add error handling** wrappers around Supabase calls.  
6. **Write unit tests** for:  
   - Valid limit, default limit, limit > 50  
   - No due cards, some due and new cards  
   - Unauthorized access  
7. **Run linter & fix** any violations per shared/backend/astro rules.  
8. **Deploy** and **monitor** logs for errors/performance.  
