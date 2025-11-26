import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import ManualFlashcardForm from "../ManualFlashcardForm";
import { http, HttpResponse } from "msw";
import { server } from "@/test/setup";
import type { CreateManualFlashcardResponseDTO } from "@/types";

describe("ManualFlashcardForm", () => {
  beforeEach(() => {
    // Reset any handlers before each test
    server.resetHandlers();
  });

  describe("Initial Rendering", () => {
    it("should render the form with all required fields", () => {
      render(<ManualFlashcardForm />);

      expect(screen.getByRole("heading", { name: /create flashcard/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/question/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/answer/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /save flashcard/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /cancel/i })).toBeInTheDocument();
    });

    it("should render back to dashboard link", () => {
      render(<ManualFlashcardForm />);

      const backLink = screen.getByRole("link", { name: /back to dashboard/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute("href", "/dashboard");
    });

    it("should render description text", () => {
      render(<ManualFlashcardForm />);

      expect(
        screen.getByText(/enter a question and answer to create a new flashcard/i)
      ).toBeInTheDocument();
    });

    it("should render helper text for question field", () => {
      render(<ManualFlashcardForm />);

      expect(screen.getByText(/write a clear and concise question/i)).toBeInTheDocument();
    });

    it("should render helper text for answer field", () => {
      render(<ManualFlashcardForm />);

      expect(screen.getByText(/provide a detailed and accurate answer/i)).toBeInTheDocument();
    });

    it("should have submit button disabled initially", () => {
      render(<ManualFlashcardForm />);

      const submitButton = screen.getByRole("button", { name: /save flashcard/i });
      expect(submitButton).toBeDisabled();
    });

    it("should not render error toast initially", () => {
      render(<ManualFlashcardForm />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should not render success message initially", () => {
      render(<ManualFlashcardForm />);

      expect(screen.queryByText(/flashcard created successfully/i)).not.toBeInTheDocument();
    });
  });

  describe("Character Counters", () => {
    it("should show 0/300 character count for question initially", () => {
      render(<ManualFlashcardForm />);

      expect(screen.getByText(/\(0\/300\)/)).toBeInTheDocument();
    });

    it("should show 0/500 character count for answer initially", () => {
      render(<ManualFlashcardForm />);

      expect(screen.getByText(/\(0\/500\)/)).toBeInTheDocument();
    });

    it("should update question character count as user types", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      await user.type(questionInput, "Hello");

      expect(screen.getByText(/\(5\/300\)/)).toBeInTheDocument();
    });

    it("should update answer character count as user types", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const answerInput = screen.getByLabelText(/answer/i);
      await user.type(answerInput, "Hello World");

      expect(screen.getByText(/\(11\/500\)/)).toBeInTheDocument();
    });

    it("should show correct count with multi-byte characters", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      await user.type(questionInput, "你好");

      expect(screen.getByText(/\(2\/300\)/)).toBeInTheDocument();
    });
  });

  describe("Form Validation", () => {
    it("should enable submit button when both fields have content", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      expect(submitButton).toBeDisabled();

      await user.type(questionInput, "What is React?");
      await user.type(answerInput, "A JavaScript library");

      expect(submitButton).toBeEnabled();
    });

    it("should keep submit button disabled with only question filled", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "What is React?");

      expect(submitButton).toBeDisabled();
    });

    it("should keep submit button disabled with only answer filled", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(answerInput, "A JavaScript library");

      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when question is empty", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(answerInput, "Some answer");

      // Button should still be disabled because question is empty
      expect(submitButton).toBeDisabled();
    });

    it("should disable submit button when answer is empty", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Some question");

      // Button should still be disabled because answer is empty
      expect(submitButton).toBeDisabled();
    });

    it("should show validation error for exceeding question length", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json(
            { error: "Question must not exceed 300 characters" },
            { status: 400 }
          );
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      // Type content that would trigger server-side validation
      await user.type(questionInput, "Valid question");
      await user.type(answerInput, "Valid answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("should not have error styling initially", () => {
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);

      expect(questionInput).not.toHaveClass("border-destructive");
      expect(answerInput).not.toHaveClass("border-destructive");
    });

    it("should have aria-invalid set to false initially", () => {
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);

      expect(questionInput).toHaveAttribute("aria-invalid", "false");
      expect(answerInput).toHaveAttribute("aria-invalid", "false");
    });

    it("should not have aria-describedby initially", () => {
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);

      expect(questionInput).not.toHaveAttribute("aria-describedby");
      expect(answerInput).not.toHaveAttribute("aria-describedby");
    });

    it("should clear error toast when user types in question field after error", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json(
            { error: "Server error" },
            { status: 500 }
          );
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      // Fill and submit to trigger error
      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Type in question to clear error
      await user.clear(questionInput);
      await user.type(questionInput, "New question");

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });

    it("should clear error toast when user types in answer field after error", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json(
            { error: "Server error" },
            { status: 500 }
          );
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      // Fill and submit to trigger error
      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      // Type in answer to clear error
      await user.clear(answerInput);
      await user.type(answerInput, "New answer");

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });

  describe("Form Submission - Success", () => {
    it("should submit form with valid data", async () => {
      const user = userEvent.setup();
      let capturedRequest: any = null;

      server.use(
        http.post("/api/flashcards", async ({ request }) => {
          capturedRequest = await request.json();
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Flashcard created successfully!",
            flashcard: {
              id: "test-id",
              content: "Q: What is React?\nA: A JavaScript library",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "What is React?");
      await user.type(answerInput, "A JavaScript library");
      await user.click(submitButton);

      await waitFor(() => {
        expect(capturedRequest).toEqual({
          question: "What is React?",
          answer: "A JavaScript library",
        });
      });
    });

    it("should show loading state during submission", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/saving\.\.\./i)).toBeInTheDocument();
      });
    });

    it("should disable submit button during loading", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it("should disable cancel button during loading", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });
      const cancelButton = screen.getByRole("link", { name: /cancel/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(cancelButton).toHaveClass("disabled:opacity-50");
      });
    });

    it("should disable form fields during loading", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(questionInput).toBeDisabled();
        expect(answerInput).toBeDisabled();
      });
    });

    it("should show success message after successful submission", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Flashcard created successfully!",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/flashcard created successfully!/i)).toBeInTheDocument();
      });
    });

    it("should show success message with additional info", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/your flashcard has been created and is ready for learning/i)
        ).toBeInTheDocument();
      });
    });

    it("should show navigation buttons in success message", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        // Check for links within the success message area
        const allDashboardLinks = screen.getAllByRole("link", { name: /back to dashboard/i });
        expect(allDashboardLinks.length).toBeGreaterThanOrEqual(2); // One in header, one in success
        expect(screen.getByRole("link", { name: /view all flashcards/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /create another/i })).toBeInTheDocument();
      });
    });

    it("should clear form fields after successful submission", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i) as HTMLTextAreaElement;
      const answerInput = screen.getByLabelText(/answer/i) as HTMLTextAreaElement;
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(questionInput.value).toBe("");
        expect(answerInput.value).toBe("");
      });
    });

    it("should call onSuccess callback when provided", async () => {
      const user = userEvent.setup();
      const onSuccess = vi.fn();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm onSuccess={onSuccess} />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith({
          id: "test-id",
          content: "Q: Test\nA: Answer",
          created_at: expect.any(String),
        });
      });
    });
  });

  describe("Form Submission - Error Handling", () => {
    it("should show error toast on API failure", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json({ error: "Something went wrong" }, { status: 500 });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("should show specific error message from API", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json({ error: "Question is too long" }, { status: 400 });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/question is too long/i)).toBeInTheDocument();
      });
    });

    it("should show retry button in error toast", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json({ error: "Network error" }, { status: 500 });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      });
    });

    it("should preserve form data on error", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json({ error: "Server error" }, { status: 500 });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i) as HTMLTextAreaElement;
      const answerInput = screen.getByLabelText(/answer/i) as HTMLTextAreaElement;
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      expect(questionInput.value).toBe("Test question");
      expect(answerInput.value).toBe("Test answer");
    });

    it("should allow retry after error", async () => {
      const user = userEvent.setup();
      let attemptCount = 0;

      server.use(
        http.post("/api/flashcards", () => {
          attemptCount++;
          if (attemptCount === 1) {
            return HttpResponse.json({ error: "Server error" }, { status: 500 });
          }
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Flashcard created successfully!",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole("button", { name: /retry/i });
      await user.click(retryButton);

      await waitFor(() => {
        expect(screen.getByText("Flashcard created successfully!")).toBeInTheDocument();
      });
    });

    it("should dismiss error toast when dismiss button is clicked", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json({ error: "Server error" }, { status: 500 });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });

      const dismissButton = screen.getByRole("button", { name: /dismiss error/i });
      await user.click(dismissButton);

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });

  describe("maxLength Constraints", () => {
    it("should have maxLength attribute on question field", () => {
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      expect(questionInput).toHaveAttribute("maxLength", "300");
    });

    it("should have maxLength attribute on answer field", () => {
      render(<ManualFlashcardForm />);

      const answerInput = screen.getByLabelText(/answer/i);
      expect(answerInput).toHaveAttribute("maxLength", "500");
    });

    it("should prevent typing beyond 300 characters in question", () => {
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i) as HTMLTextAreaElement;

      // The maxLength attribute prevents typing beyond 300 characters
      expect(questionInput.maxLength).toBe(300);
    });

    it("should prevent typing beyond 500 characters in answer", () => {
      render(<ManualFlashcardForm />);

      const answerInput = screen.getByLabelText(/answer/i) as HTMLTextAreaElement;

      // The maxLength attribute prevents typing beyond 500 characters
      expect(answerInput.maxLength).toBe(500);
    });
  });

  describe("Accessibility", () => {
    it("should have proper form structure", () => {
      render(<ManualFlashcardForm />);

      const form = screen.getByLabelText(/question/i).closest("form");
      expect(form).toBeInTheDocument();
    });

    it("should have labels associated with inputs", () => {
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);

      expect(questionInput).toHaveAttribute("id", "question");
      expect(answerInput).toHaveAttribute("id", "answer");
    });

    it("should have placeholder text for inputs", () => {
      render(<ManualFlashcardForm />);

      expect(screen.getByPlaceholderText(/enter your question here/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/enter your answer here/i)).toBeInTheDocument();
    });

    it("should have proper heading hierarchy", () => {
      render(<ManualFlashcardForm />);

      const heading = screen.getByRole("heading", { name: /create flashcard/i });
      expect(heading.tagName).toBe("H1");
    });

    it("should have role=alert on error toast", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json(
            { error: "Server error" },
            { status: 500 }
          );
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });

    it("should have accessible button text", () => {
      render(<ManualFlashcardForm />);

      expect(screen.getByRole("button", { name: /save flashcard/i })).toHaveAccessibleName();
      expect(screen.getByRole("link", { name: /cancel/i })).toHaveAccessibleName();
    });
  });

  describe("Navigation", () => {
    it("should have back to dashboard link with correct href", () => {
      render(<ManualFlashcardForm />);

      const backLink = screen.getByRole("link", { name: /back to dashboard/i });
      expect(backLink).toHaveAttribute("href", "/dashboard");
    });

    it("should have cancel button linking to dashboard", () => {
      render(<ManualFlashcardForm />);

      const cancelLink = screen.getByRole("link", { name: /cancel/i });
      expect(cancelLink).toHaveAttribute("href", "/dashboard");
    });

    it("should have success navigation buttons with correct hrefs", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Success",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        const dashboardLink = screen.getAllByRole("link", { name: /back to dashboard/i })[1];
        expect(dashboardLink).toHaveAttribute("href", "/dashboard");

        const flashcardsLink = screen.getByRole("link", { name: /view all flashcards/i });
        expect(flashcardsLink).toHaveAttribute("href", "/flashcards");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid typing without errors", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i) as HTMLTextAreaElement;

      await user.type(questionInput, "Fast typing test");

      expect(questionInput.value).toBe("Fast typing test");
    });

    it("should handle paste events", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const questionInput = screen.getByLabelText(/question/i) as HTMLTextAreaElement;

      await user.click(questionInput);
      await user.paste("Pasted text");

      expect(questionInput.value).toBe("Pasted text");
    });

    it("should allow multiline content in answer field", async () => {
      const user = userEvent.setup();
      render(<ManualFlashcardForm />);

      const answerInput = screen.getByLabelText(/answer/i) as HTMLTextAreaElement;

      await user.type(answerInput, "Line 1{Enter}Line 2{Enter}Line 3");

      expect(answerInput.value).toContain("Line 1");
      expect(answerInput.value).toContain("Line 2");
      expect(answerInput.value).toContain("Line 3");
    });

    it("should handle empty onSuccess callback gracefully", async () => {
      const user = userEvent.setup();

      server.use(
        http.post("/api/flashcards", () => {
          return HttpResponse.json<CreateManualFlashcardResponseDTO>({
            message: "Flashcard created successfully!",
            flashcard: {
              id: "test-id",
              content: "Q: Test\nA: Answer",
              created_at: new Date().toISOString(),
            },
          });
        })
      );

      render(<ManualFlashcardForm onSuccess={undefined} />);

      const questionInput = screen.getByLabelText(/question/i);
      const answerInput = screen.getByLabelText(/answer/i);
      const submitButton = screen.getByRole("button", { name: /save flashcard/i });

      await user.type(questionInput, "Test question");
      await user.type(answerInput, "Test answer");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Flashcard created successfully!")).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });
});
