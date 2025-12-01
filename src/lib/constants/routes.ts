/**
 * Route constants
 * Defines public and protected paths used across the application
 */

/**
 * Public paths that don't require authentication
 * These routes are accessible without being logged in
 */
export const PUBLIC_PATHS = [
  // Auth pages
  "/login",
  "/register",
  "/logout",
  "/forgot-password",
  "/reset-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
] as const;

/**
 * Checks if a given pathname is a public path
 */
export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number]);
}
