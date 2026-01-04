import { describe, it, expect } from "vitest";
import { cn } from "../utils";

describe("utils", () => {
  describe("cn (className utility)", () => {
    it("should merge Tailwind classes correctly", () => {
      const result = cn("text-red-500", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle conflicting classes by keeping the last one", () => {
      const result = cn("text-red-500", "text-blue-500");
      expect(result).toBe("text-blue-500");
    });

    it("should handle clsx-style conditional classes", () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn("text-red-500", isActive && "bg-blue-500", isDisabled && "border");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle object-style conditional classes", () => {
      const result = cn("text-red-500", {
        "bg-blue-500": true,
        border: false,
        "p-4": true,
      });
      expect(result).toBe("text-red-500 bg-blue-500 p-4");
    });

    it("should handle undefined and null values", () => {
      const result = cn("text-red-500", undefined, null, "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle empty strings", () => {
      const result = cn("text-red-500", "", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle single class argument", () => {
      const result = cn("text-red-500");
      expect(result).toBe("text-red-500");
    });

    it("should handle no arguments", () => {
      const result = cn();
      expect(result).toBe("");
    });

    it("should handle array of classes", () => {
      const result = cn(["text-red-500", "bg-blue-500"]);
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle nested arrays", () => {
      const result = cn(["text-red-500", ["bg-blue-500", "p-4"]]);
      expect(result).toBe("text-red-500 bg-blue-500 p-4");
    });

    it("should properly merge responsive variants", () => {
      const result = cn("text-sm", "md:text-lg", "lg:text-xl");
      expect(result).toBe("text-sm md:text-lg lg:text-xl");
    });

    it("should properly merge pseudo-classes", () => {
      const result = cn("hover:text-red-500", "focus:text-blue-500");
      expect(result).toBe("hover:text-red-500 focus:text-blue-500");
    });

    it("should handle Tailwind arbitrary values", () => {
      const result = cn("w-[123px]", "h-[456px]");
      expect(result).toBe("w-[123px] h-[456px]");
    });

    it("should handle complex Tailwind classes", () => {
      const result = cn(
        "flex",
        "items-center",
        "justify-between",
        "px-4",
        "py-2",
        "bg-gray-100",
        "hover:bg-gray-200",
        "rounded-md",
        "transition-colors"
      );
      expect(result).toBe(
        "flex items-center justify-between px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
      );
    });

    it("should deduplicate identical classes", () => {
      const result = cn("text-red-500", "text-red-500", "bg-blue-500");
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle classes with important modifier", () => {
      const result = cn("text-red-500", "bg-blue-500!");
      expect(result).toBe("text-red-500 bg-blue-500!");
    });

    it("should preserve order of classes when merging", () => {
      const result = cn("p-2", "p-4", "m-2", "m-4");
      // Last conflicting class wins
      expect(result).toBe("p-4 m-4");
    });

    it("should handle empty array", () => {
      const result = cn([]);
      expect(result).toBe("");
    });

    it("should handle array with empty strings", () => {
      const result = cn(["text-red-500", "", "bg-blue-500"]);
      expect(result).toBe("text-red-500 bg-blue-500");
    });

    it("should handle mixed argument types", () => {
      const result = cn("text-red-500", ["bg-blue-500", "p-4"], { "m-2": true, border: false }, undefined, null, "");
      expect(result).toBe("text-red-500 bg-blue-500 p-4 m-2");
    });
  });
});
