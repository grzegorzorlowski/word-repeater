# Features Module

This module contains the feature flag system for controlling feature availability across different environments.

## 📁 Structure

```
src/features/
├── index.ts          # Core feature flag system (import from here)
├── index.test.ts     # Test suite with 27 tests
├── examples.ts       # Commented usage examples
└── README.md         # This file
```

## 🎯 Purpose

Separate deployments from releases by controlling feature availability at runtime based on the `ENV_NAME` environment variable.

## 🚀 Quick Import

```typescript
// Import what you need
import { 
  isFeatureEnabled,           // Check if feature is enabled
  requireFeatureEnabled,      // Check + return 403 if disabled
  createFeatureDisabledResponse, // Create 403 response
  getAllFeatureFlags,         // Get all flags (debugging)
  getEnvironment,             // Get current environment
  type FeatureFlag,           // Type for flag names
  type Environment,           // Type for environment names
} from "@/features";
```

## 📖 Usage Patterns

### Pattern 1: API Endpoint (Recommended)
```typescript
export const POST: APIRoute = async ({ request }) => {
  const check = requireFeatureEnabled("signup", "User Registration");
  if (check) return check;
  // ... feature code
};
```

### Pattern 2: Astro Page
```astro
---
import { isFeatureEnabled } from "@/features";

if (!isFeatureEnabled("signup")) {
  return new Response(null, { status: 403 });
}
---
```

### Pattern 3: Conditional Rendering
```astro
---
import { isFeatureEnabled } from "@/features";
const showFeature = isFeatureEnabled("signup");
---

{showFeature && <div>Feature content</div>}
```

## 🔒 Type Safety

The system enforces type safety at compile time:

```typescript
isFeatureEnabled("signup")     // ✅ Valid
isFeatureEnabled("typo")       // ❌ TypeScript error
isFeatureEnabled("newFeature") // ❌ TypeScript error (until added to type)
```

## 🌍 Environments

- **`local`** - Local development
- **`integration`** - Integration/staging
- **`prod`** - Production

Set via `ENV_NAME` environment variable. Defaults to `local` if not set.

## 📋 Current Flags

| Flag | Default | Local | Integration | Prod |
|------|---------|-------|-------------|------|
| `signup` | ❌ | ✅ | ❌ | ❌ |
| `resetPassword` | ❌ | ✅ | ❌ | ❌ |

## ➕ Adding New Flags

1. Open `index.ts`
2. Add flag name to `FeatureFlag` type
3. Add configuration to `featureFlagsConfig`
4. Use the new flag in your code

TypeScript will ensure the flag is properly configured.

## 🧪 Testing

```bash
# Run test suite
npm run test src/features/index.test.ts

# Test with different environments
ENV_NAME=local npm run dev
ENV_NAME=integration npm run dev
ENV_NAME=prod npm run dev
```

## 📚 Documentation

- **Quick Reference**: `Docs/FEATURE-FLAGS-QUICKREF.md`
- **Complete Guide**: `Docs/FEATURE-FLAGS.md`
- **Implementation Details**: `Docs/FEATURE-FLAGS-IMPLEMENTATION.md`
- **Code Examples**: `examples.ts` (in this folder)

## 🔍 Debugging

```typescript
import { getAllFeatureFlags, getEnvironment } from "@/features";

console.log("Environment:", getEnvironment());
console.log("Flags:", getAllFeatureFlags());
// Output:
// Environment: local
// Flags: { signup: true, resetPassword: true }
```

## 🎯 Design Principles

1. **Type-safe first** - No runtime string typos
2. **Fail securely** - Features default to disabled
3. **Runtime evaluation** - Change without rebuilding
4. **Environment-specific** - Different configs per environment
5. **Simple API** - Easy to understand and use

## 📝 Response Format

When a feature is disabled, API endpoints return:

```json
{
  "error": "Feature not available",
  "message": "The User Registration feature is currently disabled"
}
```

**HTTP Status**: 403 Forbidden

## 🔗 Implementation Examples

See `examples.ts` for detailed examples including:
- API endpoints with feature flags
- Astro pages with feature flags
- React components with feature flags
- Middleware integration
- Debugging utilities
- And more...

## ⚡ Performance

- **Zero overhead** when feature is enabled
- **Minimal overhead** when disabled (early return)
- **No database calls** - pure in-memory evaluation
- **Cached environment** - read once per request

## 🛡️ Security

- Features are disabled by default
- 403 Forbidden returned for disabled features
- No information leakage about disabled features
- Type-safe prevents accidental flag names
