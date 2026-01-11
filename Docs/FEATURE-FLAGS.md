# Feature Flags System

## Overview

The feature flags system allows you to separate deployments from releases by controlling feature availability at runtime based on the environment.

## Key Features

- ✅ **Type-safe**: Only defined feature flags can be checked (TypeScript enforced)
- ✅ **Runtime evaluation**: Flags are evaluated based on `PUBLIC_ENV_NAME` environment variable
- ✅ **Per-flag defaults**: Each flag can have its own default state
- ✅ **Environment-specific**: Configure flags per environment (local, integration, prod)
- ✅ **Universal**: Works on both frontend (Astro pages) and backend (API endpoints)

## Configuration

### Environment Variable

Set the `PUBLIC_ENV_NAME` environment variable to one of:
- `local` - Local development
- `integration` - Integration/staging environment
- `prod` - Production environment

```bash
# .env or .env.local
PUBLIC_ENV_NAME=local
```

If `PUBLIC_ENV_NAME` is not set, it defaults to `local`.

### Adding a New Feature Flag

1. Open `src/features/index.ts`
2. Add the flag name to the `FeatureFlag` type:
   ```typescript
   export type FeatureFlag = "signup" | "resetPassword" | "newFeature";
   ```
3. Add configuration in `featureFlagsConfig`:
   ```typescript
   newFeature: {
     defaultEnabled: false, // Default when environment not specified
     environments: {
       local: true,        // Enabled in local
       integration: false, // Disabled in integration
       prod: false,        // Disabled in prod
     },
   }
   ```

## Usage Examples

### In API Endpoints

#### Option 1: Using `requireFeatureEnabled` helper (recommended)

```typescript
import type { APIRoute } from "astro";
import { requireFeatureEnabled } from "@/features";

export const POST: APIRoute = async ({ request }) => {
  // Early return if feature is disabled
  const featureCheck = requireFeatureEnabled("signup", "User Registration");
  if (featureCheck) return featureCheck;
  
  // Feature is enabled, continue with normal logic
  // ... your endpoint code here
};
```

#### Option 2: Using `isFeatureEnabled` directly

```typescript
import type { APIRoute } from "astro";
import { isFeatureEnabled, createFeatureDisabledResponse } from "@/features";

export const POST: APIRoute = async ({ request }) => {
  if (!isFeatureEnabled("signup")) {
    return createFeatureDisabledResponse("User Registration");
  }
  
  // Feature is enabled, continue with normal logic
  // ... your endpoint code here
};
```

### In Astro Pages

```astro
---
import { isFeatureEnabled } from "@/features";
import AuthLayout from "@/layouts/AuthLayout.astro";
import { RegisterForm } from "@/components/auth/RegisterForm";

// Check if signup feature is enabled
if (!isFeatureEnabled("signup")) {
  // Return 403 Forbidden response
  return new Response(null, {
    status: 403,
    statusText: "Feature not available",
  });
}
---

<AuthLayout title="Create Account">
  <RegisterForm client:load />
</AuthLayout>
```

### In React Components (if needed)

You can also use feature flags in React components by passing the flag state as props:

```astro
---
import { isFeatureEnabled } from "@/features";
import MyComponent from "@/components/MyComponent";

const signupEnabled = isFeatureEnabled("signup");
---

<MyComponent signupEnabled={signupEnabled} client:load />
```

## Available Functions

### `isFeatureEnabled(flagName: FeatureFlag): boolean`

Checks if a feature flag is enabled in the current environment.

```typescript
if (isFeatureEnabled("signup")) {
  // Feature is enabled
}
```

### `requireFeatureEnabled(flagName: FeatureFlag, featureName: string): Response | null`

Checks if a feature is enabled and returns a 403 Response if not. Returns `null` if enabled.
Perfect for early returns in API endpoints.

```typescript
const featureCheck = requireFeatureEnabled("signup", "User Registration");
if (featureCheck) return featureCheck;
```

### `createFeatureDisabledResponse(featureName: string): Response`

Creates a 403 Forbidden response for a disabled feature.

```typescript
return createFeatureDisabledResponse("User Registration");
```

### `getAllFeatureFlags(): Record<FeatureFlag, boolean>`

Gets all feature flags and their current states. Useful for debugging.

```typescript
const flags = getAllFeatureFlags();
console.log(flags); // { signup: true, resetPassword: false }
```

### `getEnvironment(): Environment`

Gets the current environment name.

```typescript
const env = getEnvironment();
console.log(env); // "local" | "integration" | "prod"
```

## Current Feature Flags

| Flag | Default | Local | Integration | Prod |
|------|---------|-------|-------------|------|
| `signup` | ❌ | ✅ | ❌ | ❌ |
| `resetPassword` | ❌ | ✅ | ❌ | ❌ |

## 🔒 Security Features

### Fail-Safe Defaults

The feature flag system is designed with **security-first principles**:

1. **Missing `PUBLIC_ENV_NAME`** → Defaults to `prod` (most restrictive)
   - All features disabled by default
   - Prevents accidental feature leaks if configuration is missing
   - Explicit error logged to console

2. **Invalid `PUBLIC_ENV_NAME`** → Defaults to `prod` (most restrictive)
   - Values like `"development"`, `"staging"`, `"test"` are rejected
   - Only `local`, `integration`, and `prod` are valid
   - Error logged with list of valid values

3. **Type Safety** → Compile-time checking
   - Only defined feature flags can be checked
   - Prevents typos in flag names
   - IDE autocomplete support

### Why Default to Prod?

**Old behavior (unsafe):**
```typescript
// ❌ DANGEROUS: Forget PUBLIC_ENV_NAME → features enabled
PUBLIC_ENV_NAME not set → defaults to "local" → all features enabled
```

**New behavior (secure):**
```typescript
// ✅ SAFE: Forget PUBLIC_ENV_NAME → features disabled
PUBLIC_ENV_NAME not set → defaults to "prod" → all features disabled
```

**Rationale:**
- Better to break in development than leak features in production
- Forces explicit configuration
- Follows principle of "secure by default"
- Developers will immediately notice and fix missing `PUBLIC_ENV_NAME`

```json
{
  "error": "Feature not available",
  "message": "The User Registration feature is currently disabled"
}
```

HTTP Status: `403 Forbidden`

## Testing

You can test different environments by setting the `PUBLIC_ENV_NAME` variable:

```bash
# Test in local mode
PUBLIC_ENV_NAME=local npm run dev

# Test in integration mode
PUBLIC_ENV_NAME=integration npm run dev

# Test in production mode
PUBLIC_ENV_NAME=prod npm run dev
```

## Best Practices

1. **Always use type-safe flag names** - TypeScript will prevent typos
2. **Use descriptive feature names** - Make it clear what the feature does
3. **Set appropriate defaults** - Consider what happens if the environment config is missing
4. **Document flag purposes** - Add comments explaining what each flag controls
5. **Clean up old flags** - Remove flags once features are fully released
6. **Test all environments** - Verify flag behavior in each environment before deploying
