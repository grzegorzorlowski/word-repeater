import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { LogoutButton } from "../LogoutButton";
import { server } from "@/test/setup";

// Mock window.location for navigation tests
const mockLocation = {
  href: "",
  origin: "http://localhost:3000",
  pathname: "/",
  search: "",
  hash: "",
};

Object.defineProperty(window, "location", {
  writable: true,
  value: mockLocation,
});

describe("LogoutButton", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    // Reset location before each test
    window.location.href = "";
  });

  afterEach(() => {
    // Restore window.location
    window.location = originalLocation;
    server.resetHandlers();
  });

  describe("Initial Rendering", () => {
    it("renders with default variant", () => {
      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute("aria-label", "Sign out");
    });

    it("renders with custom variant", () => {
      render(<LogoutButton variant="destructive" />);
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<LogoutButton className="custom-class" />);
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toHaveClass("custom-class");
    });

    it("does not show loading state initially", () => {
      render(<LogoutButton />);
      expect(screen.queryByText("Signing out...")).not.toBeInTheDocument();
    });

    it("does not show error message initially", () => {
      render(<LogoutButton />);
      expect(screen.queryByText(/logout failed/i)).not.toBeInTheDocument();
    });
  });

  describe("Logout Process", () => {
    it("shows loading state during logout", async () => {
      const user = userEvent.setup();

      // Mock successful logout response
      server.use(
        vi.fn().mockImplementation(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: "Logged out successfully" }),
          })
        )
      );

      // Mock fetch
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Logged out successfully" }),
        })
      );

      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });

      await user.click(button);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText("Signing out...")).toBeInTheDocument();
      });

      // Button should be disabled during loading
      expect(button).toBeDisabled();
    });

    it("redirects to login page on successful logout", async () => {
      const user = userEvent.setup();

      // Mock successful logout response
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Logged out successfully" }),
        })
      );

      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });

      await user.click(button);

      // Wait for redirect
      await waitFor(() => {
        expect(window.location.href).toBe("/login");
      });
    });

    it("displays error message on logout failure", async () => {
      const user = userEvent.setup();

      // Mock failed logout response
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({ error: "Invalid session" }),
        })
      );

      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });

      await user.click(button);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText("Invalid session")).toBeInTheDocument();
      });

      // Button should be re-enabled after error
      expect(button).not.toBeDisabled();

      // Loading state should be cleared
      expect(screen.queryByText("Signing out...")).not.toBeInTheDocument();
    });

    it("handles network errors gracefully", async () => {
      const user = userEvent.setup();

      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });

      await user.click(button);

      // Should display generic error message
      await waitFor(() => {
        expect(screen.getByText("Network error. Please try again.")).toBeInTheDocument();
      });

      // Button should be re-enabled after error
      expect(button).not.toBeDisabled();

      // Loading state should be cleared
      expect(screen.queryByText("Signing out...")).not.toBeInTheDocument();
    });

    it("handles API error without error field", async () => {
      const user = userEvent.setup();

      // Mock API error without error field
      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: false,
          json: () => Promise.resolve({}),
        })
      );

      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });

      await user.click(button);

      // Should display fallback error message
      await waitFor(() => {
        expect(screen.getByText("Logout failed. Please try again.")).toBeInTheDocument();
      });
    });

    it("clears previous error when starting new logout attempt", async () => {
      const user = userEvent.setup();

      // First attempt fails
      global.fetch = vi
        .fn()
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            json: () => Promise.resolve({ error: "First error" }),
          })
        )
        // Second attempt succeeds
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ message: "Logged out successfully" }),
          })
        );

      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });

      // First failed attempt
      await user.click(button);
      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second successful attempt
      await user.click(button);
      await waitFor(() => {
        expect(window.location.href).toBe("/login");
      });

      // Error message should be cleared
      expect(screen.queryByText("First error")).not.toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA label", () => {
      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });
      expect(button).toHaveAttribute("aria-label", "Sign out");
    });

    it("maintains accessibility when disabled", async () => {
      const user = userEvent.setup();

      global.fetch = vi.fn().mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Logged out successfully" }),
        })
      );

      render(<LogoutButton />);
      const button = screen.getByRole("button", { name: /sign out/i });

      await user.click(button);

      // Button should be disabled but still have aria-label
      await waitFor(() => {
        expect(button).toBeDisabled();
        expect(button).toHaveAttribute("aria-label", "Sign out");
      });
    });
  });
});
