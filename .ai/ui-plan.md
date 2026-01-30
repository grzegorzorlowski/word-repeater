# UI Architecture for WordRepeater AI

## 1. UI Structure Overview

The UI architecture follows a **mobile-first** approach with a responsive layout and simple navigation. The application provides a streamlined learning experience with AI-powered flashcard generation, manual flashcard management, and a spaced repetition learning system. Main views include: Dashboard, Flashcard Generation, AI Flashcard Acceptance, Flashcard List, Manual Creation/Edit, Learning Session, Exceptional State Screens, and Login/Registration. The design system uses Tailwind CSS + Shadcn/ui for consistent components (buttons, chips, loader, modals, toast notifications). The learning flow implements a stateless session model where users review flashcards one at a time with four rating options (again, hard, good, easy) that update the SRS schedule in real-time.

## 2. View List

### 2.1 Dashboard

- **Path:** `/dashboard`
- **Purpose:** Central hub providing overview and quick access to main features.
- **Key Information:**
  - Number of flashcards available for review today (fetched from `/api/v1/learning/today`)
  - Quick statistics (total flashcards count, optional)
  - Primary CTAs: Generate Flashcards, My Flashcards, Start Learning
- **Key View Components:**
  - Header with navigation menu
  - Flashcard counter card showing "X cards to review today"
  - Large CTA buttons: "Generate Flashcards", "My Flashcards", "Start Learning"
  - Loading state while fetching today's card count
  - Empty state message if no cards available (with CTA to generate)
- **UX Considerations:**
  - Large, touch-friendly buttons (minimum 44x44px)
  - Clear visual hierarchy with primary action (Start Learning) most prominent
  - Real-time card count updates
  - Responsive grid layout for mobile and desktop
- **Accessibility Considerations:**
  - Aria-labels on all interactive elements
  - Semantic HTML structure
  - Keyboard navigation support
  - Screen reader announcements for card count changes
- **Security Considerations:**
  - Protected route requiring authentication
  - Server-side data fetching with session validation
  - No sensitive data exposed in client-side code

### 2.2 Flashcard Generation

- **Path:** `/generate`
- **Purpose:** Input text and trigger AI flashcard generation.
- **Key Information:**
  - Text input field with character counter (0/5000)
  - "Generate" button (disabled when empty or >5000 chars)
  - Generation status indicator
- **Key View Components:**
  - Large textarea with character counter
  - Generate button with loading state
  - Error toast for validation errors (character limit exceeded)
  - Modal dialog for character limit exceeded (with "Shorten" and "Cancel" options)
  - Success/error feedback
- **UX Considerations:**
  - Auto-resize textarea for better mobile experience
  - Real-time character count with visual warning near limit
  - Clear error messages with actionable options
  - Loading spinner during generation (with estimated time)
- **Accessibility Considerations:**
  - Aria-live region for character count announcements
  - Form labels and error messages properly associated
  - Keyboard shortcuts for common actions
  - Focus management in modals
- **Security Considerations:**
  - Input sanitization before sending to API
  - Rate limiting feedback (if applicable)
  - HTTPS for all API calls

### 2.3 AI Flashcard Acceptance

- **Path:** `/accept`
- **Purpose:** Review and accept/reject AI-generated flashcard suggestions one at a time.
- **Key Information:**
  - Current flashcard question and answer (answer initially hidden or collapsible)
  - Accept/Reject buttons
  - Progress indicator (e.g., "Card 3 of 12")
  - Optional: remaining cards count
- **Key View Components:**
  - Fullscreen or prominent card display
  - Question section (always visible)
  - Answer section (collapsible or "Show Answer" button)
  - Accept and Reject buttons (large, distinct styling)
  - Progress indicator
  - Loading state during API calls
  - Completion message when all cards processed
- **UX Considerations:**
  - One flashcard at a time for focused decision-making
  - Large, easily tappable buttons
  - Clear visual distinction between Accept (primary) and Reject (secondary)
  - Smooth transitions between cards
  - No ability to go back to rejected cards (as per MVP requirements)
- **Accessibility Considerations:**
  - Aria-labels: "Accept flashcard", "Reject flashcard"
  - Keyboard navigation: Enter/Space for Accept, Escape for Reject
  - Screen reader announcements for card changes
  - Focus management after button clicks
- **Security Considerations:**
  - Authenticated API calls for accept/reject decisions
  - No client-side storage of rejected cards
  - Server-side validation of flashcard ownership

### 2.4 Flashcard List

- **Path:** `/flashcards`
- **Purpose:** Browse, filter, and manage all user flashcards.
- **Key Information:**
  - Paginated list of flashcards
  - Filters: Source (AI/Manual), Status (Active/Deleted)
  - Flashcard preview (question, answer, creation date, source)
  - Edit and Delete actions per flashcard
- **Key View Components:**
  - Filter chips/buttons (Source: All/AI/Manual, Status: Active/Deleted)
  - Flashcard list/table (responsive: cards on mobile, table on desktop)
  - Pagination controls
  - Edit button/link per flashcard
  - Delete button with confirmation modal
  - Empty state message when no flashcards match filters
  - Loading skeleton during data fetch
- **UX Considerations:**
  - Responsive design: card layout on mobile, table on desktop
  - Clear visual indicators for source (AI vs Manual)
  - Inline editing or navigation to edit page
  - Confirmation dialog before deletion
  - Persistent filter state (URL params or local storage)
- **Accessibility Considerations:**
  - Table headers with proper scope attributes
  - Aria-labels for filter buttons
  - Keyboard navigation through list items
  - Focus indicators on interactive elements
- **Security Considerations:**
  - Row-level security enforced (users only see their flashcards)
  - Server-side validation of ownership before edit/delete
  - Soft delete implementation (data not permanently removed)

### 2.5 Manual Flashcard Creation

- **Path:** `/flashcards/new`
- **Purpose:** Create a new flashcard manually with custom question and answer.
- **Key Information:**
  - Question input field (required, max 300 characters)
  - Answer input field (required, max 500 characters)
  - Save button
  - Character counters for both fields
- **Key View Components:**
  - Form with question and answer textareas
  - Character counters
  - Save button (disabled when validation fails)
  - Cancel/Back button
  - Success message and redirect after save
  - Validation error messages
- **UX Considerations:**
  - Auto-resize textareas
  - Real-time validation feedback
  - Clear save confirmation
  - Option to add another flashcard after save
- **Accessibility Considerations:**
  - Form labels properly associated
  - Error messages linked to fields
  - Aria-describedby for character limits
  - Keyboard navigation support
- **Security Considerations:**
  - Input validation and sanitization
  - Authenticated API calls
  - Server-side length validation

### 2.6 Manual Flashcard Edit

- **Path:** `/flashcards/edit/:id`
- **Purpose:** Edit an existing flashcard's question and answer.
- **Key Information:**
  - Pre-filled question and answer fields
  - Save and Cancel buttons
  - Flashcard ID and metadata (read-only)
- **Key View Components:**
  - Form with pre-populated fields
  - Save button
  - Cancel button (with unsaved changes warning)
  - Loading state during fetch and save
  - Success message
  - Error handling (404 if flashcard not found)
- **UX Considerations:**
  - Unsaved changes warning on navigation away
  - Clear indication of what's being edited
  - Optimistic UI updates where appropriate
- **Accessibility Considerations:**
  - Same as creation form
  - Screen reader announcement of edit mode
- **Security Considerations:**
  - Ownership validation before allowing edit
  - Server-side validation of updates

### 2.7 Learning Session

- **Path:** `/learn`
- **Purpose:** Review flashcards scheduled for today using spaced repetition with four rating options.
- **Key Information:**
  - Current flashcard question (initially visible)
  - Answer (hidden until "Show Answer" is clicked)
  - Four rating buttons: Again, Hard, Good, Easy
  - Progress indicator (e.g., "Card 5 of 23")
  - Session statistics (optional: cards reviewed, time elapsed)
- **Key View Components:**
  - Flashcard display area (question always visible)
  - "Show Answer" button (transforms to answer display when clicked)
  - Four rating buttons in a grid layout:
    - **Again** (red/destructive styling) - "I didn't remember"
    - **Hard** (orange/warning styling) - "I remembered with difficulty"
    - **Good** (blue/primary styling) - "I remembered correctly" (default/primary)
    - **Easy** (green/success styling) - "I remembered easily"
  - Progress indicator (cards remaining, cards reviewed)
  - Loading state during API calls (fetching next card, submitting rating)
  - Session summary screen (shown when all cards reviewed)
  - Empty state (no cards to review) with CTA to generate/create flashcards
- **UX Considerations:**
  - One flashcard at a time for focused learning
  - Large, easily tappable rating buttons (minimum 44x44px)
  - Clear visual hierarchy: question → show answer → rate
  - Smooth transitions between cards
  - Keyboard shortcuts: 1=Again, 2=Hard, 3=Good, 4=Easy (when answer visible)
  - Visual feedback on button clicks
  - Progress bar or counter to show session progress
  - Session summary with review statistics (cards reviewed, approximate duration)
- **Accessibility Considerations:**
  - Aria-labels: "Show answer", "Rate as: Again", "Rate as: Hard", etc.
  - Keyboard navigation: Tab through buttons, Enter/Space to activate
  - Screen reader announcements: "Question: [text]", "Answer: [text]", "Card X of Y"
  - Focus management: After rating, focus moves to next card's question or summary
  - Aria-live region for progress updates
  - High contrast for rating buttons
- **Security Considerations:**
  - Authenticated API calls to `/api/v1/learning/today` and `/api/v1/learning/review`
  - Server-side validation of flashcard ownership
  - Rate limiting on review submissions (if applicable)
  - No client-side manipulation of schedule data
- **Edge Cases and Error States:**
  - **No cards available:** Display empty state with message "No flashcards to review today" and CTAs to generate or create flashcards
  - **Network error during fetch:** Show error message with retry button
  - **Network error during rating submission:** Show error toast, allow retry of last rating
  - **Session expired:** Redirect to login with message
  - **Daily new card limit reached:** Server enforces limit; UI shows remaining due cards only
  - **Card deleted during session:** Skip to next card, show toast notification
  - **Concurrent session:** Last rating wins (stateless design handles this)

### 2.8 Learning Session Summary

- **Path:** `/learn` (displayed as overlay/modal or separate screen after session completion)
- **Purpose:** Display summary statistics after completing a learning session.
- **Key Information:**
  - Number of flashcards reviewed
  - Approximate session duration
  - Breakdown by rating (optional: X Again, Y Hard, Z Good, W Easy)
  - Next review date information (optional)
- **Key View Components:**
  - Summary card/modal
  - Statistics display
  - "Back to Dashboard" button
  - "Review More" button (if more cards available)
  - Celebration animation/icon (optional, for positive reinforcement)
- **UX Considerations:**
  - Clear, celebratory presentation
  - Actionable next steps
  - Option to start another session immediately
- **Accessibility Considerations:**
  - Screen reader announcement of summary
  - Keyboard navigation to action buttons
- **Security Considerations:**
  - No sensitive data in summary
  - Client-side calculation of duration (privacy-friendly)

### 2.9 "No Flashcards to Study Today" Screen

- **Path:** `/learn` (displayed when `GET /api/v1/learning/today` returns empty array)
- **Purpose:** Inform user there are no flashcards available for review and provide CTAs.
- **Key Information:**
  - Clear message: "No flashcards to review today"
  - Explanation: "All your flashcards are up to date, or you haven't created any yet"
  - CTAs: "Generate Flashcards", "Create Manual Flashcard", "View My Flashcards"
- **Key View Components:**
  - Empty state illustration or icon
  - Message text
  - CTA buttons
  - Link back to dashboard
- **UX Considerations:**
  - Friendly, encouraging tone
  - Clear next steps
  - Visual hierarchy with primary CTA (Generate)
- **Accessibility Considerations:**
  - Screen reader announcement of empty state
  - Keyboard navigation to CTAs
- **Security Considerations:**
  - Same authentication requirements as learning session

### 2.10 Login

- **Path:** `/login`
- **Purpose:** Authenticate existing users.
- **Key Information:**
  - Email input field
  - Password input field
  - "Login" button
  - Link to registration page
  - Link to password reset
- **Key View Components:**
  - Login form
  - Validation error messages
  - Loading state during authentication
  - Success redirect to dashboard
  - Error toast for invalid credentials
- **UX Considerations:**
  - Auto-focus on email field
  - "Show password" toggle
  - Remember me option (optional)
  - Clear error messages (generic, not revealing if email exists)
- **Accessibility Considerations:**
  - Form labels and error associations
  - Keyboard navigation
  - Aria-live region for error announcements
- **Security Considerations:**
  - HTTPS only
  - Secure password handling (no client-side logging)
  - Rate limiting on failed attempts
  - Session cookie security (HttpOnly, Secure, SameSite)

### 2.11 Registration

- **Path:** `/register`
- **Purpose:** Create new user accounts.
- **Key Information:**
  - Email input field
  - Password input field (with strength indicator)
  - Password confirmation field
  - Terms and Conditions checkbox (required)
  - Privacy Policy checkbox (required)
  - "Register" button
  - Link to login page
- **Key View Components:**
  - Registration form
  - Password strength indicator
  - Checkboxes for terms and privacy policy (with links)
  - Validation error messages
  - Success message and redirect to login
- **UX Considerations:**
  - Real-time password validation
  - Clear requirements display
  - Links to terms and privacy policy (open in new tab)
  - Confirmation before submission
- **Accessibility Considerations:**
  - Form labels and error associations
  - Checkbox labels properly linked
  - Screen reader announcements
- **Security Considerations:**
  - Email format validation
  - Password strength requirements
  - Server-side validation
  - GDPR compliance (explicit consent)

### 2.12 Password Reset

- **Path:** `/reset-password`
- **Purpose:** Reset forgotten passwords via email token.
- **Key Information:**
  - Token input field (from email link)
  - New password field
  - Password confirmation field
  - "Reset Password" button
- **Key View Components:**
  - Reset form
  - Token validation
  - Success message and redirect to login
  - Error handling (invalid/expired token)
- **UX Considerations:**
  - Clear instructions
  - Auto-fill token from URL if possible
- **Accessibility Considerations:**
  - Standard form accessibility practices
- **Security Considerations:**
  - Token expiration validation
  - Secure password requirements
  - One-time use tokens

### 2.13 Account Settings / Delete Account

- **Path:** `/settings` (optional, or integrated into dashboard)
- **Purpose:** Manage account settings and delete account (GDPR compliance).
- **Key Information:**
  - Account information (email, created date)
  - Delete account section with confirmation
- **Key View Components:**
  - Settings form
  - Delete account button with confirmation modal
  - Warning messages about data deletion
- **UX Considerations:**
  - Clear warnings about permanent deletion
  - Confirmation required (type "DELETE" or similar)
  - Success message and redirect to login
- **Accessibility Considerations:**
  - Clear warnings for screen readers
  - Keyboard navigation
- **Security Considerations:**
  - Re-authentication before deletion (optional but recommended)
  - Permanent data deletion (GDPR right to be forgotten)
  - Confirmation to prevent accidental deletion

## 3. User Journey Map

### 3.1 Main Learning Flow

1. **User logs in** → Redirected to `/dashboard`
2. **Dashboard displays** → Shows count of cards available for review today (fetched from `GET /api/v1/learning/today?limit=50`)
3. **User clicks "Start Learning"** → Navigates to `/learn`
4. **Learning session initializes:**
   - Client fetches cards via `GET /api/v1/learning/today?limit=50`
   - If `count === 0`: Display empty state (Section 2.9)
   - If `count > 0`: Display first card with question visible
5. **User reviews flashcard:**
   - Question is displayed
   - User clicks "Show Answer" → Answer becomes visible
   - User selects one of four ratings: Again, Hard, Good, or Easy
   - Client sends `POST /api/v1/learning/review` with `{ flashcardId, rating }`
   - Server updates schedule and returns updated schedule data
   - Client receives response and moves to next card
6. **Session continues:**
   - Repeat step 5 for each card
   - Progress indicator updates (e.g., "Card 3 of 15")
   - Cards are consumed from the initial fetch; when queue is empty, fetch more via `GET /api/v1/learning/today?limit=50`
7. **Session ends:**
   - When no more cards available (all reviewed or daily limit reached)
   - Display session summary (Section 2.8) with:
     - Total cards reviewed
     - Approximate duration
     - Optional: Rating breakdown
   - User can click "Back to Dashboard" or "Review More" (if available)
8. **User returns to dashboard** → Updated card count reflects completed reviews

### 3.2 Alternative Learning Entry Points

- **From Dashboard:** Direct "Start Learning" button (primary flow)
- **From Flashcard List:** "Review Now" button on individual flashcards (if due)
- **From Generation/Acceptance:** After accepting flashcards, prompt "Start Learning?" (optional)

### 3.3 Learning Session Edge Cases

- **Empty state:** User has no cards → Display empty state with CTAs to generate/create
- **All cards reviewed:** User completes all due cards → Show summary, suggest creating more
- **Daily limit reached:** User hits 50 new cards limit → Continue with due cards only, show message about limit
- **Network interruption:** Show retry option, preserve session state where possible
- **Session timeout:** Redirect to login, preserve progress (if possible) or allow resume

### 3.4 Integration with Other Flows

- **After AI Generation:** User accepts flashcards → Option to "Start Learning" with new cards
- **After Manual Creation:** User creates flashcard → Option to "Start Learning" immediately
- **From Flashcard Edit:** User edits flashcard → No direct learning entry (return to list)

## 4. Layout and Navigation Structure

### 4.1 Global Navigation

- **Header Component** (present on all authenticated pages):
  - Logo/Brand name (links to dashboard)
  - Navigation menu:
    - Dashboard (home icon)
    - My Flashcards (list icon)
    - Generate (sparkles/AI icon)
    - Learn (book/study icon) - shows badge with card count if > 0
  - User menu (dropdown):
    - Account Settings (if implemented)
    - Logout
  - **Mobile:** Hamburger menu with same options

### 4.2 Navigation Patterns

- **Primary Navigation:** Header menu for main sections
- **Breadcrumbs:** Optional for deep pages (e.g., Flashcards > Edit)
- **Back Buttons:** Contextual back buttons on forms and detail pages
- **CTA Buttons:** Repeated CTAs on dashboard for quick access

### 4.3 Route Protection

- **Public Routes:** `/login`, `/register`, `/reset-password`
- **Protected Routes:** All other routes require authentication
- **Redirect Logic:** Unauthenticated users → `/login`; Authenticated users accessing `/login` → `/dashboard`

### 4.4 Mobile Navigation

- **Hamburger Menu:** Slide-out or dropdown menu on mobile
- **Bottom Navigation Bar:** Optional sticky bottom bar on mobile with main actions (Dashboard, Learn, Generate)
- **Touch Targets:** Minimum 44x44px for all interactive elements

## 5. Key Components

### 5.1 FlashcardCard Component

- **Purpose:** Displays a single flashcard (question/answer) in learning and acceptance flows
- **Props:** `question`, `answer`, `showAnswer` (boolean), `onShowAnswer` (callback)
- **Features:** Collapsible answer, responsive sizing, accessible markup
- **Usage:** Learning session, AI acceptance flow, flashcard list preview

### 5.2 RatingButtons Component

- **Purpose:** Four-button rating interface for learning session
- **Props:** `onRate` (callback with rating: "again" | "hard" | "good" | "easy"), `disabled` (boolean)
- **Features:** Large touch targets, color-coded buttons, keyboard shortcuts, aria-labels
- **Usage:** Learning session (`/learn`)

### 5.3 ProgressIndicator Component

- **Purpose:** Shows progress through a session or list
- **Props:** `current` (number), `total` (number), `label` (optional string)
- **Features:** Visual progress bar, text counter, accessible announcements
- **Usage:** Learning session, AI acceptance flow, paginated lists

### 5.4 EmptyState Component

- **Purpose:** Displays when no data is available with helpful CTAs
- **Props:** `title`, `message`, `actions` (array of CTA buttons)
- **Features:** Illustration/icon, clear messaging, actionable buttons
- **Usage:** No flashcards to review, empty flashcard list, no search results

### 5.5 SessionSummary Component

- **Purpose:** Displays learning session completion statistics
- **Props:** `cardsReviewed` (number), `duration` (number, seconds), `ratingBreakdown` (optional object)
- **Features:** Celebratory design, clear statistics, action buttons
- **Usage:** End of learning session

### 5.6 LoadingSpinner Component

- **Purpose:** Indicates loading/processing state
- **Props:** `size` ("sm" | "md" | "lg"), `message` (optional string)
- **Features:** Accessible spinner, optional text message, consistent styling
- **Usage:** API calls, page loads, form submissions

### 5.7 ToastNotification Component

- **Purpose:** Displays temporary success/error messages
- **Props:** `type` ("success" | "error" | "info"), `message`, `duration` (optional)
- **Features:** Auto-dismiss, manual close, aria-live announcements, stacking support
- **Usage:** Form submissions, API errors, validation feedback

### 5.8 ConfirmationModal Component

- **Purpose:** Confirms destructive actions
- **Props:** `title`, `message`, `confirmLabel`, `cancelLabel`, `onConfirm`, `onCancel`, `variant` ("danger" | "warning")
- **Features:** Focus trap, keyboard navigation (Escape to cancel, Enter to confirm), accessible markup
- **Usage:** Delete flashcard, delete account, exceed character limit

### 5.9 CharacterCounter Component

- **Purpose:** Shows character count and limit for text inputs
- **Props:** `current` (number), `max` (number), `showWarning` (boolean, default: within 10% of limit)
- **Features:** Visual warning near limit, aria-live updates, color coding
- **Usage:** Text generation input, manual flashcard creation/edit forms

### 5.10 FilterChips Component

- **Purpose:** Filter selection interface for flashcard list
- **Props:** `options` (array), `selected` (array), `onChange` (callback), `multiSelect` (boolean)
- **Features:** Accessible button group, keyboard navigation, clear visual selection
- **Usage:** Flashcard list filters (Source: AI/Manual, Status: Active/Deleted)

## 6. User Story to UI Element Mapping

### US-001: Account Registration
- **UI Elements:** Registration form (`/register`), email/password fields, terms checkboxes, validation messages
- **Components:** Form inputs, CharacterCounter (for password), ConfirmationModal (for terms)

### US-002: Login
- **UI Elements:** Login form (`/login`), email/password fields, "Login" button, link to register
- **Components:** Form inputs, ToastNotification (for errors)

### US-003: Logout and Session Expiration
- **UI Elements:** Logout button in header user menu, automatic redirect to `/login` on expiration
- **Components:** User menu dropdown, ToastNotification (session expired message)

### US-004: Account Deletion (GDPR)
- **UI Elements:** Delete account button in settings, ConfirmationModal with warning
- **Components:** ConfirmationModal, ToastNotification (success message)

### US-005: Pasting Text for Generation
- **UI Elements:** Textarea on `/generate`, CharacterCounter, "Generate" button
- **Components:** CharacterCounter, LoadingSpinner, ToastNotification

### US-006: Single Flashcard View (AI)
- **UI Elements:** FlashcardCard on `/accept`, question/answer display, Accept/Reject buttons
- **Components:** FlashcardCard, ProgressIndicator

### US-007: Accepting an AI Flashcard
- **UI Elements:** "Accept" button on `/accept`, success feedback, automatic next card
- **Components:** FlashcardCard, ToastNotification, LoadingSpinner

### US-008: Rejecting an AI Flashcard
- **UI Elements:** "Reject" button on `/accept`, automatic next card (no return possible)
- **Components:** FlashcardCard

### US-009: Generation Error and Retry
- **UI Elements:** Error ToastNotification, "Retry" button, error message display
- **Components:** ToastNotification, LoadingSpinner

### US-010: Manual Flashcard Creation
- **UI Elements:** Form on `/flashcards/new`, question/answer fields, "Save" button
- **Components:** Form inputs, CharacterCounter, ToastNotification

### US-011: Editing a Saved Flashcard
- **UI Elements:** Form on `/flashcards/edit/:id`, pre-filled fields, "Save" button
- **Components:** Form inputs, CharacterCounter, ToastNotification, LoadingSpinner

### US-012: Deleting a Flashcard
- **UI Elements:** Delete button in flashcard list, ConfirmationModal
- **Components:** ConfirmationModal, ToastNotification

### US-013: Starting a Learning Session
- **UI Elements:** "Start Learning" button on dashboard, card count display, `/learn` page initialization
- **Components:** LoadingSpinner, EmptyState (if no cards), FlashcardCard (first card)

### US-014: Revealing the Answer and Evaluation
- **UI Elements:** "Show Answer" button, answer display, RatingButtons (Again, Hard, Good, Easy)
- **Components:** FlashcardCard, RatingButtons, LoadingSpinner (during API call)

### US-015: Ending the Learning Session
- **UI Elements:** SessionSummary component, statistics display, "Back to Dashboard" button
- **Components:** SessionSummary, ProgressIndicator

### US-016: Privacy Protection and Consents
- **UI Elements:** Terms and Privacy checkboxes on registration form, links to documents
- **Components:** Form checkboxes with links

### US-017: Minimum UI Accessibility Requirements
- **UI Elements:** Applied across all views (aria-labels, keyboard navigation, screen reader support)
- **Components:** All components include accessibility features

### US-018: Internal Event Analytics
- **UI Elements:** No user-facing UI (internal only, as per requirements)

### US-019: Cost/Limit Preview per Session (Internal)
- **UI Elements:** No user-facing UI (internal only, as per requirements)

### US-020: Integration with Repetition Algorithm (Technical)
- **UI Elements:** RatingButtons trigger API calls that update schedule server-side
- **Components:** RatingButtons, backend SRS service integration

### US-021: Network Error Handling
- **UI Elements:** ToastNotification for errors, retry buttons where applicable
- **Components:** ToastNotification, error states in all API-calling components

### US-022: Manual Import from Notes (copy-paste)
- **UI Elements:** Textarea on `/generate`, character limit handling, ConfirmationModal for limit exceeded
- **Components:** CharacterCounter, ConfirmationModal

### US-023: Information about Lack of Flashcards to Study
- **UI Elements:** EmptyState on `/learn` when no cards available, CTAs to generate/create
- **Components:** EmptyState

## 7. Edge Cases and Error States

### 7.1 Learning Session Edge Cases

- **No cards available:** EmptyState component with CTAs
- **Network error fetching cards:** ToastNotification with retry button
- **Network error submitting rating:** ToastNotification with retry, preserve current card state
- **Session expired during learning:** Redirect to login with message, attempt to preserve progress
- **Daily new card limit reached:** Continue session with due cards only, show informational message
- **Card deleted during session:** Skip to next card, show ToastNotification
- **Concurrent sessions:** Last rating wins (handled by stateless design)

### 7.2 Generation Edge Cases

- **Character limit exceeded:** ConfirmationModal with "Shorten" and "Cancel" options
- **Generation timeout:** ToastNotification with retry option
- **API error:** ToastNotification with error message and retry
- **Empty text submission:** Disabled button, validation message

### 7.3 Authentication Edge Cases

- **Invalid credentials:** Generic error message (doesn't reveal if email exists)
- **Session expired:** Automatic redirect to login
- **Network error during login:** ToastNotification with retry
- **Email already registered:** Validation error on registration form

### 7.4 Flashcard Management Edge Cases

- **Flashcard not found (404):** Error message, redirect to list
- **Unauthorized access:** Redirect to login
- **Validation errors:** Inline form validation messages
- **Delete confirmation:** ConfirmationModal before deletion

## 8. Security Considerations

### 8.1 Authentication and Authorization

- All protected routes require valid session cookie
- Server-side validation of user ownership for all flashcard operations
- RLS policies enforce data isolation at database level
- Session cookies: HttpOnly, Secure, SameSite=Lax

### 8.2 Input Validation

- Client-side validation for UX (immediate feedback)
- Server-side validation for security (all inputs validated)
- Input sanitization before database operations
- Character limits enforced on both client and server

### 8.3 Data Protection

- No sensitive data in client-side code or URLs
- HTTPS for all communications
- Secure password handling (no logging, proper hashing server-side)
- GDPR compliance: explicit consent, account deletion capability

### 8.4 Rate Limiting

- API rate limiting on generation and review endpoints (server-side)
- User feedback when rate limits are hit
- Graceful degradation

## 9. Accessibility Considerations

### 9.1 Keyboard Navigation

- All interactive elements keyboard accessible
- Logical tab order
- Keyboard shortcuts for common actions (learning session ratings)
- Focus indicators visible and clear

### 9.2 Screen Reader Support

- Semantic HTML structure
- Aria-labels on all interactive elements
- Aria-live regions for dynamic content updates
- Proper heading hierarchy
- Form labels and error associations

### 9.3 Visual Accessibility

- High contrast ratios (WCAG AA minimum)
- Color not sole indicator of state
- Touch targets minimum 44x44px
- Responsive text sizing
- Focus indicators

### 9.4 Mobile Accessibility

- Touch-friendly interface (mobile-first design)
- Responsive layout works with screen readers
- Gesture alternatives for all actions
- Proper viewport configuration

## 10. Performance Considerations

### 10.1 Loading States

- LoadingSpinner for all async operations
- Skeleton screens for list loading
- Optimistic UI updates where appropriate
- Progressive loading of flashcard lists

### 10.2 API Optimization

- Batch operations where possible
- Efficient pagination
- Caching of today's card count on dashboard
- Debouncing of search/filter inputs

### 10.3 Client-Side Optimization

- Code splitting for routes
- Lazy loading of components
- Image optimization
- Minimal JavaScript bundle size
