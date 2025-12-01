import { describe, it, expect } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import { Label } from "../label";
import * as React from "react";

describe("Label", () => {
  describe("Initial Rendering", () => {
    it("should render label element", () => {
      render(<Label>Test Label</Label>);
      expect(screen.getByText("Test Label")).toBeInTheDocument();
    });

    it("should have default styling classes", () => {
      render(<Label>Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveClass("text-sm");
      expect(label).toHaveClass("font-medium");
      expect(label).toHaveClass("leading-none");
    });

    it("should render as label element", () => {
      render(<Label>Label</Label>);
      const label = screen.getByText("Label");
      expect(label.tagName).toBe("LABEL");
    });
  });

  describe("Children Content", () => {
    it("should render text children", () => {
      render(<Label>Simple Text</Label>);
      expect(screen.getByText("Simple Text")).toBeInTheDocument();
    });

    it("should render complex children", () => {
      render(
        <Label>
          <span>Part 1</span>
          <span>Part 2</span>
        </Label>
      );
      expect(screen.getByText("Part 1")).toBeInTheDocument();
      expect(screen.getByText("Part 2")).toBeInTheDocument();
    });

    it("should render children with special characters", () => {
      render(<Label>Email & Username</Label>);
      expect(screen.getByText("Email & Username")).toBeInTheDocument();
    });

    it("should handle empty children", () => {
      render(<Label></Label>);
      const label = document.querySelector("label");
      expect(label).toBeInTheDocument();
      expect(label?.textContent).toBe("");
    });
  });

  describe("HtmlFor Association", () => {
    it("should accept htmlFor attribute", () => {
      render(<Label htmlFor="input-id">Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("for", "input-id");
    });

    it("should associate with input via htmlFor", () => {
      render(
        <>
          <Label htmlFor="test-input">Test Label</Label>
          <input id="test-input" />
        </>
      );
      const label = screen.getByText("Test Label");
      const input = document.getElementById("test-input");

      expect(label).toHaveAttribute("for", "test-input");
      expect(input).toBeInTheDocument();
    });

    it("should click associated input when label is clicked", () => {
      const { container } = render(
        <>
          <Label htmlFor="clickable-input">Clickable Label</Label>
          <input id="clickable-input" type="checkbox" />
        </>
      );

      const label = screen.getByText("Clickable Label");
      const input = container.querySelector("#clickable-input") as HTMLInputElement;

      expect(input.checked).toBe(false);
      label.click();
      expect(input.checked).toBe(true);
    });
  });

  describe("Custom Styling", () => {
    it("should merge custom className", () => {
      render(<Label className="custom-class">Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveClass("custom-class");
      expect(label).toHaveClass("text-sm"); // Should still have default classes
    });

    it("should allow overriding default styles", () => {
      render(<Label className="text-lg">Large Label</Label>);
      const label = screen.getByText("Large Label");
      expect(label).toHaveClass("text-lg");
    });

    it("should support multiple custom classes", () => {
      render(<Label className="text-red-500 font-bold">Styled Label</Label>);
      const label = screen.getByText("Styled Label");
      expect(label).toHaveClass("text-red-500");
      expect(label).toHaveClass("font-bold");
    });
  });

  describe("Disabled State Styling", () => {
    it("should have peer-disabled styling classes", () => {
      render(<Label>Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveClass("peer-disabled:cursor-not-allowed");
      expect(label).toHaveClass("peer-disabled:opacity-70");
    });

    it("should work with disabled peer input", () => {
      const { container } = render(
        <>
          <input id="disabled-input" className="peer" disabled />
          <Label htmlFor="disabled-input">Disabled Input Label</Label>
        </>
      );

      const label = screen.getByText("Disabled Input Label");
      expect(label).toHaveClass("peer-disabled:cursor-not-allowed");
    });
  });

  describe("ForwardRef", () => {
    it("should forward ref to label element", () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref}>Label with Ref</Label>);

      expect(ref.current).toBeInstanceOf(HTMLLabelElement);
    });

    it("should allow accessing label properties via ref", () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(
        <Label ref={ref} htmlFor="test">
          Test Label
        </Label>
      );

      expect(ref.current?.htmlFor).toBe("test");
      expect(ref.current?.textContent).toBe("Test Label");
    });

    it("should support imperative operations via ref", () => {
      const ref = React.createRef<HTMLLabelElement>();
      render(<Label ref={ref}>Focusable Label</Label>);

      ref.current?.focus();

      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe("Accessibility", () => {
    it("should be a semantic label element", () => {
      render(<Label htmlFor="input">Accessible Label</Label>);
      const labels = document.querySelectorAll("label");
      expect(labels.length).toBeGreaterThan(0);
    });

    it("should support aria-label", () => {
      render(<Label aria-label="Additional context">Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("aria-label", "Additional context");
    });

    it("should support aria-describedby", () => {
      render(<Label aria-describedby="description">Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("aria-describedby", "description");
    });

    it("should support id for referencing", () => {
      render(<Label id="main-label">Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("id", "main-label");
    });
  });

  describe("HTML Attributes", () => {
    it("should accept id attribute", () => {
      render(<Label id="my-label">Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("id", "my-label");
    });

    it("should accept data attributes", () => {
      render(<Label data-testid="custom-label" data-type="primary">Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("data-testid", "custom-label");
      expect(label).toHaveAttribute("data-type", "primary");
    });

    it("should accept title attribute", () => {
      render(<Label title="Tooltip text">Label</Label>);
      const label = screen.getByText("Label");
      expect(label).toHaveAttribute("title", "Tooltip text");
    });
  });

  describe("Required Field Indicator", () => {
    it("should support rendering required indicator", () => {
      render(
        <Label>
          Field Name<span className="text-destructive">*</span>
        </Label>
      );
      expect(screen.getByText("Field Name")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should style required indicator correctly", () => {
      render(
        <Label>
          Required Field<span className="text-destructive ml-1">*</span>
        </Label>
      );
      const asterisk = screen.getByText("*");
      expect(asterisk).toHaveClass("text-destructive");
      expect(asterisk).toHaveClass("ml-1");
    });
  });

  describe("Integration with Form Fields", () => {
    it("should work with text input", () => {
      render(
        <div>
          <Label htmlFor="text-input">Text Input</Label>
          <input id="text-input" type="text" />
        </div>
      );

      const label = screen.getByText("Text Input");
      const input = document.getElementById("text-input");

      expect(label).toHaveAttribute("for", "text-input");
      expect(input).toBeInTheDocument();
    });

    it("should work with checkbox input", () => {
      render(
        <div>
          <Label htmlFor="checkbox">Accept Terms</Label>
          <input id="checkbox" type="checkbox" />
        </div>
      );

      const label = screen.getByText("Accept Terms");
      const checkbox = document.getElementById("checkbox");

      expect(label).toHaveAttribute("for", "checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("should work with textarea", () => {
      render(
        <div>
          <Label htmlFor="textarea">Description</Label>
          <textarea id="textarea" />
        </div>
      );

      const label = screen.getByText("Description");
      const textarea = document.getElementById("textarea");

      expect(label).toHaveAttribute("for", "textarea");
      expect(textarea).toBeInTheDocument();
    });

    it("should work with select", () => {
      render(
        <div>
          <Label htmlFor="select">Choose Option</Label>
          <select id="select">
            <option>Option 1</option>
          </select>
        </div>
      );

      const label = screen.getByText("Choose Option");
      const select = document.getElementById("select");

      expect(label).toHaveAttribute("for", "select");
      expect(select).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long text", () => {
      const longText = "This is a very long label text that might wrap to multiple lines in the UI";
      render(<Label>{longText}</Label>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("should handle unicode characters", () => {
      render(<Label>Email 📧</Label>);
      expect(screen.getByText("Email 📧")).toBeInTheDocument();
    });

    it("should handle multiple spaces", () => {
      render(<Label>Label    with    spaces</Label>);
      expect(screen.getByText(/Label\s+with\s+spaces/)).toBeInTheDocument();
    });
  });

  describe("Rerender Behavior", () => {
    it("should update when children change", () => {
      const { rerender } = render(<Label>Original</Label>);
      expect(screen.getByText("Original")).toBeInTheDocument();

      rerender(<Label>Updated</Label>);
      expect(screen.getByText("Updated")).toBeInTheDocument();
      expect(screen.queryByText("Original")).not.toBeInTheDocument();
    });

    it("should update when htmlFor changes", () => {
      const { rerender } = render(<Label htmlFor="input1">Label</Label>);
      let label = screen.getByText("Label");
      expect(label).toHaveAttribute("for", "input1");

      rerender(<Label htmlFor="input2">Label</Label>);
      label = screen.getByText("Label");
      expect(label).toHaveAttribute("for", "input2");
    });

    it("should update when className changes", () => {
      const { rerender } = render(<Label className="class1">Label</Label>);
      let label = screen.getByText("Label");
      expect(label).toHaveClass("class1");

      rerender(<Label className="class2">Label</Label>);
      label = screen.getByText("Label");
      expect(label).toHaveClass("class2");
      expect(label).not.toHaveClass("class1");
    });
  });

  describe("Multiple Labels", () => {
    it("should render multiple labels independently", () => {
      render(
        <>
          <Label htmlFor="input1">Label 1</Label>
          <Label htmlFor="input2">Label 2</Label>
          <Label htmlFor="input3">Label 3</Label>
        </>
      );

      expect(screen.getByText("Label 1")).toHaveAttribute("for", "input1");
      expect(screen.getByText("Label 2")).toHaveAttribute("for", "input2");
      expect(screen.getByText("Label 3")).toHaveAttribute("for", "input3");
    });

    it("should maintain styling across multiple labels", () => {
      render(
        <>
          <Label>Label 1</Label>
          <Label>Label 2</Label>
        </>
      );

      const labels = screen.getAllByText(/Label \d/);
      labels.forEach((label) => {
        expect(label).toHaveClass("text-sm");
        expect(label).toHaveClass("font-medium");
      });
    });
  });
});






