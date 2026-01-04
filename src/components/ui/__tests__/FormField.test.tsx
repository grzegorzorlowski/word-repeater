/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { FormField } from "../FormField";

describe("FormField", () => {
  const defaultProps = {
    label: "Test Field",
    name: "testField",
    type: "text",
    value: "",
    onChange: vi.fn(),
  };

  describe("Initial Rendering", () => {
    it("should render label", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByText("Test Field")).toBeInTheDocument();
    });

    it("should render input field", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("should not render error message when error prop is undefined", () => {
      render(<FormField {...defaultProps} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should render with empty value initially", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  describe("Label Properties", () => {
    it("should associate label with input using htmlFor", () => {
      render(<FormField {...defaultProps} />);
      const label = screen.getByText("Test Field");
      expect(label).toHaveAttribute("for", "testField");
    });

    it("should show required indicator when required is true", () => {
      render(<FormField {...defaultProps} required />);
      const requiredIndicator = screen.getByText("*");
      expect(requiredIndicator).toBeInTheDocument();
      expect(requiredIndicator).toHaveClass("text-destructive");
    });

    it("should not show required indicator when required is false", () => {
      render(<FormField {...defaultProps} required={false} />);
      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("should show asterisk next to label text", () => {
      render(<FormField {...defaultProps} required />);
      const label = screen.getByText("Test Field").parentElement;
      expect(label?.textContent).toContain("Test Field*");
    });
  });

  describe("Input Properties", () => {
    it("should set correct name attribute", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "testField");
    });

    it("should set correct id attribute", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("id", "testField");
    });

    it("should set correct type attribute", () => {
      render(<FormField {...defaultProps} type="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("should render password input with correct type", () => {
      render(<FormField {...defaultProps} type="password" label="Password" />);
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("should display the provided value", () => {
      render(<FormField {...defaultProps} value="test value" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("test value");
    });

    it("should set autocomplete attribute when provided", () => {
      render(<FormField {...defaultProps} autocomplete="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("autocomplete", "email");
    });

    it("should set placeholder when provided", () => {
      render(<FormField {...defaultProps} placeholder="Enter text here" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("placeholder", "Enter text here");
    });

    it("should be disabled when disabled prop is true", () => {
      render(<FormField {...defaultProps} disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should not be disabled by default", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).not.toBeDisabled();
    });
  });

  describe("User Interactions", () => {
    it("should call onChange when user types", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FormField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      expect(onChange).toHaveBeenCalledTimes(4); // Once per character
    });

    it("should pass the correct value to onChange", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FormField {...defaultProps} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(onChange).toHaveBeenCalledWith("a");
    });

    it("should call onChange with correct value when input changes", () => {
      const onChange = vi.fn();

      render(<FormField {...defaultProps} value="initial" onChange={onChange} />);

      const input = screen.getByRole("textbox");

      // Simulate a change event with a new value
      fireEvent.change(input, { target: { value: "initial test" } });

      expect(onChange).toHaveBeenCalledWith("initial test");
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("should not allow interaction when disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FormField {...defaultProps} disabled onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should support clearing the field", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<FormField {...defaultProps} value="test" onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.clear(input);

      expect(onChange).toHaveBeenCalledWith("");
    });
  });

  describe("Error Handling", () => {
    it("should display error message when error prop is provided", () => {
      render(<FormField {...defaultProps} error="This field is required" />);
      expect(screen.getByText("This field is required")).toBeInTheDocument();
    });

    it("should not display error message when error prop is undefined", () => {
      render(<FormField {...defaultProps} error={undefined} />);
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("should apply error styling to input when error exists", () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("border-destructive");
      expect(input).toHaveClass("focus-visible:ring-destructive");
    });

    it("should not apply error styling when no error", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).not.toHaveClass("border-destructive");
    });

    it("should display error message with alert role", () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const errorElement = screen.getByRole("alert");
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent("Error message");
    });

    it("should have correct error message styling", () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const errorElement = screen.getByRole("alert");
      expect(errorElement).toHaveClass("text-sm");
      expect(errorElement).toHaveClass("text-destructive");
    });
  });

  describe("Accessibility - ARIA Attributes", () => {
    it("should set aria-invalid to false when no error", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "false");
    });

    it("should set aria-invalid to true when error exists", () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should not have aria-describedby when no error", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole("textbox");
      expect(input).not.toHaveAttribute("aria-describedby");
    });

    it("should associate error message with input using aria-describedby", () => {
      render(<FormField {...defaultProps} error="Error message" />);
      const input = screen.getByRole("textbox");
      const errorId = input.getAttribute("aria-describedby");

      expect(errorId).toBe("testField-error");

      const errorElement = document.getElementById(errorId!);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveTextContent("Error message");
    });

    it("should have correct id for error message", () => {
      render(<FormField {...defaultProps} name="email" error="Invalid email" />);
      const errorElement = screen.getByRole("alert");
      expect(errorElement).toHaveAttribute("id", "email-error");
    });

    it("should be focusable for keyboard navigation", () => {
      render(<FormField {...defaultProps} />);
      const input = screen.getByRole("textbox");
      input.focus();
      expect(input).toHaveFocus();
    });
  });

  describe("Different Input Types", () => {
    it("should render email input correctly", () => {
      render(<FormField {...defaultProps} type="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("should render password input correctly", () => {
      render(<FormField {...defaultProps} type="password" label="Password" />);
      const input = screen.getByLabelText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("should render text input correctly", () => {
      render(<FormField {...defaultProps} type="text" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });

    it("should handle number input type", () => {
      render(<FormField {...defaultProps} type="number" label="Age" />);
      const input = screen.getByLabelText("Age");
      expect(input).toHaveAttribute("type", "number");
    });

    it("should handle tel input type", () => {
      render(<FormField {...defaultProps} type="tel" label="Phone" />);
      const input = screen.getByLabelText("Phone");
      expect(input).toHaveAttribute("type", "tel");
    });

    it("should handle url input type", () => {
      render(<FormField {...defaultProps} type="url" label="Website" />);
      const input = screen.getByLabelText("Website");
      expect(input).toHaveAttribute("type", "url");
    });
  });

  describe("Component Integration", () => {
    it("should work with form submission", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((e) => e.preventDefault());
      const onChange = vi.fn();

      const { container } = render(
        <form onSubmit={onSubmit}>
          <FormField {...defaultProps} onChange={onChange} />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "test value");

      const submitButton = screen.getByRole("button", { name: "Submit" });
      await user.click(submitButton);

      expect(onSubmit).toHaveBeenCalled();
    });

    it("should maintain separation when multiple FormFields are rendered", () => {
      render(
        <>
          <FormField {...defaultProps} label="Field 1" name="field1" />
          <FormField {...defaultProps} label="Field 2" name="field2" />
        </>
      );

      expect(screen.getByLabelText("Field 1")).toHaveAttribute("name", "field1");
      expect(screen.getByLabelText("Field 2")).toHaveAttribute("name", "field2");
    });

    it("should handle controlled component updates", async () => {
      const user = userEvent.setup();
      let value = "";
      const onChange = vi.fn((newValue: string) => {
        value = newValue;
      });

      const { rerender } = render(<FormField {...defaultProps} value={value} onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      // Simulate controlled component update
      rerender(<FormField {...defaultProps} value="a" onChange={onChange} />);

      expect((input as HTMLInputElement).value).toBe("a");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string value", () => {
      render(<FormField {...defaultProps} value="" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should handle whitespace-only value", () => {
      render(<FormField {...defaultProps} value="   " />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("   ");
    });

    it("should handle special characters in value", () => {
      const specialValue = "!@#$%^&*()_+-=[]{}|;':\",./<>?";
      render(<FormField {...defaultProps} value={specialValue} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe(specialValue);
    });

    it("should handle very long error messages", () => {
      const longError =
        "This is a very long error message that might wrap to multiple lines in the UI and should still be displayed correctly with proper styling and accessibility attributes";
      render(<FormField {...defaultProps} error={longError} />);
      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it("should handle label with special characters", () => {
      render(<FormField {...defaultProps} label="Email & Username" />);
      expect(screen.getByText("Email & Username")).toBeInTheDocument();
    });

    it("should handle name with hyphens and underscores", () => {
      render(<FormField {...defaultProps} name="user-email_address" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "user-email_address");
      expect(input).toHaveAttribute("id", "user-email_address");
    });
  });

  describe("Visual States", () => {
    it("should have proper spacing structure", () => {
      const { container } = render(<FormField {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("space-y-2");
    });

    it("should apply ml-1 to required indicator", () => {
      render(<FormField {...defaultProps} required />);
      const asterisk = screen.getByText("*");
      expect(asterisk).toHaveClass("ml-1");
    });

    it("should render with proper container structure", () => {
      const { container } = render(<FormField {...defaultProps} />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.tagName).toBe("DIV");
      expect(wrapper.children).toHaveLength(2); // Label and Input
    });

    it("should render with proper container structure including error", () => {
      const { container } = render(<FormField {...defaultProps} error="Error" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.children).toHaveLength(3); // Label, Input, and Error
    });
  });
});
