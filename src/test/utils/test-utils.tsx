import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";

/**
 * Custom render function with common providers
 * Extend this as you add more providers (e.g., Router, Theme, etc.)
 */
const customRender = (ui: ReactElement, options?: RenderOptions) => {
  return render(ui, { ...options });
};

export * from "@testing-library/react";
export { customRender as render };
