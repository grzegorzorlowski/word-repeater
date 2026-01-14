/**
 * Feature Flags - Usage Examples
 *
 * This file contains practical examples of how to use the feature flag system
 * in different parts of the application.
 */

// ============================================================================
// Example 1: API Endpoint with requireFeatureEnabled (Recommended)
// ============================================================================

/*
// src/pages/api/auth/register.ts
import type { APIRoute } from "astro";
import { requireFeatureEnabled } from "@/features";

export const POST: APIRoute = async ({ request, cookies }) => {
  // Early return if feature is disabled - returns 403 automatically
  const featureCheck = requireFeatureEnabled("signup", "User Registration");
  if (featureCheck) return featureCheck;
  
  // Feature is enabled, continue with normal logic
  try {
    const body = await request.json();
    // ... rest of your endpoint code
  } catch (error) {
    // ... error handling
  }
};
*/

// ============================================================================
// Example 2: API Endpoint with isFeatureEnabled
// ============================================================================

/*
// src/pages/api/auth/some-endpoint.ts
import type { APIRoute } from "astro";
import { isFeatureEnabled, createFeatureDisabledResponse } from "@/features";

export const POST: APIRoute = async ({ request }) => {
  // Manual check with custom response
  if (!isFeatureEnabled("signup")) {
    return createFeatureDisabledResponse("User Registration");
  }
  
  // Or with completely custom error response
  if (!isFeatureEnabled("resetPassword")) {
    return new Response(
      JSON.stringify({
        error: "Password reset is temporarily unavailable",
        contact: "support@example.com"
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
  
  // Feature is enabled, continue...
};
*/

// ============================================================================
// Example 3: Astro Page with Feature Flag
// ============================================================================

/*
// src/pages/register.astro
---
import { isFeatureEnabled } from "@/features";
import AuthLayout from "@/layouts/AuthLayout.astro";
import { RegisterForm } from "@/components/auth/RegisterForm";

// Check if signup feature is enabled
if (!isFeatureEnabled("signup")) {
  return new Response(null, {
    status: 403,
    statusText: "Feature not available",
  });
}
---

<AuthLayout title="Create Account">
  <div class="space-y-6">
    <h1>Create Account</h1>
    <RegisterForm client:load />
  </div>
</AuthLayout>
*/

// ============================================================================
// Example 4: Astro Page with Custom 403 Page
// ============================================================================

/*
// src/pages/some-feature.astro
---
import { isFeatureEnabled } from "@/features";
import MainLayout from "@/layouts/MainLayout.astro";

const featureEnabled = isFeatureEnabled("signup");
---

<MainLayout title="Feature Page">
  {featureEnabled ? (
    <div>
      <!-- Your feature content here -->
      <h1>Welcome to the Feature</h1>
    </div>
  ) : (
    <div class="text-center py-12">
      <h1 class="text-2xl font-bold">Feature Not Available</h1>
      <p class="text-muted-foreground mt-2">
        This feature is currently unavailable.
      </p>
    </div>
  )}
</MainLayout>
*/

// ============================================================================
// Example 5: Conditional Rendering in Components
// ============================================================================

/*
// src/pages/dashboard.astro
---
import { isFeatureEnabled } from "@/features";
import DashboardLayout from "@/layouts/DashboardLayout.astro";

const signupEnabled = isFeatureEnabled("signup");
const resetPasswordEnabled = isFeatureEnabled("resetPassword");
---

<DashboardLayout>
  <div>
    <h1>Dashboard</h1>
    
    {signupEnabled && (
      <a href="/register" class="button">
        Create New User
      </a>
    )}
    
    {resetPasswordEnabled && (
      <a href="/forgot-password" class="button">
        Reset Password
      </a>
    )}
  </div>
</DashboardLayout>
*/

// ============================================================================
// Example 6: Multiple Feature Checks
// ============================================================================

/*
// src/pages/api/admin/users.ts
import type { APIRoute } from "astro";
import { isFeatureEnabled } from "@/features";

export const POST: APIRoute = async ({ request }) => {
  const { action } = await request.json();
  
  // Different actions require different feature flags
  if (action === "create" && !isFeatureEnabled("signup")) {
    return new Response(
      JSON.stringify({ error: "User creation is disabled" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  
  if (action === "resetPassword" && !isFeatureEnabled("resetPassword")) {
    return new Response(
      JSON.stringify({ error: "Password reset is disabled" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }
  
  // Process the action...
};
*/

// ============================================================================
// Example 7: Debugging - View All Flags
// ============================================================================

/*
// src/pages/api/debug/feature-flags.ts (dev only)
import type { APIRoute } from "astro";
import { getAllFeatureFlags, getEnvironment } from "@/features";

export const GET: APIRoute = async () => {
  // Only allow in non-production environments
  if (getEnvironment() === "prod") {
    return new Response(null, { status: 404 });
  }
  
  const flags = getAllFeatureFlags();
  const environment = getEnvironment();
  
  return new Response(
    JSON.stringify({
      environment,
      flags,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};
*/

// ============================================================================
// Example 8: Passing Flags to React Components
// ============================================================================

/*
// src/pages/settings.astro
---
import { isFeatureEnabled } from "@/features";
import SettingsLayout from "@/layouts/SettingsLayout.astro";
import UserSettings from "@/components/UserSettings";

const canResetPassword = isFeatureEnabled("resetPassword");
---

<SettingsLayout>
  <UserSettings 
    canResetPassword={canResetPassword}
    client:load 
  />
</SettingsLayout>

// src/components/UserSettings.tsx
interface UserSettingsProps {
  canResetPassword: boolean;
}

export default function UserSettings({ canResetPassword }: UserSettingsProps) {
  return (
    <div>
      <h2>Settings</h2>
      {canResetPassword && (
        <button onClick={handleResetPassword}>
          Reset Password
        </button>
      )}
    </div>
  );
}
*/

// ============================================================================
// Example 9: Middleware Integration (Optional)
// ============================================================================

/*
// src/middleware/featureFlags.ts
import type { MiddlewareHandler } from "astro";
import { isFeatureEnabled } from "@/features";

// Map of routes to their required feature flags
const protectedRoutes: Record<string, { flag: FeatureFlag; name: string }> = {
  "/register": { flag: "signup", name: "User Registration" },
  "/reset-password": { flag: "resetPassword", name: "Password Reset" },
};

export const featureFlagMiddleware: MiddlewareHandler = async (context, next) => {
  const pathname = context.url.pathname;
  const route = protectedRoutes[pathname];
  
  if (route && !isFeatureEnabled(route.flag)) {
    return new Response(null, {
      status: 403,
      statusText: `${route.name} is not available`,
    });
  }
  
  return next();
};
*/

export {};
