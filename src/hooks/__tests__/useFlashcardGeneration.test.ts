/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useFlashcardGeneration } from "../useFlashcardGeneration";
import { http, HttpResponse } from "msw";
import { server } from "@/test/setup";
import type { GenerateAIFlashcardsResponseDTO } from "@/types";

describe("useFlashcardGeneration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Text and Character Count Management", () => {
    it("should initialize with empty text and zero character count", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      expect(result.current.text).toBe("");
      expect(result.current.charCount).toBe(0);
    });

    it("should update character count when text changes", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("Hello World");
      });

      expect(result.current.text).toBe("Hello World");
      expect(result.current.charCount).toBe(11);
    });

    it("should clear error and success message when text changes", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      // Set some error state manually by triggering a validation error
      act(() => {
        result.current.setText("a".repeat(100)); // Less than 500
        result.current.submit();
      });

      expect(result.current.error).toBeTruthy();

      // Now update text
      act(() => {
        result.current.setText("New text");
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("Submit Validation", () => {
    it("should disable submit when text is less than 500 characters", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(499));
      });

      expect(result.current.canSubmit).toBe(false);
    });

    it("should enable submit when text is exactly 500 characters", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it("should enable submit when text is between 500 and 5000 characters", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(2500));
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it("should enable submit when text is exactly 5000 characters", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(5000));
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it("should allow submit button to be clickable even when text exceeds 5000 (for truncate dialog)", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(5001));
      });

      expect(result.current.canSubmit).toBe(true);
    });

    it("should disable submit when generating", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      server.use(
        http.post("/api/flashcards/generate", async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return HttpResponse.json({
            flashcards: [],
            message: "Success",
          });
        })
      );

      act(() => {
        result.current.setText("a".repeat(500));
      });

      act(() => {
        result.current.submit();
      });

      expect(result.current.canSubmit).toBe(false);
      expect(result.current.isGenerating).toBe(true);
    });

    it("should show error when submitting with less than 500 characters", async () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(100));
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.error).toBe("Text must be at least 500 characters.");
      expect(result.current.isGenerating).toBe(false);
    });

    it("should show error when submitting with more than 5000 characters directly", async () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(5001));
      });

      await act(async () => {
        await result.current.submit();
      });

      expect(result.current.error).toBe("Text must not exceed 5000 characters.");
      expect(result.current.isGenerating).toBe(false);
    });
  });

  describe("Truncate Dialog Flow", () => {
    it("should handle truncate dialog visibility", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      expect(result.current.showTruncateDialog).toBe(false);

      act(() => {
        result.current.setShowTruncateDialog(true);
      });

      expect(result.current.showTruncateDialog).toBe(true);

      act(() => {
        result.current.setShowTruncateDialog(false);
      });

      expect(result.current.showTruncateDialog).toBe(false);
    });

    it("should accept overrideText parameter in submit for truncation", async () => {
      const mockResponse: GenerateAIFlashcardsResponseDTO = {
        flashcards: [
          { id: "1", question: "Q1", answer: "A1" },
          { id: "2", question: "Q2", answer: "A2" },
        ],
        message: "Flashcards generated successfully!",
      };

      server.use(
        http.post("/api/flashcards/generate", async ({ request }) => {
          const body = await request.json();
          expect(body).toEqual({
            text: "a".repeat(5000),
            limit: 20,
          });
          return HttpResponse.json(mockResponse);
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(6000));
      });

      await act(async () => {
        await result.current.submit("a".repeat(5000));
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(result.current.text).toBe("");
      expect(result.current.generatedFlashcards).toHaveLength(2);
      expect(result.current.successMessage).toBe("Flashcards generated successfully!");
    });
  });

  describe("API Integration - Success Cases", () => {
    it("should successfully generate flashcards", async () => {
      const mockResponse: GenerateAIFlashcardsResponseDTO = {
        flashcards: [
          { id: "1", question: "What is TypeScript?", answer: "A typed superset of JavaScript" },
          { id: "2", question: "What is React?", answer: "A JavaScript library for building UIs" },
        ],
        message: "Successfully generated 2 flashcards",
      };

      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      expect(result.current.generatedFlashcards).toEqual(mockResponse.flashcards);
      expect(result.current.successMessage).toBe("Successfully generated 2 flashcards");
      expect(result.current.error).toBeNull();
      expect(result.current.text).toBe("");
      expect(result.current.charCount).toBe(0);
    });

    it("should use default message when API doesn't provide one", async () => {
      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json({
            flashcards: [{ id: "1", question: "Q", answer: "A" }],
            message: "",
          });
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.successMessage).toBe("Flashcards generated successfully!");
      });
    });
  });

  describe("API Integration - Error Handling", () => {
    it("should handle 400 validation error with details", async () => {
      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json(
            {
              message: "Validation failed",
              details: [
                { field: "text", message: "Text is too short." },
                { field: "text", message: "Text contains invalid characters." },
              ],
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Text is too short. Text contains invalid characters.");
      });

      expect(result.current.isGenerating).toBe(false);
      expect(result.current.text).toBe("a".repeat(500)); // Text preserved for retry
    });

    it("should handle 400 validation error without details", async () => {
      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json(
            {
              message: "Invalid request format",
            },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Invalid request format");
      });
    });

    it("should handle 422 unprocessable entity error", async () => {
      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json(
            {
              message: "Could not process the text",
            },
            { status: 422 }
          );
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Couldn't generate flashcards from this text. Try adjusting the input.");
      });
    });

    it("should handle 500 server error", async () => {
      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json(
            {
              message: "Internal server error",
            },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.error).toBe("Server error. Please try again later.");
      });
    });

    it("should handle network error", async () => {
      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isGenerating).toBe(false);
      });
    });

    it("should handle request timeout after 90 seconds", async () => {
      vi.useFakeTimers();

      server.use(
        http.post("/api/flashcards/generate", async () => {
          // Simulate a long-running request that never completes
          await new Promise(() => {
            /* never resolves */
          });
          return HttpResponse.json({ flashcards: [], message: "Success" });
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      act(() => {
        result.current.setText("a".repeat(500));
      });

      // Start the submission (don't await it yet)
      const submitPromise = result.current.submit();

      // Fast-forward time by 15 seconds to trigger timeout
      await act(async () => {
        vi.advanceTimersByTime(90000);
        await Promise.resolve(); // Allow microtasks to process
      });

      // Wait for the submit promise to resolve
      await act(async () => {
        await submitPromise;
      });

      expect(result.current.error).toBe("Request timed out. Please try again or use shorter text.");
      expect(result.current.isGenerating).toBe(false);

      vi.useRealTimers();
    });
  });

  describe("Error Management", () => {
    it("should clear error when clearError is called", () => {
      const { result } = renderHook(() => useFlashcardGeneration());

      // Set error by submitting invalid text
      act(() => {
        result.current.setText("a".repeat(100));
        result.current.submit();
      });

      expect(result.current.error).toBeTruthy();

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });

    it("should preserve text after error for retry functionality", async () => {
      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json({ message: "Error" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      const testText = "a".repeat(500);
      act(() => {
        result.current.setText(testText);
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      expect(result.current.text).toBe(testText);
    });
  });

  describe("State Transitions", () => {
    it("should transition from idle -> generating -> success", async () => {
      const mockResponse: GenerateAIFlashcardsResponseDTO = {
        flashcards: [{ id: "1", question: "Q", answer: "A" }],
        message: "Success",
      };

      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      // Idle state
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.successMessage).toBeNull();

      act(() => {
        result.current.setText("a".repeat(500));
      });

      // Start generating
      act(() => {
        result.current.submit();
      });

      // Generating state
      expect(result.current.isGenerating).toBe(true);
      expect(result.current.error).toBeNull();

      // Wait for success
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      // Success state
      expect(result.current.successMessage).toBe("Success");
      expect(result.current.error).toBeNull();
      expect(result.current.generatedFlashcards).toHaveLength(1);
    });

    it("should transition from idle -> generating -> error", async () => {
      server.use(
        http.post("/api/flashcards/generate", () => {
          return HttpResponse.json({ message: "Error" }, { status: 500 });
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      // Idle state
      expect(result.current.isGenerating).toBe(false);
      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setText("a".repeat(500));
      });

      // Start generating
      await act(async () => {
        await result.current.submit();
      });

      // Wait for error
      await waitFor(() => {
        expect(result.current.isGenerating).toBe(false);
      });

      // Error state
      expect(result.current.error).toBeTruthy();
      expect(result.current.successMessage).toBeNull();
    });
  });

  describe("API Request Format", () => {
    it("should send correct request payload", async () => {
      let capturedRequest: any;

      server.use(
        http.post("/api/flashcards/generate", async ({ request }) => {
          capturedRequest = await request.json();
          return HttpResponse.json({
            flashcards: [],
            message: "Success",
          });
        })
      );

      const { result } = renderHook(() => useFlashcardGeneration());

      const testText = "a".repeat(1000);
      act(() => {
        result.current.setText(testText);
      });

      await act(async () => {
        await result.current.submit();
      });

      await waitFor(() => {
        expect(capturedRequest).toEqual({
          text: testText,
          limit: 20,
        });
      });
    });
  });
});
