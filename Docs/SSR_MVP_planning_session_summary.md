<conversation_summary>
<decisions>
1. Skip analytics and audit for SRS functionality in MVP.  
2. Use global FSRS parameters with no per-user settings for MVP.  
3. Define a Postgres enum type `rating` with values (`again`, `hard`, `good`, `easy`).  
4. Introduce new tables:  
   - `flashcard_schedule` to track per-card SRS state separate from `flashcards`.  
   - `review_logs` to record each review event (rating + timestamp) for enforcing the daily new-card cap; analytics skipped.  
5. Implement two authenticated API endpoints under `/api/v1/learning`:  
   - `GET /today` to fetch due and new cards.  
   - `POST /review` to record a single review rating.  
6. Retain the existing “Start Learning” button and wire it to a new `/learn` route/page.  
7. Enforce a daily cap of 50 new cards (where `repetition_count = 0`) per session (reset at midnight); no limit on review of due cards.  
8. Keep sessions stateless; derive session summaries implicitly from schedule data.  
9. Always use server-side UTC timestamps for review records.  
10. Mirror Supabase RLS and FK constraints for `flashcard_schedule`, matching `flashcards` security.  
11. Add an SRS abstraction layer in `src/lib/srsService.ts` with methods `initializeSchedule()`, `getDueCards()`, and `processReview()`.  
12. Write unit tests for the SRS service to verify correct interval, ease factor, and due-date computation.
</decisions>

<matched_recommendations>
1. Create `flashcard_schedule` table with columns (`flashcard_id`, `next_due`, `interval_days`, `repetition_count`, `ease_factor`).  
2. Skip audit tables for now, defer analytics.  
3. Use global defaults and optionally scaffold `user_srs_settings` for future.  
4. Define Postgres `rating` enum for review ratings.  
5. Secure `/api/v1/learning` endpoints with Supabase auth and RLS policies.  
6. Add `/learn` page accessible via existing button on dashboard.  
7. POST `/review` accepts `{ flashcardId, rating }` and returns updated schedule.  
8. Cap of 50 new cards per session (where `repetition_count = 0`); no cap on review of due cards.  
9. Keep scheduling state separate from `flashcards`; infer new cards via `repetition_count = 0`.  
10. Add indexes on `(user_id, next_due)` and FK constraints for performant lookups.
</matched_recommendations>

<database_planning_summary>  
We will introduce a dedicated `flashcard_schedule` table to store SRS state per flashcard without modifying `flashcards`. This table will have foreign key `flashcard_id`, `user_id`, `next_due` (UTC timestamp), `interval_days` (int), `repetition_count` (int), and `ease_factor` (float). A Postgres enum `rating` will be created for values `again`, `hard`, `good`, and `easy`. We will enforce FK constraints with `ON DELETE CASCADE` and add indexes on `(user_id, next_due)` for efficient due-card queries. Soft deletes on `flashcards` continue to cascade. The global FSRS parameters are hardcoded in the service; per-user settings may be scaffolded later but are not required for MVP.  
</database_planning_summary>

<API_planning_summary>  
We will implement two authenticated REST endpoints under `/api/v1/learning`:  
- `GET /today?limit=50` returns up to 50 due cards ordered by `next_due`, then new cards where `repetition_count = 0`.  
- `POST /review` accepts a JSON body `{ flashcardId: string; rating: Rating }`, validates the enum, applies ts-fsrs via the `srsService`, updates `flashcard_schedule`, and returns the updated schedule entry.  
Requests will use server-side UTC for timestamps, return 422 on invalid ratings, and enforce Supabase RLS policies matching `flashcards` security. Sessions are stateless; each review call stands alone.  
</API_planning_summary>

<API_planning_summary>  
A new `/learn` page (e.g. `src/pages/learn.astro`) will drive the learning session. The existing dashboard button “Start Learning” will navigate here. The React component on `/learn` will fetch due/new cards via `GET /today`, render one flashcard at a time, allow the user to reveal the answer, and post ratings to `POST /review`, then advance to the next card. It will handle “no cards” states, enforce the daily cap, and display session summary at the end.  
</API_planning_summary>

<unresolved_issues>
No major unresolved issues remain. All schema, API, and UI questions have been addressed for MVP scope.  
</unresolved_issues>
</conversation_summary>