import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "../LoginForm";
import { server } from "@/test/setup";

describe("LoginForm", () => {
  const originalLocation = window.location;
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock window.location for navigation tests
    delete (window as any).location;
    window.location = { href: "" } as any;
  });

  afterEach(() => {
    // Restore window.location (but don't restore fetch to preserve MSW)
    window.location = originalLocation;
    server.resetHandlers();
  });

  describe("Initial Rendering", () => {
    it("should render email field", () => {
      render(<LoginForm />);
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    });

    it("should render password field", () => {
      render(<LoginForm />);
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("should render submit button", () => {
      render(<LoginForm />);
      expect(screen.getByRole("button", { name: "Sign in" })).toBeInTheDocument();
    });

    it("should render forgot password link", () => {
      render(<LoginForm />);
      expect(screen.getByRole("link", { name: /forgot your password/i })).toBeInTheDocument();
    });

    it("should have correct forgot password link href", () => {
      render(<LoginForm />);
      const link = screen.getByRole("link", { name: /forgot your password/i });
      expect(link).toHaveAttribute("href", "/forgot-password");
    });

    it("should not show error message initially", () => {
      render(<LoginForm />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should not show loading state initially", () => {
      render(<LoginForm />);
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });

  describe("Field Properties", () => {
    it("should have required attribute on email field", () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeRequired();
    });

    it("should have required attribute on password field", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toBeRequired();
    });

    it("should have correct type for email field", () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("type", "email");
    });

    it("should have correct type for password field", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("type", "password");
    });

    it("should have autocomplete attribute on email field", () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("autocomplete", "email");
    });

    it("should have autocomplete attribute on password field", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("autocomplete", "current-password");
    });

    it("should have placeholder on email field", () => {
      render(<LoginForm />);
      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toHaveAttribute("placeholder", "you@example.com");
    });

    it("should have placeholder on password field", () => {
      render(<LoginForm />);
      const passwordInput = screen.getByLabelText(/password/i);
      expect(passwordInput).toHaveAttribute("placeholder", "••••••••");
    });
  });

  describe("User Input Handling", () => {
    it("should update email field value on input", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
      await user.type(emailInput, "test@example.com");

      expect(emailInput.value).toBe("test@example.com");
    });

    it("should update password field value on input", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, "password123");

      expect(passwordInput.value).toBe("password123");
    });

    it("should clear validation error when email field is modified", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "t");

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
      });
    });

    it("should clear validation error when password field is modified", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      // Wait for validation errors
      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "p");

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/password is required/i)).not.toBeInTheDocument();
      });
    });

    it("should clear general error when user types in any field", async () => {
      const user = userEvent.setup();

      // Mock fetch to return a 401 error with the expected error message
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          headers: {
            get: (name: string) => (name === "content-type" ? "application/json" : null),
          },
          json: () => Promise.resolve({ error: "Invalid email or password" }),
          text: () => Promise.resolve(JSON.stringify({ error: "Invalid email or password" })),
        } as Response)
      );

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Type in email field
      await user.type(emailInput, "x");

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
      });
    });
  });

  describe("Client-side Validation", () => {
    it("should show error when submitting with empty email", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it("should show error when submitting with invalid email", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);

      await user.type(emailInput, "invalid-email");
      await user.type(passwordInput, "password123");

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it("should show error when submitting with empty password", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, "test@example.com");

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it("should show errors for both fields when both are empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });
    });

    it("should not submit form when validation fails", async () => {
      const user = userEvent.setup();
      const fetchSpy = vi.spyOn(global, "fetch");

      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("should set aria-invalid on email field when validation fails", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        expect(emailInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it("should set aria-invalid on password field when validation fails", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      await waitFor(() => {
        const passwordInput = screen.getByLabelText(/password/i);
        expect(passwordInput).toHaveAttribute("aria-invalid", "true");
      });
    });
  });

  describe("API Integration - Success", () => {
    it("should call login API with correct credentials", async () => {
      const user = userEvent.setup();
      let capturedRequestBody: any = null;

      // Mock fetch to capture the request body and return success
      const mockFetch = vi.fn((url, options) => {
        if (options?.body) {
          capturedRequestBody = JSON.parse(options.body as string);
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: {
            get: (name: string) => (name === "content-type" ? "application/json" : null),
          },
          json: () =>
            Promise.resolve({
              message: "Login successful",
              user: { id: "123", email: "test@example.com" },
              redirectTo: "/dashboard",
            }),
          text: () =>
            Promise.resolve(
              JSON.stringify({
                message: "Login successful",
                user: { id: "123", email: "test@example.com" },
                redirectTo: "/dashboard",
              })
            ),
        } as Response);
      });

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(capturedRequestBody).toEqual({
          email: "test@example.com",
          password: "password123",
        });
      });
    });

    it("should redirect to default dashboard on successful login", async () => {
      const user = userEvent.setup();

      // Mock fetch to return success response
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: {
            get: (name: string) => (name === "content-type" ? "application/json" : null),
          },
          json: () =>
            Promise.resolve({
              message: "Login successful",
              user: { id: "123", email: "test@example.com" },
              redirectTo: "/dashboard",
            }),
          text: () =>
            Promise.resolve(
              JSON.stringify({
                message: "Login successful",
                user: { id: "123", email: "test@example.com" },
                redirectTo: "/dashboard",
              })
            ),
        } as Response)
      );

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toBe("/dashboard");
      });
    });

    it("should redirect to custom location when redirectTo prop is provided", async () => {
      const user = userEvent.setup();

      // Mock fetch to return success response
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: {
            get: (name: string) => (name === "content-type" ? "application/json" : null),
          },
          json: () =>
            Promise.resolve({
              message: "Login successful",
              user: { id: "123", email: "test@example.com" },
              redirectTo: "/custom",
            }),
          text: () =>
            Promise.resolve(
              JSON.stringify({
                message: "Login successful",
                user: { id: "123", email: "test@example.com" },
                redirectTo: "/custom",
              })
            ),
        } as Response)
      );

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm redirectTo="/custom" />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toBe("/custom");
      });
    });

    it("should show loading state during API call", async () => {
      const user = userEvent.setup();

      // Mock fetch with delay to return success response
      const mockFetch = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: {
                  get: (name: string) => (name === "content-type" ? "application/json" : null),
                },
                json: () =>
                  Promise.resolve({
                    message: "Login successful",
                    user: { id: "123", email: "test@example.com" },
                    redirectTo: "/dashboard",
                  }),
                text: () =>
                  Promise.resolve(
                    JSON.stringify({
                      message: "Login successful",
                      user: { id: "123", email: "test@example.com" },
                      redirectTo: "/dashboard",
                    })
                  ),
              } as Response);
            }, 100);
          })
      );

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(window.location.href).toBe("/dashboard");
      });
    });

    it("should disable fields during submission", async () => {
      const user = userEvent.setup();

      // Mock fetch with delay to return success response
      const mockFetch = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: {
                  get: (name: string) => (name === "content-type" ? "application/json" : null),
                },
                json: () =>
                  Promise.resolve({
                    message: "Login successful",
                    user: { id: "123", email: "test@example.com" },
                    redirectTo: "/dashboard",
                  }),
                text: () =>
                  Promise.resolve(
                    JSON.stringify({
                      message: "Login successful",
                      user: { id: "123", email: "test@example.com" },
                      redirectTo: "/dashboard",
                    })
                  ),
              } as Response);
            }, 100);
          })
      );

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Fields should be disabled during submission
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();

      await waitFor(() => {
        expect(window.location.href).toBe("/dashboard");
      });
    });
  });

  describe("API Integration - Errors", () => {
    it("should display API error message on 401 Unauthorized", async () => {
      const user = userEvent.setup();

      // Mock fetch directly
      const originalFetch = global.fetch;
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          json: () => Promise.resolve({ error: "Invalid email or password" }),
        } as Response)
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "wrongpassword");
      await user.click(submitButton);

      // Wait for the error message to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Restore fetch
      global.fetch = originalFetch;
    });

    it("should display API error message on 400 Bad Request", async () => {
      const user = userEvent.setup();

      // Mock fetch directly for 400 error
      const originalFetch = global.fetch;
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ error: "Invalid request format" }),
        } as Response)
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      // Find button by type instead of name to avoid conflicts
      const submitButton = document.querySelector('button[type="submit"]') as HTMLButtonElement;

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Wait for the error message to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid request format/i)).toBeInTheDocument();
      });

      // Restore fetch
      global.fetch = originalFetch;
    });

    it("should display generic error when API error message is missing", async () => {
      const user = userEvent.setup();

      // Mock fetch to return 500 error with empty JSON response (no error field)
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          headers: {
            get: (name: string) => (name === "content-type" ? "application/json" : null),
          },
          json: () => Promise.resolve({}), // Empty object with no error field
          text: () => Promise.resolve(JSON.stringify({})),
        } as Response)
      );

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/login failed\. please try again/i)).toBeInTheDocument();
      });
    });

    it("should handle network errors", async () => {
      const user = userEvent.setup();

      // Mock fetch to reject and simulate network error
      const mockFetch = vi.fn(() => Promise.reject(new Error("Network error")));

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error\. please check your connection and try again/i)).toBeInTheDocument();
      });
    });

    it("should re-enable form after API error", async () => {
      const user = userEvent.setup();

      // Create a proper mock Response
      const mockResponse = {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        headers: {
          get: (name: string) => (name === "content-type" ? "application/json" : null),
        },
        json: () => Promise.resolve({ error: "Invalid email or password" }),
        text: () => Promise.resolve(JSON.stringify({ error: "Invalid email or password" })),
      } as Response;

      vi.stubGlobal(
        "fetch",
        vi.fn(() => Promise.resolve(mockResponse))
      );

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Form should be re-enabled
      expect(submitButton).not.toBeDisabled();
      expect(emailInput).not.toBeDisabled();
      expect(passwordInput).not.toBeDisabled();
    });

    it("should allow retry after error", async () => {
      const user = userEvent.setup();
      let attemptCount = 0;

      // Close MSW server temporarily for this test
      // Mock fetch to simulate first attempt failing, second succeeding
      const mockFetch = vi.fn(() => {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt fails with 500 error
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            headers: {
              get: (name: string) => (name === "content-type" ? "application/json" : null),
            },
            json: () => Promise.resolve({ error: "Server error" }),
            text: () => Promise.resolve(JSON.stringify({ error: "Server error" })),
          } as Response);
        } else {
          // Second attempt succeeds
          return Promise.resolve({
            ok: true,
            status: 200,
            statusText: "OK",
            headers: {
              get: (name: string) => (name === "content-type" ? "application/json" : null),
            },
            json: () =>
              Promise.resolve({
                message: "Login successful",
                user: { id: "123", email: "test@example.com" },
                redirectTo: "/dashboard",
              }),
            text: () =>
              Promise.resolve(
                JSON.stringify({
                  message: "Login successful",
                  user: { id: "123", email: "test@example.com" },
                  redirectTo: "/dashboard",
                })
              ),
          } as Response);
        }
      });

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");

      // First attempt - fails
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/server error/i)).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toBe("/dashboard");
      });

      expect(attemptCount).toBe(2);
    });
  });

  describe("Accessibility", () => {
    it("should have accessible form structure", () => {
      render(<LoginForm />);
      const form = screen.getByRole("form", { hidden: true });
      expect(form).toBeInTheDocument();
    });

    it("should associate error messages with fields using aria-describedby", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const submitButton = screen.getByRole("button", { name: "Sign in" });
      await user.click(submitButton);

      await waitFor(() => {
        const emailInput = screen.getByLabelText(/email/i);
        const errorId = emailInput.getAttribute("aria-describedby");
        expect(errorId).toBeTruthy();
        if (errorId) {
          expect(document.getElementById(errorId)).toBeInTheDocument();
        }
      });
    });

    it("should disable forgot password link during submission", async () => {
      const user = userEvent.setup();

      // Mock fetch with delay to simulate API call in progress
      const mockFetch = vi.fn(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                status: 200,
                statusText: "OK",
                headers: {
                  get: (name: string) => (name === "content-type" ? "application/json" : null),
                },
                json: () =>
                  Promise.resolve({
                    message: "Login successful",
                    user: { id: "123", email: "test@example.com" },
                    redirectTo: "/dashboard",
                  }),
                text: () =>
                  Promise.resolve(
                    JSON.stringify({
                      message: "Login successful",
                      user: { id: "123", email: "test@example.com" },
                      redirectTo: "/dashboard",
                    })
                  ),
              } as Response);
            }, 100);
          })
      );

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });
      const forgotLink = screen.getByRole("link", { name: /forgot your password/i });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      // Forgot password link should have tabIndex -1 during submission
      expect(forgotLink).toHaveAttribute("tabindex", "-1");

      await waitFor(() => {
        expect(window.location.href).toBe("/dashboard");
      });
    });

    it("should display error messages with role='alert' for screen readers", async () => {
      const user = userEvent.setup();

      // Mock fetch to return 401 error for accessibility testing
      const mockFetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 401,
          statusText: "Unauthorized",
          headers: {
            get: (name: string) => (name === "content-type" ? "application/json" : null),
          },
          json: () => Promise.resolve({ error: "Invalid email or password" }),
          text: () => Promise.resolve(JSON.stringify({ error: "Invalid email or password" })),
        } as Response)
      );

      vi.stubGlobal("fetch", mockFetch);

      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole("button", { name: "Sign in" });

      await user.type(emailInput, "test@example.com");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        const errorAlert = screen.getByRole("alert", { hidden: true });
        expect(errorAlert).toBeInTheDocument();
      });
    });
  });
});
