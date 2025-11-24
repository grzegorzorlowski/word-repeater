# Accept Flashcard View - Testing Checklist

## Test Environment Setup

- [x] Build completed successfully
- [x] Dev server started
- [x] All linter errors resolved
- [x] TypeScript compilation successful

## Component Integration Tests

### 1. Dashboard Integration

- [ ] Dashboard loads without errors
- [ ] "Review Pending Flashcards" button appears when pending flashcards exist
- [ ] Badge shows correct count of pending flashcards
- [ ] Button has proper orange styling for prominence
- [ ] Clicking button navigates to `/accept` page
- [ ] Button does NOT appear when no pending flashcards exist
- [ ] Loading state handled gracefully during count fetch

### 2. Accept Page Loading

- [ ] `/accept` page loads without errors
- [ ] Page shows loader during initial flashcard fetch
- [ ] Page layout is responsive and centered
- [ ] Header displays correctly with title and description

### 3. Flashcard Display

- [ ] FullscreenCard component renders with question and answer
- [ ] Content is parsed correctly from JSON format in database
- [ ] Question section displays with proper heading
- [ ] Answer section displays with proper heading
- [ ] Divider line appears between question and answer
- [ ] Text is readable with proper font sizes and spacing
- [ ] Card has proper shadow and border styling

### 4. Action Buttons

- [ ] Accept button displays with primary styling
- [ ] Reject button displays with outline styling
- [ ] Both buttons are large and accessible (h-14, text-lg)
- [ ] Buttons have proper ARIA labels
- [ ] Buttons are horizontally aligned (flexbox)
- [ ] Buttons are disabled during API calls
- [ ] Hover states work correctly

## API Integration Tests

### 5. Fetching Pending Flashcards

- [ ] GET `/api/flashcards?status=pending&source=ai_generated&limit=50` is called on mount
- [ ] Response is parsed correctly
- [ ] Flashcards are converted to display format
- [ ] First flashcard is set as current
- [ ] Remaining flashcards are queued
- [ ] 401 error handled (authentication)
- [ ] 500 error handled (server error)
- [ ] Network errors handled gracefully

### 6. Accept Decision

- [ ] Clicking Accept sends POST to `/api/flashcards/{id}/decision` with `{ decision: "accept" }`
- [ ] Loading state activates during request
- [ ] Buttons are disabled during request
- [ ] Success response (200) moves to next flashcard
- [ ] Current flashcard removed from queue
- [ ] Next flashcard displays automatically
- [ ] 400 error handled (validation error)
- [ ] 404 error handled (flashcard not found)
- [ ] 500 error handled (server error)
- [ ] Network errors handled gracefully

### 7. Reject Decision

- [ ] Clicking Reject sends POST to `/api/flashcards/{id}/decision` with `{ decision: "reject" }`
- [ ] Loading state activates during request
- [ ] Buttons are disabled during request
- [ ] Success response (200) moves to next flashcard
- [ ] Current flashcard removed from queue
- [ ] Next flashcard displays automatically
- [ ] Error responses handled same as Accept

## Edge Cases

### 8. No Pending Flashcards

- [ ] Page shows "All Done! 🎉" message when no flashcards exist
- [ ] Message includes link to generate more flashcards
- [ ] Link navigates to `/generate` page
- [ ] UI is centered and styled appropriately

### 9. Last Flashcard

- [ ] After processing last flashcard, "All Done" message appears
- [ ] No errors occur when pendingFlashcards array is empty
- [ ] Transition is smooth

### 10. Error Handling

- [ ] Error toast appears when API call fails
- [ ] Error message is user-friendly
- [ ] Dismiss button closes error toast
- [ ] Error toast has proper red styling
- [ ] Multiple errors don't stack (previous dismissed)
- [ ] Can retry after error by clicking button again

### 11. Loading States

- [ ] Initial load shows loader with "Loading flashcards..." text
- [ ] Decision processing shows inline loader
- [ ] Loader spins continuously
- [ ] UI doesn't jump when loader appears/disappears

### 12. JSON Parsing

- [ ] Content from database is parsed as JSON
- [ ] Valid JSON with question/answer extracts correctly
- [ ] Malformed JSON doesn't crash app (fallback to empty strings)
- [ ] Empty question/answer fields are handled
- [ ] Console error logged for parse failures

## Accessibility Tests

### 13. Keyboard Navigation

- [ ] Tab key navigates between buttons
- [ ] Focus indicators are visible
- [ ] Enter key activates focused button
- [ ] Escape key dismisses error toast (if implemented)

### 14. ARIA Attributes

- [ ] Buttons have descriptive aria-labels
- [ ] Error toast has role="alert"
- [ ] Loading states have appropriate ARIA attributes
- [ ] Semantic HTML used throughout

### 15. Screen Reader Compatibility

- [ ] Screen reader announces flashcard content
- [ ] Button states announced correctly
- [ ] Error messages announced
- [ ] Loading states announced

## Responsive Design Tests

### 16. Mobile View (< 640px)

- [ ] Layout stacks vertically
- [ ] Buttons are full width
- [ ] Text sizes are readable
- [ ] Card fits in viewport
- [ ] No horizontal scroll

### 17. Tablet View (640px - 1024px)

- [ ] Layout adjusts appropriately
- [ ] Card has proper max-width
- [ ] Buttons align correctly

### 18. Desktop View (> 1024px)

- [ ] Content is centered
- [ ] Max-width constraints applied
- [ ] Proper spacing maintained

## Performance Tests

### 19. Initial Load

- [ ] Page loads in < 2 seconds
- [ ] API call completes quickly
- [ ] No unnecessary re-renders
- [ ] Images/assets load optimally

### 20. State Management

- [ ] No memory leaks
- [ ] State updates are efficient
- [ ] useCallback prevents unnecessary re-renders
- [ ] Component unmounts cleanly

## Integration with Existing Features

### 21. Generate Flashcards Flow

- [ ] After generating flashcards, they appear as pending
- [ ] Can navigate from generate page to accept page
- [ ] Generated flashcards use correct JSON format

### 22. Dashboard Flow

- [ ] Pending count updates after accepting/rejecting
- [ ] Can navigate back to dashboard
- [ ] Dashboard fetches fresh count

## Browser Compatibility

### 23. Cross-Browser Testing

- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## Known Issues / Warnings

- Console warning for `console.error` in parseFlashcardContent (acceptable for error logging)

## Test Results Summary

- **Total Tests**: 80+
- **Passed**: [To be filled]
- **Failed**: [To be filled]
- **Skipped**: [To be filled]

## Next Steps After Testing

1. Fix any identified bugs
2. Optimize performance if needed
3. Add any missing accessibility features
4. Document any deployment considerations
