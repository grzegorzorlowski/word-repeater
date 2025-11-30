import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { Input } from "../input";
import * as React from "react";

describe("Input", () => {
  describe("Initial Rendering", () => {
    it("should render input element", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toBeInTheDocument();
    });

    it("should have default styling classes", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("flex");
      expect(input).toHaveClass("h-10");
      expect(input).toHaveClass("w-full");
      expect(input).toHaveClass("rounded-md");
    });

    it("should be empty by default", () => {
      render(<Input />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });
  });

  describe("Input Types", () => {
    it("should render text input by default", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "text");
    });

    it("should render email input", () => {
      render(<Input type="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "email");
    });

    it("should render password input", () => {
      render(<Input type="password" />);
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    it("should render number input", () => {
      render(<Input type="number" />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toBeInTheDocument();
    });

    it("should render tel input", () => {
      render(<Input type="tel" />);
      const input = document.querySelector('input[type="tel"]');
      expect(input).toBeInTheDocument();
    });

    it("should render url input", () => {
      render(<Input type="url" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("type", "url");
    });

    it("should render search input", () => {
      render(<Input type="search" />);
      const input = screen.getByRole("searchbox");
      expect(input).toHaveAttribute("type", "search");
    });
  });

  describe("Value Handling", () => {
    it("should display provided value", () => {
      render(<Input value="test value" onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("test value");
    });

    it("should update value on user input", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Input onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "hello");

      expect(onChange).toHaveBeenCalled();
    });

    it("should handle controlled component", async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState("");
        return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
      };

      render(<TestComponent />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await user.type(input, "test");

      expect(input.value).toBe("test");
    });

    it("should handle clearing value", async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState("initial");
        return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
      };

      render(<TestComponent />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await user.clear(input);

      expect(input.value).toBe("");
    });
  });

  describe("Attributes", () => {
    it("should accept placeholder", () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("placeholder", "Enter text");
    });

    it("should accept name attribute", () => {
      render(<Input name="username" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("name", "username");
    });

    it("should accept id attribute", () => {
      render(<Input id="email-input" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("id", "email-input");
    });

    it("should accept autoComplete attribute", () => {
      render(<Input autoComplete="email" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("autocomplete", "email");
    });

    it("should accept required attribute", () => {
      render(<Input required />);
      const input = screen.getByRole("textbox");
      expect(input).toBeRequired();
    });

    it("should accept disabled attribute", () => {
      render(<Input disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toBeDisabled();
    });

    it("should accept readOnly attribute", () => {
      render(<Input readOnly value="readonly" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input).toHaveAttribute("readonly");
    });

    it("should accept maxLength attribute", () => {
      render(<Input maxLength={10} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("maxlength", "10");
    });

    it("should accept minLength attribute", () => {
      render(<Input minLength={3} />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("minlength", "3");
    });
  });

  describe("Custom Styling", () => {
    it("should merge custom className", () => {
      render(<Input className="custom-class" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("custom-class");
      expect(input).toHaveClass("flex"); // Should still have default classes
    });

    it("should allow overriding default styles", () => {
      render(<Input className="h-12" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("h-12");
    });
  });

  describe("Disabled State", () => {
    it("should not accept input when disabled", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Input disabled onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      expect(onChange).not.toHaveBeenCalled();
    });

    it("should have disabled styling", () => {
      render(<Input disabled />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("disabled:cursor-not-allowed");
      expect(input).toHaveClass("disabled:opacity-50");
    });
  });

  describe("Focus States", () => {
    it("should be focusable", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      input.focus();
      expect(input).toHaveFocus();
    });

    it("should have focus-visible styles", () => {
      render(<Input />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("focus-visible:outline-none");
      expect(input).toHaveClass("focus-visible:ring-2");
    });

    it("should call onFocus handler", async () => {
      const onFocus = vi.fn();
      render(<Input onFocus={onFocus} />);

      const input = screen.getByRole("textbox");
      input.focus();

      expect(onFocus).toHaveBeenCalled();
    });

    it("should call onBlur handler", async () => {
      const onBlur = vi.fn();
      render(<Input onBlur={onBlur} />);

      const input = screen.getByRole("textbox");
      input.focus();
      input.blur();

      expect(onBlur).toHaveBeenCalled();
    });
  });

  describe("ForwardRef", () => {
    it("should forward ref to input element", () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      expect(ref.current).toBeInstanceOf(HTMLInputElement);
    });

    it("should allow imperative focus via ref", () => {
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      ref.current?.focus();

      expect(ref.current).toHaveFocus();
    });

    it("should allow accessing value via ref", async () => {
      const user = userEvent.setup();
      const ref = React.createRef<HTMLInputElement>();
      render(<Input ref={ref} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "test");

      expect(ref.current?.value).toBe("test");
    });
  });

  describe("Placeholder Styling", () => {
    it("should have placeholder styling class", () => {
      render(<Input placeholder="Enter text" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveClass("placeholder:text-muted-foreground");
    });
  });

  describe("File Input Support", () => {
    it("should support file input type", () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toBeInTheDocument();
    });

    it("should have file input specific classes", () => {
      render(<Input type="file" />);
      const input = document.querySelector('input[type="file"]');
      expect(input).toHaveClass("file:border-0");
      expect(input).toHaveClass("file:bg-transparent");
    });
  });

  describe("Accessibility - ARIA", () => {
    it("should accept aria-label", () => {
      render(<Input aria-label="Search field" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-label", "Search field");
    });

    it("should accept aria-describedby", () => {
      render(<Input aria-describedby="error-message" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-describedby", "error-message");
    });

    it("should accept aria-invalid", () => {
      render(<Input aria-invalid="true" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-invalid", "true");
    });

    it("should accept aria-required", () => {
      render(<Input aria-required="true" />);
      const input = screen.getByRole("textbox");
      expect(input).toHaveAttribute("aria-required", "true");
    });
  });

  describe("Event Handlers", () => {
    it("should call onChange handler", async () => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      render(<Input onChange={onChange} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(onChange).toHaveBeenCalled();
    });

    it("should call onKeyDown handler", async () => {
      const user = userEvent.setup();
      const onKeyDown = vi.fn();
      render(<Input onKeyDown={onKeyDown} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(onKeyDown).toHaveBeenCalled();
    });

    it("should call onKeyUp handler", async () => {
      const user = userEvent.setup();
      const onKeyUp = vi.fn();
      render(<Input onKeyUp={onKeyUp} />);

      const input = screen.getByRole("textbox");
      await user.type(input, "a");

      expect(onKeyUp).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string value", () => {
      render(<Input value="" onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("");
    });

    it("should handle whitespace value", () => {
      render(<Input value="   " onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("   ");
    });

    it("should handle special characters", async () => {
      const user = userEvent.setup();
      const TestComponent = () => {
        const [value, setValue] = React.useState("");
        return <Input value={value} onChange={(e) => setValue(e.target.value)} />;
      };

      render(<TestComponent />);

      const input = screen.getByRole("textbox") as HTMLInputElement;
      await user.type(input, "!@#$%");

      expect(input.value).toBe("!@#$%");
    });

    it("should handle very long text", async () => {
      const longText = "a".repeat(1000);
      render(<Input value={longText} onChange={() => {}} />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe(longText);
    });
  });

  describe("Number Input Specifics", () => {
    it("should accept min attribute for number input", () => {
      render(<Input type="number" min={0} />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toHaveAttribute("min", "0");
    });

    it("should accept max attribute for number input", () => {
      render(<Input type="number" max={100} />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toHaveAttribute("max", "100");
    });

    it("should accept step attribute for number input", () => {
      render(<Input type="number" step={0.01} />);
      const input = document.querySelector('input[type="number"]');
      expect(input).toHaveAttribute("step", "0.01");
    });
  });

  describe("Form Integration", () => {
    it("should work within a form", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <Input name="test" />
          <button type="submit">Submit</button>
        </form>
      );

      const input = screen.getByRole("textbox");
      await user.type(input, "test value");

      const button = screen.getByRole("button");
      await user.click(button);

      expect(onSubmit).toHaveBeenCalled();
    });

    it("should support defaultValue", () => {
      render(<Input defaultValue="default" />);
      const input = screen.getByRole("textbox") as HTMLInputElement;
      expect(input.value).toBe("default");
    });
  });
});





