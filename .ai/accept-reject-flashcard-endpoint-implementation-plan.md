# View Implementation Plan [AI Flashcard Acceptance]

## 1. Overview

This view provides a fullscreen interface where users can either accept or reject AI-generated flashcards. It displays both the question and its corresponding answer and includes large, clearly labeled buttons for making a decision. The view communicates with the backend to persist accepted flashcards or discard rejected ones and shows appropriate loading and error states. In addition, the view leverages the "List User Flashcards" API to check for any pending flashcards that need user action. A link to this view is also made available from the dashboard, which directs users to review pending flashcards retrieved from the list API.

## 2. View Routing

The view is accessible at the path `/accept`.

## 3. Component Structure

- **AcceptFlashcardView** (Container Component)
  - **FullscreenCard**: Displays the flashcard content (question and answer).
  - **ActionButtons**: Contains two large buttons: Accept and Reject.
  - **Loader**: Indicates that an API call is in progress.
  - **ErrorNotification** (optional): Displays error messages if API calls fail.
  - **PendingFlashcardsChecker** (logic handled within the container): Fetches pending flashcards using the List User Flashcards API if the current flashcard suggestion from generate responses is exhausted.

## 4. Component Details

### AcceptFlashcardView

- **Component Description**:
  - Main container that orchestrates state management, API integration, and renders child components.
  - Integrates logic to fetch pending flashcards using the "List User Flashcards" API (with status set to pending) once all flashcards from the generate response have been processed.
- **Main HTML Elements and Child Components**:
  - A responsive container (e.g., a centered card layout) containing the flashcard display area.
  - Renders `FullscreenCard`, `ActionButtons`, `Loader`, and optionally `ErrorNotification`.
- **Handled Events**:
  - On component mount: Load the current flashcard suggestion if available; otherwise, fetch pending flashcards via GET `/api/flashcards` with status filter set to pending.
  - On Accept button click: Trigger API call with decision `accept` for the current flashcard.
  - On Reject button click: Trigger API call with decision `reject` for the current flashcard.
- **Validation Conditions**:
  - Verify that a valid flashcard is available (must have a valid flashcard ID).
  - Confirm the API response has a status of 200 OK before updating the state.
- **Types**:
  - Uses a custom view model (e.g., `AcceptFlashcardViewModel`) that tracks:
    - `flashcard`: an object with `id`, `question`, and `answer` or `null` when none is available.
    - `pendingFlashcards`: an array containing pending flashcard objects retrieved via the list API.
    - `loading`: a boolean indicating if an API call is underway.
    - `error`: a string (or null) containing any error message.
- **Props**: None (state is managed internally).

### FullscreenCard

- **Component Description**:
  - Presents the flashcard content in a fullscreen view with emphasis on readability.
- **Main HTML Elements and Child Components**:
  - A title or heading (if needed) and a display area for the question and answer.
- **Handled Events**:
  - Purely presentational; does not handle interaction events.
- **Validation Conditions**:
  - Ensure the flashcard's content (question and answer) is present and well formatted.
- **Types**:
  - Expects a flashcard object of the type: `{ id: string; question: string; answer: string }`.
- **Props**:
  - `flashcard`: the flashcard to be displayed.

### ActionButtons

- **Component Description**:
  - Provides two clear call-to-action buttons for accepting or rejecting the flashcard.
- **Main HTML Elements and Child Components**:
  - Two large buttons labeled “Accept” and “Reject”.
- **Handled Events**:
  - On button click, call a parent-provided callback function with the appropriate decision value.
- **Validation Conditions**:
  - Buttons are disabled when an API call is in progress (i.e., when the loading state is `true`).
- **Types**:
  - Props: `{ onDecision: (decision: 'accept' | 'reject') => void, disabled: boolean }`.

### Loader

- **Component Description**:
  - Displays a spinner or similar indicator to show that an API operation is in progress.
- **Main HTML Elements and Child Components**:
  - A spinner or progress indicator.
- **Handled Events**:
  - None; simply reflects the state of an API call.
- **Validation Conditions**:
  - Displayed only when `loading` is `true`.
- **Types**:
  - Props: `{ visible: boolean }`.

### ErrorNotification

- **Component Description**:
  - Shows an error message if an API call fails.
- **Main HTML Elements and Child Components**:
  - A text element (or alert box) to display the error message.
- **Handled Events**:
  - Optionally, a dismissal action to hide the error message.
- **Validation Conditions**:
  - Shown only if there is a non-null error message.
- **Types**:
  - Props: `{ message: string }`.

## 5. Types

- **AcceptFlashcardViewModel**:
  - `flashcard: { id: string; question: string; answer: string } | null` – The current flashcard suggestion to display.
  - `pendingFlashcards: Array<{ id: string; question: string; answer: string }>` – List of pending flashcards fetched from the list API.
  - `loading: boolean` – Indicates if an API call is in progress.
  - `error: string | null` – Contains an error message if the API call fails.
- **AcceptRejectAIFlashcardCommand** (from types):
  - `{ decision: 'accept' | 'reject' }`
- **AcceptRejectFlashcardResponseDTO** (from types):
  - `{ message: string; flashcard_id: string; status: 'active' | 'deleted' }`

## 6. State Management

- State is managed locally within the `AcceptFlashcardView` using React's `useState` hook.
- Create a custom hook (e.g., `useAcceptFlashcard`) to encapsulate:
  - The current flashcard suggestion.
  - The list of pending flashcards (fetched with status set to pending via GET `/api/flashcards`).
  - The loading state during API requests.
  - The error state for failed API calls.
  - Logic to update the flashcard data when one is processed, and if exhausted, automatically fetch pending flashcards.

## 7. API Integration

- **Primary Endpoint**: POST `/api/flashcards/{tempId}/decision`
  - **Request Payload**: `{ "decision": "accept" }` or `{ "decision": "reject" }`
  - **Response Payload**: `{ "message": string, "flashcard_id": string, "status": "active" | "deleted" }`
  - **Integration Steps**:
    - On button click, construct the API URL using the current flashcard’s `id` and send a POST request with the decision payload.
    - Process a successful response by updating the state—if the current flashcard is processed, load the next one from the pending list.
- **Secondary Endpoint**: GET `/api/flashcards`
  - **Purpose**: Retrieve a paginated list of flashcards for the authenticated user.
  - **Query Parameters**: Set `status` to show only pending flashcards (and optionally filter by `source` as "ai_generated").
  - **Response Payload**: Contains an array of flashcard summaries that include at least `id`, `content`, and `created_at`.
  - **Integration Steps**:
    - If the generate response flashcards are exhausted or if no flashcard is currently available, fetch pending flashcards from this endpoint.
    - Update the state (`pendingFlashcards` and set the next `flashcard` from this list) accordingly.

## 8. User Interactions

- **Accept Interaction**:
  - When the user clicks the Accept button, the system sends a decision of `accept` to the API.
  - Upon success, the flashcard’s status becomes active and this flashcard is removed from the pending list. The next pending flashcard is then displayed.
- **Reject Interaction**:
  - When the user clicks the Reject button, the system sends a decision of `reject` to the API.
  - Upon success, the flashcard is soft-deleted (removed from pending) and the next pending flashcard is displayed.
- **Flow from Dashboard**:
  - A link from the dashboard to the `/accept` view allows users to review all pending flashcards that need their decision.
- **Loading and Error States**:
  - While an API call is in progress, the loader is displayed and action buttons are disabled.
  - If an error occurs, an error message is displayed via the ErrorNotification component, and the user can retry the action.

## 9. Conditions and Validation

- **Flashcard Validation**: Verify that a flashcard exists and contains a valid `id` before processing any decision.
- **API Response Validation**: Ensure that responses from both the decision endpoint and the list endpoint are successful (HTTP 200) and include the required data fields.
- **Button State**: Disable Accept and Reject buttons when an API call is in progress to avoid duplicate submissions.
- **Content Validation**: The flashcard content (question and answer) must be non-empty and properly formatted for display.

## 10. Error Handling

- **API Errors**: If the POST decision API or GET list API call fails, update the error state and display an appropriate error notification.
- **Validation Errors**: Handle any issues with flashcard data (missing or malformed) by logging the error and prompting the user with a clear message.
- **Retry Mechanism**: Allow users to retry a failed API call by re-triggering the request via the same button or a dedicated retry action.

## 11. Implementation Steps

1. Update the `AcceptFlashcardView` container component to include logic for fetching pending flashcards from the List User Flashcards API when no current flashcard is available.
2. Implement the `FullscreenCard` component to display the flashcard’s question and answer.
3. Develop the `ActionButtons` component to render and wire the Accept and Reject buttons to trigger the decision API call.
4. Integrate the `Loader` component to show a spinner during API calls.
5. Add the `ErrorNotification` component to display any error messages.
6. Create or update the custom hook (`useAcceptFlashcard`) to manage:
   - Current flashcard suggestion.
   - The list of pending flashcards fetched from GET `/api/flashcards` with status pending.
   - Loading and error states.
   - Logic to update the flashcard view when one is accepted/rejected, including automatically pulling the next pending flashcard from the list.
7. In the view component, on button click:
   - Construct the API URL using the current flashcard’s `id` and send a POST request with the decision payload.
   - On success, remove the processed flashcard from the pending list and load the next one.
   - If there are no more flashcards from the generate response, trigger a call to the List User Flashcards API to refresh the pending flashcards.
8. Ensure a link to this `/accept` view is added in the dashboard, so that users can navigate to review pending flashcards.
9. Validate all API responses, disable interactive buttons during loading, and display error messages where needed.
10. Test the complete flow for both Accept and Reject actions, including edge cases where no pending flashcards are available.
