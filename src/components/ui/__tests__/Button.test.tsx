import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@/test/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { Button } from "../button";

describe("Button", () => {
  describe("Initial Rendering", () => {
    it("should render button with text", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole("button", { name: "Click me" })).toBeInTheDocument();
    });

    it("should render button with default variant", () => {
      render(<Button>Default Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");
      expect(button).toHaveClass("text-primary-foreground");
    });

    it("should render button with default size", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
      expect(button).toHaveClass("px-4");
    });

    it("should have data-slot attribute", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-slot", "button");
    });
  });

  describe("Variant Styles", () => {
    it("should apply default variant styles", () => {
      render(<Button variant="default">Default</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");
      expect(button).toHaveClass("text-primary-foreground");
    });

    it("should apply destructive variant styles", () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
      expect(button).toHaveClass("text-white");
    });

    it("should apply outline variant styles", () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("bg-background");
    });

    it("should apply secondary variant styles", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-secondary");
      expect(button).toHaveClass("text-secondary-foreground");
    });

    it("should apply ghost variant styles", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("should apply link variant styles", () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-primary");
      expect(button).toHaveClass("underline-offset-4");
    });
  });

  describe("Size Variants", () => {
    it("should apply default size", () => {
      render(<Button size="default">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-9");
      expect(button).toHaveClass("px-4");
    });

    it("should apply small size", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-8");
      expect(button).toHaveClass("px-3");
    });

    it("should apply large size", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("h-10");
      expect(button).toHaveClass("px-6");
    });

    it("should apply icon size", () => {
      render(<Button size="icon">Icon</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("size-9");
    });
  });

  describe("Button States", () => {
    it("should be enabled by default", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).not.toBeDisabled();
    });

    it("should be disabled when disabled prop is true", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });

    it("should have disabled styles when disabled", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("disabled:pointer-events-none");
      expect(button).toHaveClass("disabled:opacity-50");
    });

    it("should be clickable when not disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should not trigger onClick when disabled", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick} disabled>Click</Button>);

      const button = screen.getByRole("button");
      await user.click(button);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Click Handlers", () => {
    it("should call onClick handler when clicked", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it("should call onClick with event object", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);

      await user.click(screen.getByRole("button"));

      expect(onClick).toHaveBeenCalledWith(expect.any(Object));
    });

    it("should support multiple clicks", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click me</Button>);

      const button = screen.getByRole("button");
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(onClick).toHaveBeenCalledTimes(3);
    });
  });

  describe("Button Type", () => {
    it("should have button type by default", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "button");
    });

    it("should accept submit type", () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "submit");
    });

    it("should accept reset type", () => {
      render(<Button type="reset">Reset</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("type", "reset");
    });
  });

  describe("Custom Styling", () => {
    it("should merge custom className", () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("custom-class");
      expect(button).toHaveClass("bg-primary"); // Should still have default styles
    });

    it("should allow overriding default classes", () => {
      render(<Button className="bg-blue-500">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-blue-500");
    });
  });

  describe("asChild Prop", () => {
    it("should render as button by default", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button.tagName).toBe("BUTTON");
    });

    it("should render child element when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link</a>
        </Button>
      );
      const link = screen.getByRole("link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });

    it("should apply button styles to child element with asChild", () => {
      render(
        <Button asChild variant="destructive">
          <a href="/delete">Delete</a>
        </Button>
      );
      const link = screen.getByRole("link");
      expect(link).toHaveClass("bg-destructive");
    });

    it("should pass data-slot to child element", () => {
      render(
        <Button asChild>
          <a href="/test">Link</a>
        </Button>
      );
      const link = screen.getByRole("link");
      expect(link).toHaveAttribute("data-slot", "button");
    });
  });

  describe("Children and Content", () => {
    it("should render text content", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("should render with icon and text", () => {
      render(
        <Button>
          <svg data-testid="icon" />
          <span>With Icon</span>
        </Button>
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
      expect(screen.getByText("With Icon")).toBeInTheDocument();
    });

    it("should render with only icon", () => {
      render(
        <Button size="icon" aria-label="Icon button">
          <svg data-testid="icon" />
        </Button>
      );
      expect(screen.getByTestId("icon")).toBeInTheDocument();
    });

    it("should handle empty children", () => {
      render(<Button></Button>);
      const button = screen.getByRole("button");
      expect(button).toBeInTheDocument();
      expect(button.textContent).toBe("");
    });
  });

  describe("Accessibility", () => {
    it("should have button role", () => {
      render(<Button>Button</Button>);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should accept aria-label", () => {
      render(<Button aria-label="Close dialog">X</Button>);
      const button = screen.getByRole("button", { name: "Close dialog" });
      expect(button).toBeInTheDocument();
    });

    it("should accept aria-describedby", () => {
      render(<Button aria-describedby="description">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-describedby", "description");
    });

    it("should be keyboard accessible", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Button</Button>);

      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(onClick).toHaveBeenCalled();
    });

    it("should support Space key activation", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Button</Button>);

      const button = screen.getByRole("button");
      button.focus();

      await user.keyboard(" ");
      expect(onClick).toHaveBeenCalled();
    });

    it("should have focus-visible styles", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("focus-visible:ring-ring/50");
      expect(button).toHaveClass("focus-visible:border-ring");
    });
  });

  describe("Variant Combinations", () => {
    it("should combine variant and size", () => {
      render(
        <Button variant="destructive" size="lg">
          Large Delete
        </Button>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
      expect(button).toHaveClass("h-10");
    });

    it("should combine variant, size, and custom className", () => {
      render(
        <Button variant="outline" size="sm" className="custom">
          Small Outline
        </Button>
      );
      const button = screen.getByRole("button");
      expect(button).toHaveClass("border");
      expect(button).toHaveClass("h-8");
      expect(button).toHaveClass("custom");
    });
  });

  describe("Common Use Cases", () => {
    it("should work as form submit button", async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((e) => e.preventDefault());

      render(
        <form onSubmit={onSubmit}>
          <Button type="submit">Submit Form</Button>
        </form>
      );

      await user.click(screen.getByRole("button"));

      expect(onSubmit).toHaveBeenCalled();
    });

    it("should work with loading state", () => {
      render(
        <Button disabled>
          <svg className="animate-spin" data-testid="spinner" />
          Loading...
        </Button>
      );

      expect(screen.getByTestId("spinner")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
      expect(screen.getByRole("button")).toBeDisabled();
    });

    it("should work as delete button with confirmation", async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn();

      render(
        <Button variant="destructive" onClick={onDelete}>
          Delete Item
        </Button>
      );

      await user.click(screen.getByRole("button"));

      expect(onDelete).toHaveBeenCalled();
    });

    it("should work in button group", () => {
      render(
        <div role="group">
          <Button variant="outline">Left</Button>
          <Button variant="outline">Center</Button>
          <Button variant="outline">Right</Button>
        </div>
      );

      const buttons = screen.getAllByRole("button");
      expect(buttons).toHaveLength(3);
      buttons.forEach((button) => {
        expect(button).toHaveClass("border");
      });
    });
  });

  describe("HTML Attributes", () => {
    it("should accept id attribute", () => {
      render(<Button id="my-button">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("id", "my-button");
    });

    it("should accept name attribute", () => {
      render(<Button name="action">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("name", "action");
    });

    it("should accept value attribute", () => {
      render(<Button value="submit">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("value", "submit");
    });

    it("should accept data attributes", () => {
      render(<Button data-testid="custom-button" data-action="save">Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("data-testid", "custom-button");
      expect(button).toHaveAttribute("data-action", "save");
    });
  });

  describe("Base Styles", () => {
    it("should have base styling classes", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("inline-flex");
      expect(button).toHaveClass("items-center");
      expect(button).toHaveClass("justify-center");
      expect(button).toHaveClass("rounded-md");
    });

    it("should have transition classes", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("transition-all");
    });

    it("should have text styling", () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole("button");
      expect(button).toHaveClass("text-sm");
      expect(button).toHaveClass("font-medium");
    });
  });

  describe("Edge Cases", () => {
    it("should handle rapid clicks", async () => {
      const user = userEvent.setup();
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);

      const button = screen.getByRole("button");
      await user.tripleClick(button);

      expect(onClick).toHaveBeenCalled();
    });

    it("should handle very long text content", () => {
      const longText = "This is a very long button text that might cause layout issues if not handled properly";
      render(<Button>{longText}</Button>);
      expect(screen.getByText(longText)).toBeInTheDocument();
    });

    it("should handle special characters in content", () => {
      render(<Button>Save & Exit</Button>);
      expect(screen.getByText("Save & Exit")).toBeInTheDocument();
    });
  });

  describe("Rerender Behavior", () => {
    it("should update when props change", () => {
      const { rerender } = render(<Button variant="default">Default</Button>);

      let button = screen.getByRole("button");
      expect(button).toHaveClass("bg-primary");

      rerender(<Button variant="destructive">Destructive</Button>);

      button = screen.getByRole("button");
      expect(button).toHaveClass("bg-destructive");
    });

    it("should update disabled state", () => {
      const { rerender } = render(<Button disabled={false}>Button</Button>);

      let button = screen.getByRole("button");
      expect(button).not.toBeDisabled();

      rerender(<Button disabled={true}>Button</Button>);

      button = screen.getByRole("button");
      expect(button).toBeDisabled();
    });
  });
});




