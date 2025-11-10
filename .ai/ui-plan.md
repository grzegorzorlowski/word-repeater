# UI Architecture for WordRepeater AI

## 1. Overview of UI Structure
The UI architecture follows a **mobile-first** approach with a responsive layout and simple navigation. Main views: Dashboard, Flashcard Generation, AI Flashcard Acceptance, Flashcard List, Manual Creation/Edit, Learning Session, Exceptional State Screens, Login/Registration. Design system: Tailwind + Shadcn/ui, consistent components (buttons, chips, loader, modals).

## 2. List of Views

### 2.1 Dashboard
- **Path:** `/dashboard`
- **Purpose:** Central hub with main CTAs.
- **Key Information:** Number of flashcards for today, CTAs: Generate, My Flashcards, Start Learning.
- **Components:** Header, CTA buttons, flashcard counter, loader.
- **UX/Accessibility:** Large buttons, aria-labels, high contrast.

### 2.2 Flashcard Generation
- **Path:** `/generate`
- **Purpose:** Enter text and generate flashcards.
- **Key Information:** Text field, character counter, “Generate” button.
- **Components:** Textarea, counter, button, loader, error toast.
- **Security:** Limit validation, HTTPS.

### 2.3 AI Flashcard Acceptance
- **Path:** `/accept`
- **Purpose:** Accept/Reject decision for each flashcard.
- **Key Information:** Question + answer, large buttons.
- **Components:** Fullscreen card, Accept/Reject buttons, loader.
- **UX:** Simple navigation, no editing before acceptance.

### 2.4 Flashcard List
- **Path:** `/flashcards`
- **Purpose:** Browse all flashcards.
- **Key Information:** Pagination, filters (AI/manual).
- **Components:** Table/list, chips, pagination, delete/edit modals.
- **UX:** “No data” message when no flashcards exist.

### 2.5 Manual Creation/Edit
- **Path:** `/flashcards/new` / `/flashcards/edit/:id`
- **Purpose:** Add or edit flashcards.
- **Components:** Form fields, save button, validation.

### 2.6 Learning Session
- **Path:** `/learn`
- **Purpose:** Learn flashcards scheduled for today.
- **Key Information:** Number of flashcards, Show Answer, Remembered/Don’t Remember.
- **Components:** Card view, buttons, loader, summary screen.

### 2.7 “No Flashcards to Study Today” Screen
- **Path:** `/learn/empty`
- **Purpose:** Inform user there are no flashcards + CTA.
- **Components:** Message, CTA buttons.

### 2.8 Login/Registration
- **Path:** `/login`, `/register`
- **Purpose:** User authentication.
- **Components:** Form fields, validation, links to policies.

## 3. User Journey Map
1. User logs in → Dashboard.
2. Chooses “Generate” → enters text → generates → accepts/rejects flashcards.
3. Alternatively: creates manually → flashcard list.
4. Starts learning session → reviews flashcards → marks Remembered/Don’t Remember → summary.
5. If no flashcards → “No flashcards” screen with CTA.
6. Dashboard -> view flashcards -> possiblity to modify them

## 4. Layout and Navigation Structure
- **Header:** Dashboard, Flashcards, Generate, Learn, Logout.
- **Mobile:** Hamburger menu.
- **Repeated CTAs:** Dashboard + global menu.

## 5. Key Components
- **Loader:** Spinner/skeleton for generation and learning.
- **Toast:** Error and success messages.
- **Chips:** Flashcard source filters.
- **Pagination:** Previous/Next.
- **Modal:** Confirmations (delete, limit exceeded).
- **Form fields:** With validation and aria-labels.