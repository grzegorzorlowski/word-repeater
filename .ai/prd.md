# Product Requirements Document (PRD) - WordRepeater AI

## 1. Product Overview

WordRepeater AI is a responsive web application (mobile-first) that allows for the rapid creation of educational flashcards from pasted text and learning them based on a simple spaced repetition algorithm. The MVP provides both automatic (AI) and manual flashcard creation, a basic user account system, and generation limits. The product aims to lower the time barrier to creating high-quality flashcards and increase the adoption of the spaced repetition learning method.

The MVP scope includes: generating flashcards from text (up to 5000 characters), manual creation, viewing/editing/deleting, integration with a simple, ready-made spaced repetition algorithm, and a "one flashcard at a time" acceptance flow without editing before acceptance.

## 2. User Problem

Creating flashcards manually is time-consuming and tedious, discouraging systematic learning using the spaced repetition method. Users want to quickly transform content (articles, notes) into concise, relevant question-and-answer pairs, and then review them at appropriate intervals, without having to learn complicated tools and configurations. The lack of a simple, fast generator of acceptable quality and simple repetition mechanisms limits the effectiveness of learning and maintaining the habit.

## 3. Functional Requirements

3.1. Flashcard Generation (AI)

1. RF-001: The user can paste input text up to 5000 characters.
2. RF-002: The application validates the length. If >5000 characters, it offers two options: shorten to the first 5000 characters or cancel (without losing the original text in the input field).
3. RF-003: The system generates flashcard suggestions (Q/A) based on the content and thematic analysis, as well as keywords (in prompts) within ≤10 seconds (90th percentile).
4. RF-004: Flashcards are presented individually in a "one flashcard at a time" flow.
5. RF-005: For each flashcard, the user selects: Accept or Reject. In the MVP, there is no editing before acceptance.
6. RF-006: Rejected flashcards cannot be restored (no possibility of return in the MVP).
7. RF-007: After acceptance, the flashcard is added to the user's deck and included in the review schedule.

3.2. Manual creation and management of flashcards 8) RF-009: The user can manually create a flashcard (question, answer) in a supported language. 9) RF-010: The user can view a list of their own flashcards (filters: created by AI/manually; status in the schedule). 10) RF-011: The user can edit the content of the question and answer of an already saved flashcard. 11) RF-012: The user can delete a flashcard (with confirmation), which removes it from the review schedule.

3.3. Learning and repetitions
12) RF-013: Use the SRS service abstraction (in `src/lib/srsService.ts`) wrapping the ts-fsrs library to schedule reviews with four rating options (`again`, `hard`, `good`, `easy`).
13) RF-014: The user starts a learning session to review due cards and up to 50 new cards (where `repetition_count = 0`), with new-card selection capped at 50 per session; due reviews are unlimited.
14) RF-015: After the question is displayed, the user can reveal the answer and select one of the four ratings.
15) RF-016: After each review, the schedule is updated using the SRS service; after the session ends, progress is saved server-side.

3.4. Accounts and Security 16) RF-017: Registration and login (email + password). Basic password and email validation. 17) RF-018: Password reset via email. 18) RF-019: Session authentication (token/cookie) and automatic logout after a period of inactivity. 19) RF-020: Basic privacy and compliance requirements (GDPR): acceptance of terms and conditions and privacy policy upon registration; ability to delete the account (right to be forgotten).

3.5. Limits, Messages and Exceptional States 20) RF-022: Message and choice when exceeding the 5000 character limit (shorten/cancel), indicating the number of characters. 21) RF-023: Notification of generation errors (time exceeded, network error, model error) and the possibility to retry.

3.6. Internal Analytics (without user panel) 22) RF-024: Collection of internal metrics: % of AI flashcard acceptance, % of flashcards created by AI, generation time (P90), number of repetitions per day/week, session cost. 23) RF-025: Analytical events: generation start, generation result (n successes/rejections), learning session end, exceeding limits.

3.7. Language and Localization 24) RF-026: The application UI can only be in English in the MVP.

3.8. Non-functional (MVP) 25) RNF-001: Generation time ≤10 s (90th percentile) at target MVP load. 26) RNF-002: Generation cost as low as possible 27) RNF-003: Basic availability (e.g., 99% during 8 AM–10 PM CET in MVP). 28) RNF-004: Data security: data encryption in transit (HTTPS), passwords stored using modern hashing functions (e.g., bcrypt/argon2). Minimum GDPR compliance: consent, data access, account deletion.

## 4. Product Boundaries

4.1. In scope (MVP)

- Generating AI flashcards from pasted text (up to 5000 characters).
- Manual creation, viewing, editing, and deletion.
  flashcards.
- Simple user account and session system (email/password, password reset).
- Integration with a simple, ready-made repetition algorithm (no difficulty levels in MVP).
- Internal analytics (no statistics panel in the user UI).

  4.2. Out of scope (MVP)

- Advanced, custom repetition algorithms (e.g., full SM-2/Anki/SM-18).
- Importing multiple formats (PDF/DOCX, etc.) – only copy-paste in MVP.
- Sharing decks, publications, and collaboration between users.
- Integrations with external educational platforms.
- Native mobile applications (only responsive web).
- Editing flashcards before acceptance (planned after MVP).
- User statistics panels (only internal analytics).

  4.3. Assumptions and limitations

- One content language (EN) in MVP, possibility of expansion in the future.
- Acceptance flow "one flashcard at a time", no return to rejected ones.
- Pre-beta testing is exclusively internal (1-2 people).
- Analytics/audit for SRS functionality are out of scope for MVP.
- Global SRS parameters are hard-coded with no per-user settings.
- Daily cap of 50 new cards applies only to flashcards with repetition_count = 0; reviews of due cards are unlimited.

## 5. User Stories

US-001 — Account Registration
Description: As a new user, I want to create an account using email and password so that I can save flashcards and progress.
Acceptance Criteria:

- The form enforces correct email format and minimum password requirements.
- After registration, the user sees a confirmation and is asked to log in.
- Agreement to the terms and conditions and privacy policy is required.

US-002 — Login
Description: As a user, I want to log in to my account to access my flashcards and repetitions.
Acceptance Criteria:

- Correct credentials log in; - Incorrectly displays a message without revealing whether the email exists.
- The session is maintained until logout or expiration.
- the login page should consist link to register page;

US-003 — Logout and session expiration
Description: As a user, I want to be able to log out.
Acceptance criteria:

- Logout button available in the menu.
- When user logout or before login in, every other page should redirect to login page.

US-004 — Account deletion (GDPR)
Description: As a user, I want to delete my account and all associated data.
Acceptance criteria:

- Delete account option with confirmation.
- After deletion, flashcards and schedules are permanently deleted.

US-005 — Pasting text for generation
Description: As a user, I want to paste text (EN) and generate flashcards.
Acceptance criteria:

- The text field counts characters and displays a counter.
- The Generate button is active when the text is not empty and within the limit.

US-006 — Single flashcard view (AI)
Description: As a user, I want to see one flashcard suggestion at a time to focus on the decision.
Acceptance criteria:

- The screen shows the question and a collapsible answer or question + answer.
- Accept/Reject buttons are available.

US-007 — Accepting an AI flashcard
Description: As a user, I want to accept a relevant flashcard and add it to my deck.
Acceptance criteria:

- After accepting, the flashcard is saved and added to the schedule.
- The next suggestion is displayed or a message indicating no more suggestions is shown.

US-008 — Rejecting an AI flashcard
Description: As a user, I want to reject an irrelevant flashcard and move on. Acceptance Criteria:

- After rejecting, the flashcard is not saved and cannot be returned to in the MVP.

US-009 — Generation Error and Retry
Description: As a user, I want to be able to retry generation after an error, if I have available limits.
Acceptance Criteria:

- In case of an error, a message and a "Retry" button are displayed.
- Retrying does not exceed the limits; if the limit is exhausted, a message about the lack of available generations appears.

US-010 — Manual Flashcard Creation
Description: As a user, I want to manually add a question and answer.
Acceptance Criteria:

- The form requires non-empty question and answer content.
- After saving, the flashcard appears in the list and in the schedule.

US-011 — Editing a Saved Flashcard
Description: As a user, I want to edit an existing flashcard.
Acceptance Criteria:

- Editing allows changing the question/answer.
- Saving updates the content and does not reset the repetition history (unless the change is critical – MVP: does not reset).

US-012 — Deleting a Flashcard
Description: As a user, I want to delete a flashcard from my deck.
Acceptance Criteria:

- Deletion requires confirmation.
- The flashcard disappears from the list and the schedule.

US-013 — Starting a Learning Session
Description: As a user, I want to start learning the flashcards scheduled for today.
Acceptance Criteria:

- The screen shows the number of flashcards to learn today and a "Start" button.
- After starting, the flashcards are displayed one by one. US-014 — Revealing the answer and evaluation
  Description: As a user, I want to reveal the answer and mark the result so that the algorithm determines the next review date.
  Acceptance criteria:
- After clicking "Show answer," the options `again`, `hard`, `good`, and `easy` are available.
- The selection updates the schedule according to the algorithm.

US-015 — Ending the learning session
Description: As a user, I want to end the session and see a summary of it (number of flashcards reviewed).
Acceptance criteria:

- A summary appears: number of flashcards, duration (approximate).
- Progress is saved, and unfinished flashcards remain for today.

US-016 — Privacy protection and consents
Description: As a user, I want to read the terms and conditions and privacy policy and give my consent.
Acceptance criteria:
Acceptance Criteria:

- Links to documents are available during registration.
- An account cannot be created without checking the consent box.

US-017 — Minimum UI Accessibility Requirements
Description: As a mobile user, I want a convenient mobile-first interface.
Acceptance Criteria:

- Responsive UI, keyboard navigable, and with labels for screen readers (aria-labels) in critical areas.
- Touch elements meet minimum size requirements.

US-018 — Internal Event Analytics
Description: As a product owner, I want to collect metrics to measure quality and costs.
Acceptance Criteria:

- The following events are recorded: start/end of generation, acceptance/rejection, start/end of learning session.
- Data is available in an internal analytics tool (without UI in the user application).

US-019 — Cost/Limit Preview per Session (Internal)
Description: As a team, we want to monitor the cost of generation per session.
Acceptance Criteria:

- Unit cost per session and the number of tokens/execution time are recorded (internally).

US-020 — Integration with Repetition Algorithm (Technical)
Description: As a system, I want to schedule the next date based on the user's response result.
Acceptance Criteria:

- For each rating (`again`, `hard`, `good`, `easy`), the schedule is calculated deterministically by the ts-fsrs library via the SRS service abstraction; the underlying library can be swapped through the abstraction layer.
- Changing the library is possible through an abstraction layer.

US-021 — Network Error Handling
Description: As a user, I want clear messages in case of network/server errors.
Acceptance Criteria:

- Messages do not reveal technical details.
- A refresh or retry button is available if possible. US-022 — Manual import from notes (copy-paste)
  Description: As a user, I want to quickly paste a longer text and get several flashcards.
  Acceptance criteria:
- Works for text up to 5000 characters; above that – a shortening modal appears.
- Presentation of suggestions in a series, one flashcard at a time.

US-023 — Information about the lack of flashcards to study
Description: As a user, I want to know that I don't have any flashcards to study today.
Acceptance criteria:

- The screen displays a message and suggests generating/creating new flashcards.

## 6. Success Metrics

1. 75% of AI-generated flashcards accepted by users (measured as: accepted / all suggested in AI sessions).
2. 75% of all created flashcards come from AI (calculated per user and globally over a period of time).
3. Generation time P90 ≤ 10 s.
4. Average generation cost ≤ 0.20 PLN/session.
5. Learning activity: median ≥ X flashcards reviewed per active day (internal; target to be determined during beta).
6. 7-day and 30-day retention (measured internally; targets to be determined after the first month of beta).
