import { http, HttpResponse } from "msw";

/**
 * MSW handlers for mocking API requests
 * Add your API mocks here
 */
export const handlers = [
  // Example: Mock flashcard generation endpoint
  http.post("/api/flashcards/generate", () => {
    return HttpResponse.json({
      flashcards: [
        {
          id: "temp-1",
          question: "What is React?",
          answer: "A JavaScript library for building user interfaces",
        },
      ],
      message: "Flashcard generated successfully",
    });
  }),

  // Example: Mock flashcards list endpoint
  http.get("/api/flashcards", () => {
    return HttpResponse.json({
      data: [
        {
          id: "1",
          content: { question: "Test question", answer: "Test answer" },
          created_at: new Date().toISOString(),
        },
      ],
      page: 1,
      limit: 10,
      total: 1,
    });
  }),

  // Example: Mock today's count endpoint
  http.get("/api/flashcards/today-count", () => {
    return HttpResponse.json({
      count: 5,
    });
  }),
];
