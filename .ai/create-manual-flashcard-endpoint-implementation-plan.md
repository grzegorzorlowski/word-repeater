# View Implementation Plan [Manual Flashcard]

## 1. Overview

This view provides functionality for manually creating and editing flashcards. Users can enter a question and an answer into form fields, then save the flashcard. On creation, the new flashcard is added to the flashcard list and scheduled for review. In edit mode, existing flashcard data is loaded for modification. Client-side validation ensures that both fields are non-empty and within specified character limits.

## 2. View Routing

- **Creation:** Accessible at `/flashcards/new`
- **Editing:** Accessible at `/flashcards/edit/:id`

## 3. Component Structure

- **ManualFlashcardPage**
  - Container component that conditionally loads either the creation form or the edit form based on the route.
- **ManualFlashcardForm**
  - Form component that renders input fields for the question and answer along with a save button.
  - Displays validation errors and manages local form state.
- **Loader**
  - Visual spinner shown during API calls or data fetching.
- **ErrorNotification**
  - Component to display error messages to the user.

## 4. Component Details

### ManualFlashcardPage

- **Component Description:**
  - Acts as the page container. Determines whether the view is in create mode or edit mode and initializes data accordingly (e.g., fetch existing flashcard data for editing).
- **Main Elements:**
  - Conditional rendering of `ManualFlashcardForm` and usage of `Loader` during API data loading.
- **Handled Interactions:**
  - On mount, if in edit mode, triggers data fetch based on flashcard ID from the URL.
- **Types:**
  - Uses a ViewModel type (e.g., `FlashcardFormViewModel`) to manage loading, error, and flashcard data.
- **Props:**
  - Receives route parameters (e.g., `id`) when in edit mode.

### ManualFlashcardForm

- **Component Description:**
  - Provides a form with input fields for `question` and `answer` along with a Save button.
- **Main Elements:**
  - `<input>` or `<textarea>` fields for entering question and answer.
  - A Save button using Shadcn/ui styled button.
  - Inline error messages for failed validation.
- **Handled Interactions:**
  - `onChange` events for updating form state.
  - `onSubmit` for saving the flashcard.
- **Handled Validation:**
  - Both fields must have non-empty values.
  - `question` maximum length 300 characters.
  - `answer` maximum length 500 characters.
- **Types:**
  - Uses a DTO from the types file (`CreateManualFlashcardCommand`).
  - ViewModel for form state may include: `question: string`, `answer: string`, `loading: boolean`, `error: string | null`.
- **Props:**
  - For edit mode, initial values are passed via props.
  - A callback function to signal successful save.

### Loader

- **Component Description:**
  - Displays a spinner or progress indicator during API calls or data fetches.
- **Main Elements:**
  - A spinner element (using Shadcn/ui Loader or similar component).
- **Handled Interactions:**
  - Purely visual; toggled via a prop (`visible: boolean`).

### ErrorNotification

- **Component Description:**
  - Renders error messages received from API calls or client-side validations.
- **Main Elements:**
  - A styled `<div>` or alert component with error text.
- **Handled Interactions:**
  - May include a retry mechanism in case of API errors (optional).
- **Props:**
  - `message: string`

## 5. Types

### CreateManualFlashcardCommand (from types.ts)

- **Fields:**
  - `question: string` – Non-empty string with a maximum of 300 characters.
  - `answer: string` – Non-empty string with a maximum of 500 characters.
  - `metadata?: Record<string, unknown>` – Optional metadata (e.g., tags).

### CreateManualFlashcardResponseDTO (from types.ts)

- **Fields:**
  - `message: string` – Confirmation message.
  - `flashcard: { id: string; content: string; created_at: string }` – Summary of the created flashcard.

### FlashcardFormViewModel (new)

- **Fields:**
  - `question: string`
  - `answer: string`
  - `loading: boolean`
  - `error: string | null`
  - In edit mode, an additional field `id?: string` to hold the flashcard identifier.

## 6. State Management

- **Local Form State:**
  - Manage the values for `question` and `answer` using React’s `useState`.
- **Form Validation State:**
  - Track error messages for invalid inputs.
- **Loading State:**
  - Boolean state to display `Loader` while waiting for API responses.
- **Custom Hook (useFlashcardForm):**
  - Encapsulates logic for form state management, input validations, API submission, and handling success/error states.
  - In edit mode, triggers a fetch to load existing flashcard data.

## 7. API Integration

- **Endpoint:** `/api/flashcards`
- **HTTP Method:** POST (for creation)
- **Request Payload:**

  {
  "question": "What is REST?",
  "answer": "Representational State Transfer",
  "metadata": { "tags": ["tech"] }
  }
  - **Response Payload:**

  {
  "message": "Flashcard created successfully",
  "flashcard": {
  "id": "UUID",
  "content": "...",
  "created_at": "ISO8601"
  }
  }
  - **Handling in the View:**
  - On form submission, validate inputs on the client.
  - Trigger the POST request and display a loader while the request is in progress.
  - On success, clear the form (or redirect) so the updated flashcard appears in the list view.
  - On error, display an error notification.

## 8. User Interactions

- **Input Fields:**
  - Users type in the question and answer. Real-time validation provides immediate feedback.
- **Save Button Click:**
  - When clicked, the form validates inputs; if valid, it initiates an API call.
- **Form Submission Success:**
  - User is either redirected back to the flashcard list or provided with success feedback.
- **Form Submission Failure:**
  - An error message is displayed and the user can correct inputs or retry the submission.

## 9. Conditions and Validation

- **Input Conditions:**
  - `question`: Must not be empty and cannot exceed 300 characters.
  - `answer`: Must not be empty and cannot exceed 500 characters.
- **API Conditions:**
  - The POST endpoint returns a 201 status code on success; any other status indicates an error.
- **Verification:**
  - Use client-side validations prior to API submission.
  - Display validation errors inline associated with each field.
  - Use the API response to update the view model on successful creation.

## 10. Error Handling

- **Validation Errors:**
  - Immediate inline error messages next to respective fields.
- **API Errors:**
  - Display errors using the `ErrorNotification` component.
  - Reset the loading state if an error occurs.
- **Data Fetching Errors (for Edit Mode):**
  - If fetching existing flashcard data fails, display an appropriate error message and optionally a retry button.
- **Unexpected Errors:**
  - Log errors internally and show a friendly error message to the user.

## 11. Implementation Steps

1. **Route Setup:**
   - Create two routes for creating and editing flashcards (e.g., `/flashcards/new` and `/flashcards/edit/[id].tsx`).

2. **Page Container Implementation (ManualFlashcardPage):**
   - Determine the mode (create or edit) based on URL parameters.
   - If in edit mode, fetch the existing flashcard data and populate the form.
   - Render the `ManualFlashcardForm` and conditionally display `Loader`/`ErrorNotification`.

3. **Form Component (ManualFlashcardForm):**
   - Build input fields for `question` and `answer` with appropriate placeholders and maximum length constraints.
   - Implement onChange handlers to update local state.
   - Implement an onSubmit handler that validates input and calls the API.
   - Display validation messages below each field if input is invalid.

4. **Custom Hook (useFlashcardForm):**
   - Develop a hook to manage form state, validations, and API integration.
   - Integrate API call using fetch or Axios for creating the flashcard.
   - Manage loading, success, and error states.

5. **API Integration:**
   - Ensure that the API call conforms to the endpoint’s expected JSON structure.
   - Handle success by updating the view state and triggering a redirect or notification.
   - Handle errors by updating the error state and showing the `ErrorNotification` component.

6. **Component Styling:**
   - Use Tailwind CSS and Shadcn/ui components to style inputs, buttons, loader, and notifications.
   - Ensure responsiveness and accessibility (aria-labels, proper contrast, touch-friendly sizes).

7. **Testing:**
   - Manually test the form, ensuring validation is triggered appropriately.
   - Test both success and error scenarios, especially for API responses.
   - Verify that in edit mode, the data loads correctly and updates are processed.

8. **Documentation:**
   - Document the new components and hooks for future developers to understand functionality and integration points.
