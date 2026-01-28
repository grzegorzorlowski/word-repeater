# View Implementation Plan: Learning Session

## 1. Overview

The Learning Session view (`/learn`) lets authenticated users review flashcards scheduled for today using spaced repetition. One flashcard is shown at a time: the user sees the question, reveals the answer with "Show Answer", then rates their recall with one of four options (Again, Hard, Good, Easy). The schedule is updated server-side via the SRS service. The view handles loading, empty state (no cards today), session progress, session summary when all cards are reviewed, and error states (network errors, session expired, card deleted). It aligns with PRD requirements RF-013–RF-016, US-013–US-015, US-020, US-021, US-023, and US-017 (accessibility).

## 2. View Routing

- **Path:** `/learn`
- **File:** `src/pages/learn.astro`
- **Access:** Protected; requires authentication. Unauthenticated users should be redirected to login (handled by middleware or layout).
- **Client component:** A single root React component (e.g. `LearningSessionView`) mounted with `client:load` so the view is interactive on first load.

## 3. Component Structure

```
learn.astro
  └── Layout
        └── main
              └── LearningSessionView (React, client:load)
                    ├── [Loading] InlineLoader + "Loading flashcards..."
                    ├── [Error on fetch] Error block + Retry button
                    ├── [Empty] EmptyLearningState
                    ├── [Session active] Header + ProgressIndicator + LearningCardDisplay + RatingButtons (when answer visible)
                    └── [Session complete] SessionSummary
```

- **LearningSessionView:** Container that owns state (via a custom hook), decides which subview to show (loading, error, empty, active, summary), and wires API and callbacks.
- **LearningCardDisplay:** Renders the current card: question always visible; answer hidden until "Show Answer" is clicked, then answer visible and button hidden or replaced.
- **RatingButtons:** Four buttons (Again, Hard, Good, Easy) with distinct styling and aria-labels; only enabled or prominently shown when answer is visible.
- **ProgressIndicator:** Displays "Card X of Y" and optionally a progress bar; uses an aria-live region for updates.
- **SessionSummary:** Shown when all cards are reviewed; shows count reviewed and approximate duration; CTA to dashboard.
- **EmptyLearningState:** Shown when today's list is empty; message "No flashcards to review today" and CTAs to generate or create flashcards.
- **InlineLoader,** **ErrorToast** (or existing error UI): Reused from the project.

## 4. Component Details

### LearningSessionView

- **Description:** Root container for the Learning Session page. Fetches today's cards on mount, holds current card index, answer visibility, loading/error state, and session stats. Renders loading, fetch error, empty, active card, or session summary based on state.
- **Main elements:** A wrapper `div`; conditional blocks for loader, error, empty state, active session (header, progress, card, rating buttons), and summary; optional `ErrorToast` for rating submit errors.
- **Handled events:** None directly; delegates to hook (`retry` for fetch error, `submitRating` from RatingButtons, navigation via SessionSummary/EmptyLearningState links).
- **Validation:** Does not validate API payloads; relies on API. Ensures `submitRating` is only called with current card's `flashcardId` and a valid `Rating` from the four buttons.
- **Types:** Uses `LearningCardDTO` and `Rating` from `src/types.ts`; hook exposes a view model (e.g. `cards`, `currentCard`, `showAnswer`, `setShowAnswer`, `loading`, `error`, `sessionStartTime`, `reviewedCount`, `submitRating`, `retry`, `clearError`).
- **Props:** None (page-level component).

### LearningCardDisplay

- **Description:** Displays one flashcard: question always visible; answer hidden until the user clicks "Show Answer", then answer is shown and the button is hidden or replaced.
- **Main elements:** `article` (or section) with aria-labelledby for question; heading/label "Question" and paragraph for question text; "Show Answer" button with aria-label "Show answer"; conditional section for answer (heading "Answer", paragraph) and optional aria-label "Answer: [text]".
- **Handled events:** `onShowAnswer`: click on "Show Answer" button.
- **Validation:** None; displays strings from API.
- **Types:** Props: `question: string`, `answer: string`, `onShowAnswer: () => void`, `answerVisible: boolean` (or derive from callback). No new DTOs.
- **Props:** `question`, `answer`, `answerVisible`, `onShowAnswer`; optional `cardId` for DOM ids.

### RatingButtons

- **Description:** Four rating buttons (Again, Hard, Good, Easy) with distinct styling (destructive, warning, primary, success) and minimum touch target 44×44px. Enabled only when answer is visible. Support keyboard shortcuts 1–4 when answer is visible.
- **Main elements:** Container `div` with `role="group"` and `aria-label="Rate your recall"`; four `button` elements (or Shadcn `Button`) with labels "Again", "Hard", "Good", "Easy" and aria-labels "Rate as: Again", etc.
- **Handled events:** `onRate(rating: Rating)` on button click; `onKeyDown` (or global keydown when focus in view) for keys 1–4 mapping to again, hard, good, easy.
- **Validation:** Only valid ratings are emitted (`again`|`hard`|`good`|`easy`). No form validation.
- **Types:** `Rating` from `src/types.ts`. Props: `onRate: (rating: Rating) => void`, `disabled: boolean` (e.g. while submitting), `answerVisible: boolean` (to enable buttons and keyboard).
- **Props:** `onRate`, `disabled`, `answerVisible`.

### ProgressIndicator

- **Description:** Shows session progress as "Card X of Y" and optionally a progress bar. Updates when the user advances; should be announced to screen readers.
- **Main elements:** `div` with `aria-live="polite"` (or `status`); text "Card {current} of {total}"; optional `progress` element or styled bar.
- **Handled events:** None.
- **Validation:** Ensure `current` and `total` are non-negative and `current <= total`.
- **Types:** Props: `current: number`, `total: number`. No DTOs.
- **Props:** `current`, `total`.

### SessionSummary

- **Description:** Shown when all cards have been reviewed. Displays number of cards reviewed and approximate session duration; primary CTA to return to dashboard.
- **Main elements:** Section or card with heading "Session complete" (or similar); paragraph with "You reviewed X cards"; paragraph with "Duration: approximately Y min" (or similar); link/button to `/dashboard`.
- **Handled events:** None (link navigation).
- **Validation:** None.
- **Types:** Props: `cardsReviewed: number`, `durationMinutes: number` (or seconds to format).
- **Props:** `cardsReviewed`, `durationMinutes` (or `durationSeconds`).

### EmptyLearningState

- **Description:** Shown when GET today returns `count === 0`. Message that there are no flashcards to review today and CTAs to generate or create flashcards.
- **Main elements:** Container with icon/illustration; heading "No flashcards to review today"; short explanation; links to `/generate` and `/flashcards/new` (and optionally `/dashboard`).
- **Handled events:** None (link navigation).
- **Validation:** None.
- **Types:** No new types; no props or optional `message` string.
- **Props:** None or optional `message`.

## 5. Types

- **From `src/types.ts` (use as-is):**
  - `Rating`: `"again" | "hard" | "good" | "easy"`.
  - `LearningCardDTO`: `{ flashcardId: string; question: string; answer: string; schedule: FlashcardScheduleDTO }`.
  - `FlashcardScheduleDTO`: `{ next_due: string; interval_days: number; repetition_count: number; ease_factor: number }`.
  - `FetchTodayCardsResponseDTO`: `{ cards: LearningCardDTO[]; count: number }`.
  - `RecordReviewRatingRequestDTO`: `{ flashcardId: string; rating: Rating }`.
  - `RecordReviewResponseDTO`: `{ reviewed: ReviewScheduleChangeDTO }`.
  - `ErrorResponseDTO`: `{ error: string; details?: Record<string, string[] | string> }`.

- **ViewModel (in hook or view):** Optional internal type for the hook’s return value, e.g. `LearningSessionViewModel`: `cards`, `currentCard`, `currentIndex`, `showAnswer`, `setShowAnswer`, `loading`, `error`, `sessionStartTime`, `reviewedCount`, `submitRating`, `retry`, `clearError`. No new shared DTOs are required; the view uses the existing API types.

## 6. State Management

- **Custom hook:** `useLearningSession` (in `src/hooks/useLearningSession.ts`), following the pattern of `useAcceptFlashcard`.
- **State inside the hook:**
  - `cards: LearningCardDTO[]` — list from GET today.
  - `currentIndex: number` — index of the current card (0-based).
  - `showAnswer: boolean` — whether the answer is visible for the current card (reset to `false` when advancing).
  - `loading: boolean` — true during initial fetch or optional during submit (if not optimistic).
  - `error: string | null` — user-facing message for fetch or submit failure.
  - `sessionStartTime: number | null` — `Date.now()` when cards were first set (for duration in summary).
  - `reviewedCount: number` — number of cards successfully reviewed this session (incremented after successful POST review).
- **Derived:**
  - `currentCard = cards[currentIndex] ?? null`.
  - `totalCards = cards.length`.
  - `isSessionComplete = totalCards > 0 && reviewedCount >= totalCards` (or equivalent: all cards have been rated).
  - `durationSeconds` / `durationMinutes` from `sessionStartTime` and current time when showing summary.
- **Actions:**
  - `fetchToday()`: GET `/api/v1/learning/today?limit=50`, parse `FetchTodayCardsResponseDTO`, set `cards`, reset `currentIndex` and `showAnswer`, set `sessionStartTime` if not set.
  - `submitRating(rating: Rating)`: If no `currentCard`, return. POST `/api/v1/learning/review` with `{ flashcardId: currentCard.flashcardId, rating }`. On 200: increment `reviewedCount`, set `showAnswer = false`, advance (e.g. `currentIndex + 1` or remove current card and keep index). On 404: treat as card deleted — skip current card, show toast, advance. On 4xx/5xx: set `error` (or show toast), allow retry without advancing.
  - `retry()`: Clear error, call `fetchToday()`.
  - `clearError()`: Set `error` to null.
  - `setShowAnswer(value: boolean)`: Set by LearningSessionView when user clicks "Show Answer".
- **Reset of `showAnswer`:** When `currentIndex` changes (after successful rating), set `showAnswer` to `false` so the next card starts with answer hidden.

## 7. API Integration

- **GET today's cards**
  - **Request:** `GET /api/v1/learning/today?limit=50` (or omit for default 50). Credentials: include cookies (same-origin).
  - **Response (200):** `FetchTodayCardsResponseDTO` — `{ cards: LearningCardDTO[], count: number }`. Use `cards` and `count`; if `count === 0`, show EmptyLearningState.
  - **Errors:** 401 → show message and link to login (or redirect via middleware). 422 → invalid limit (should not happen if client sends 1–50). 500 → show error and retry.

- **POST review**
  - **Request:** `POST /api/v1/learning/review`, `Content-Type: application/json`, body: `RecordReviewRatingRequestDTO` — `{ flashcardId: string, rating: Rating }`. Use the current card’s `flashcardId` and the chosen `rating`.
  - **Response (200):** `RecordReviewResponseDTO` — `{ reviewed: { flashcardId, previous_schedule, new_schedule } }`. Frontend does not need to persist schedule; advance to next card and update `reviewedCount`.
  - **Errors:** 400 (validation) / 404 (not found – card deleted) / 422 / 500 → show user-friendly message; on 404 skip card and show toast; on others allow retry of same rating.

## 8. User Interactions

- **Page load:** Call GET today; show loader until response. Then: if no cards → EmptyLearningState; else show first card, set `sessionStartTime`, show ProgressIndicator and LearningCardDisplay (answer hidden).
- **"Show Answer" click:** Set `showAnswer` to true; reveal answer; show RatingButtons and enable keyboard 1–4.
- **Rating button click (Again / Hard / Good / Easy):** Call `submitRating(rating)`. Optionally show loading on buttons. On success: advance to next card, reset `showAnswer`, update progress; if no next card, show SessionSummary. On failure: show error/toast, keep current card and answer visible for retry.
- **Keyboard 1–4 (when answer visible):** Map 1→Again, 2→Hard, 3→Good, 4→Easy; same as button click (call `submitRating`). Prevent default when used.
- **Retry (after fetch error):** Call `retry()` to clear error and re-fetch today.
- **Retry (after submit error):** User can click the same rating again or a "Retry" in toast; resend POST for current card.
- **Session summary "Back to Dashboard":** Navigate to `/dashboard` (link).
- **Empty state "Generate" / "Create Flashcard":** Navigate to `/generate` and `/flashcards/new` respectively.
- **Focus management:** After rating and advance, move focus to the next card’s question or "Show Answer" (or to summary heading when session complete). Use `useEffect` and refs similar to AcceptFlashcardView.

## 9. Conditions and Validation

- **Limit (GET today):** Client sends `limit` in range 1–50 (e.g. 50). No client-side validation beyond that; API returns 422 if invalid.
- **Review (POST):** `flashcardId` must be the current card’s ID (UUID); `rating` must be one of the four values. Buttons only emit these; no extra validation. Server validates ownership and card existence (404 if deleted).
- **Empty list:** When `count === 0` or `cards.length === 0` after fetch, show EmptyLearningState.
- **Session complete:** When all cards have been reviewed (e.g. `reviewedCount === totalCards` and `totalCards > 0`), show SessionSummary.
- **Answer visibility:** RatingButtons and keyboard shortcuts are only active when `showAnswer === true`; "Show Answer" is hidden after click.

## 10. Error Handling

- **No cards (200, count 0):** Show EmptyLearningState with CTAs; no error message.
- **401 Unauthorized (fetch or review):** Show message "You must be logged in." and link to login; or rely on middleware to redirect to login with a message.
- **Network error (fetch):** Show error message and Retry button; `retry()` re-calls GET today.
- **Network error (review):** Show error toast; keep current card and answer visible; allow user to click same rating again to retry POST.
- **404 on review (card deleted):** Skip current card (advance), show short toast "This card was removed."; do not block session.
- **400/422/500 on review:** Show user-friendly message (e.g. "Could not save your rating. Try again."); allow retry.
- **Session expired during session:** If a subsequent request returns 401, show message and link to login (or redirect).

## 11. Implementation Steps

1. **Types and API:** Ensure `src/types.ts` exposes `LearningCardDTO`, `Rating`, `FetchTodayCardsResponseDTO`, `RecordReviewRatingRequestDTO`, `RecordReviewResponseDTO`, and `ErrorResponseDTO`. No changes needed if already present.

2. **Hook:** Implement `useLearningSession` in `src/hooks/useLearningSession.ts`: state (cards, currentIndex, showAnswer, loading, error, sessionStartTime, reviewedCount), `fetchToday()` (GET today, set cards and sessionStartTime), `submitRating(rating)` (POST review, handle 200/404/4xx/5xx), `retry`, `clearError`, and `setShowAnswer`. Reset `showAnswer` when advancing. Export derived values (currentCard, totalCards, isSessionComplete, duration).

3. **LearningCardDisplay:** Create `src/components/LearningCardDisplay.tsx`: props `question`, `answer`, `answerVisible`, `onShowAnswer`. Render question; conditional "Show Answer" button (aria-label "Show answer"); conditional answer section. Use semantic HTML and ids for aria-labelledby.

4. **RatingButtons:** Create `src/components/RatingButtons.tsx`: props `onRate`, `disabled`, `answerVisible`. Four buttons with labels Again (destructive), Hard (warning), Good (primary), Easy (success); min height/width 44px. aria-labels "Rate as: Again", etc. Add keydown listener (when answerVisible) for keys 1–4 calling `onRate` with the correct rating.

5. **ProgressIndicator:** Create `src/components/ProgressIndicator.tsx` (or reuse if one exists): props `current`, `total`. Render "Card X of Y" and optional progress bar; wrap in aria-live region for updates.

6. **SessionSummary:** Create `src/components/SessionSummary.tsx`: props `cardsReviewed`, `durationMinutes`. Display summary text and link to `/dashboard`.

7. **EmptyLearningState:** Create `src/components/EmptyLearningState.tsx`: message "No flashcards to review today", CTAs to `/generate` and `/flashcards/new` (and optionally `/dashboard`).

8. **LearningSessionView:** Create `src/components/LearningSessionView.tsx`. Use `useLearningSession`. Render in order: loading (InlineLoader); fetch error (message + Retry); empty (EmptyLearningState); session complete (SessionSummary); else header + ProgressIndicator + LearningCardDisplay + RatingButtons (when showAnswer). Wire `submitRating`, `setShowAnswer`, `retry`. Add focus management after rating and when showing summary. Optionally show ErrorToast for submit errors.

9. **Page:** Create `src/pages/learn.astro`. Use Layout; render `<LearningSessionView client:load />` inside main. Set title e.g. "Learning Session - WordRepeater".

10. **Accessibility:** Add aria-labels to all interactive elements; ensure ProgressIndicator has aria-live; ensure keyboard 1–4 only when answer visible; ensure focus moves to next card or summary after rating; verify minimum touch target 44×44px for rating buttons.

11. **Error and edge cases:** Handle 401 with message or redirect; handle 404 on review by skipping card and showing toast; handle network errors with retry; ensure no client-side manipulation of schedule (only display and send rating).

12. **Tests:** Add unit tests for `useLearningSession` (fetch, submit, retry, advance, 404 skip). Add component tests for LearningSessionView (loading, empty, one card flow, rating, summary). Use MSW to mock GET today and POST review.

13. **Styling:** Use Tailwind and Shadcn Button variants (destructive, outline/warning, default, success) for Again, Hard, Good, Easy. Ensure responsive layout and smooth transition between cards (e.g. opacity or slide). Match project design system.

14. **Analytics (if required by PRD):** Emit internal event on session end (e.g. learning session end, count reviewed) if product specifies; implement in hook or view when showing SessionSummary.
