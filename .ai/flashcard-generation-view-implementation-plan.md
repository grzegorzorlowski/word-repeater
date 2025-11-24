## View Implementation Plan — Flashcard Generation

## 1. Overview

The Flashcard Generation view allows a logged-in user to paste text and request AI-generated flashcard suggestions that are persisted as “pending” flashcards. The view provides a textarea with a live character counter, validates the text length (500–5000 chars), and calls the `/api/flashcards/generate` endpoint. The UI shows a loader during generation, disables the Generate button when invalid or loading, and displays errors as a toast/alert. On success, it shows a brief summary and an affordance to proceed to review/accept/reject flow elsewhere.

## 2. View Routing

- Path: `/generate`
- Page type: Astro page using `Layout.astro` with a React island for the interactive form.

## 3. Component Structure

- `src/pages/generate.astro`
  - Uses `src/layouts/Layout.astro`
  - Renders React island: `GenerateFlashcardsForm` (client:load or client:idle)
- `src/components/GenerateFlashcardsForm.tsx` (React)
  - `TextAreaWithCounter`
  - `GenerateButton` (re-uses `src/components/ui/button.tsx`)
  - `CharacterLimitHint`
  - `InlineLoader` (re-uses `DashboardLoader.tsx` or a small inline spinner)
  - `ErrorToast` (simple dismissible alert/toast)
  - `TruncateDialog` (confirm dialog to trim to 5000 if exceeded)

## 4. Component Details

### GenerateFlashcardsForm

- Component description: Main interactive form enabling text input, validation, and submit to generate flashcards. Manages view state, API integration, loading and error handling, and post-success affordances.
- Main elements: heading, descriptive text, `TextAreaWithCounter`, `CharacterLimitHint`, `GenerateButton`, `InlineLoader`, `ErrorToast`, `TruncateDialog`.
- Handled interactions:
  - onChange textarea → updates text, char count, validation state
  - onClick Generate → validates; if >5000 opens `TruncateDialog`; if 500–5000 triggers API
  - onConfirm truncate → trims to 5000 chars and proceeds to API
  - onDismiss error toast → clears error
  - optional: onSuccess action → link/button to proceed to reviewing pending flashcards on Dashboard
- Handled validation (detailed):
  - Character count live updates
  - Disable Generate unless 500 ≤ chars ≤ 5000 and not loading
  - If chars > 5000: show `TruncateDialog` with “Shorten to 5000” or “Cancel”
  - Pre-submit guard clauses check: empty text, <500, >5000 (unless truncate path chosen)
- Types:
  - Uses `GenerateAIFlashcardsRequestDTO`, `GenerateAIFlashcardsResponseDTO`, `FlashcardSuggestionDTO` (from `src/types.ts`)
  - Uses `GenerateViewModel` (new; see Types section)
  - Uses `ValidationErrorItem` (new; for backend validation details)
- Props: none (self-contained view island)

### TextAreaWithCounter

- Component description: Textarea with a “N / 5000” counter and accessibility labels.
- Main elements: `<label>`, `<textarea>`, `<div>` counter
- Handled interactions:
  - onChange → propagate new value upward
- Handled validation:
  - Visual states based on char count ranges: <500 (warn), 500–5000 (ok), >5000 (error)
- Types:
  - Props interface includes `value: string`, `onChange(value: string)`, `count: number`, `max: number`, `min: number`
- Props:
  - `value`, `onChange`, `count`, `min=500`, `max=5000`, `disabled?`

### GenerateButton

- Component description: Primary action, re-uses Shadcn/ui `Button` abstraction at `src/components/ui/button.tsx`.
- Main elements: `<Button>`
- Handled interactions: onClick → form submit handler
- Handled validation: disabled when invalid input or loading
- Types: Props: `disabled: boolean`, `onClick: () => void`, `loading?: boolean`
- Props: as above

### CharacterLimitHint

- Component description: Small helper text explaining limits and minimum.
- Main elements: `<p>` with subdued text style
- Handled interactions: none
- Validation: none (static text)
- Types: none
- Props: optional `variant` (info/warn/error) based on char state

### InlineLoader

- Component description: Inline spinner shown inside the button or near it while generating.
- Main elements: spinner icon + “Generating…” text (or re-use `DashboardLoader.tsx` in compact mode)
- Handled interactions: none
- Validation: none
- Types: none
- Props: `visible: boolean`

### ErrorToast

- Component description: Dismissible alert/toast for API or validation errors.
- Main elements: alert container with message and close button
- Handled interactions: onDismiss
- Validation: none
- Types: `ViewError` (string) or structured; see `ValidationErrorItem`
- Props: `message: string`, `onDismiss: () => void`

### TruncateDialog

- Component description: Minimal confirm dialog to trim input to 5000 chars.
- Main elements: dialog container with message, “Shorten to 5000” (primary) and “Cancel” (secondary)
- Handled interactions: onConfirm → trims text; onCancel → closes dialog, no change
- Validation: only shown when `count > 5000`
- Types: none special
- Props: `open: boolean`, `onConfirm: () => void`, `onCancel: () => void`

## 5. Types

- Existing (from `src/types.ts`):
  - `GenerateAIFlashcardsRequestDTO`:
    - `text: string`
    - `limit: number`
  - `FlashcardSuggestionDTO`:
    - `id?: string | null`
    - `question: string`
    - `answer: string`
  - `GenerateAIFlashcardsResponseDTO`:
    - `flashcards: FlashcardSuggestionDTO[]`
    - `message: string`

- New (for the view):
  - `GenerateViewModel` (component-local state model)
    - `text: string`
    - `charCount: number`
    - `isGenerating: boolean`
    - `error: string | null`
    - `showTruncateDialog: boolean`
    - `generatedFlashcards: FlashcardSuggestionDTO[]`
    - `successMessage: string | null`
  - `ValidationErrorItem`
    - `field: string`
    - `message: string`
  - `GenerateApiError`
    - `status: number`
    - `message: string`
    - `details?: ValidationErrorItem[]`

## 6. State Management

- Managed within `GenerateFlashcardsForm` via `useState`/`useMemo`/`useCallback`.
- Suggested custom hook: `useFlashcardGeneration()`
  - Responsibilities:
    - Hold `GenerateViewModel` state
    - Expose `setText`, derived `charCount`
    - Provide `canSubmit` (500 ≤ chars ≤ 5000 && !isGenerating)
    - Provide `submit()` that orchestrates validation, optional truncate flow, API call, and success/error mapping
  - Optional: include a request timeout via `AbortController` (e.g., ~12s) to guard against long waits

## 7. API Integration

- Endpoint: `POST /api/flashcards/generate`
- Request (TypeScript aligns to `GenerateAIFlashcardsRequestDTO`):

```ts
type GenerateAIFlashcardsRequestDTO = {
  text: string; // 500–5000 chars
  limit: number; // number of suggestions, default 5 if omitted server-side
};
```

- Response (TypeScript aligns to `GenerateAIFlashcardsResponseDTO`):

```ts
type GenerateAIFlashcardsResponseDTO = {
  flashcards: {
    id?: string | null;
    question: string;
    answer: string;
  }[];
  message: string;
};
```

- Client behavior:
  - Send `limit` explicitly (default 5) to avoid ambiguity
  - Headers: `Content-Type: application/json`
  - Handle error statuses: 400 (validation), 422 (unprocessable), 500 (unexpected), network errors
  - Parse `details` array on 400 to show specific validation messages

## 8. User Interactions

- Typing/pasting text:
  - Counter updates live
  - Visual states for <500 (warning), 500–5000 (ok), >5000 (error)
- Clicking Generate:
  - If <500 → keep disabled; show hint
  - If >5000 → show `TruncateDialog`
  - If 500–5000 → call API; show loader; disable inputs/button
  - On success → show success message with count; offer link to Dashboard to review pending flashcards
  - On error → display `ErrorToast`; re-enable inputs

## 9. Conditions and Validation

- Minimum 500 characters: enforce in `canSubmit`, show visual warning
- Maximum 5000 characters: if exceeded, show `TruncateDialog` with “Shorten to 5000” or “Cancel”
- Disable Generate during `isGenerating`
- Ensure HTTPS is used in production; rely on site deployment configuration (no mixed content warnings)

## 10. Error Handling

- 400 Validation failed:
  - Show top-level error “Validation failed”
  - If `details` present, display first/merged messages near the textarea or within `ErrorToast`
- 422 Unprocessable (e.g., AI could not produce cards):
  - Show user-friendly message “Couldn’t generate flashcards from this text. Try adjusting the input.”
- 500/Network:
  - Generic message: “Unexpected error. Please try again.”
  - Provide “Retry” button and keep the typed text intact
- Timeout (client-side):
  - Abort after ~12s and surface a retry affordance

## 11. Implementation Steps

1. Routing
   - Create `src/pages/generate.astro` using `src/layouts/Layout.astro` and mount `GenerateFlashcardsForm` as a React island.
2. Components
   - Create `src/components/GenerateFlashcardsForm.tsx` with internal state per `GenerateViewModel`.
   - Create `src/components/TextAreaWithCounter.tsx` (labelled, accessible, Tailwind 4 compliant).
   - Create `src/components/CharacterLimitHint.tsx` for small, stateful guidance.
   - Reuse `src/components/ui/button.tsx` for `GenerateButton`.
   - Reuse `src/components/DashboardLoader.tsx` (or a compact loader) for `InlineLoader`.
   - Create `src/components/ErrorToast.tsx` (simple alert/toast, dismissible).
   - Create `src/components/TruncateDialog.tsx` (confirm dialog; can be a simple semantic dialog).
3. Hook
   - Implement `useFlashcardGeneration` encapsulating state, validation, and `submit()` with `fetch` integration and optional `AbortController`.
4. Validation
   - Enforce min/max checks in UI and within `submit()` before fetch; trim on truncate confirm.
5. API integration
   - POST `/api/flashcards/generate` with `{ text, limit: 5 }` by default.
   - Map server error structures to `GenerateApiError` and surface via `ErrorToast`.
6. Success handling
   - Show success message with count: “Generated N flashcard(s).”
   - Provide Link/Button to Dashboard (e.g., `/dashboard`) to continue with acceptance flow.
7. Accessibility
   - Ensure labels/aria attributes for textarea and buttons; keyboard-focus visible; roles for dialog and alerts.
8. Styling
   - Tailwind 4 classes consistent with existing project style; responsive mobile-first.
9. QA
   - Test paths: <500, 500–5000, >5000 with truncate confirm/cancel, network error, 400 details, 422 failure, success.
