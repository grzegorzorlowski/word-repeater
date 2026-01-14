# Feature Flags - Quick Reference

## 🚀 Quick Start

### 1. Set Environment Variable
```bash
PUBLIC_ENV_NAME=local    # or "integration" or "prod"
```

### 2. Use in API Endpoint
```typescript
import { requireFeatureEnabled } from "@/features";

export const POST: APIRoute = async ({ request }) => {
  const check = requireFeatureEnabled("signup", "User Registration");
  if (check) return check;
  // ... your code
};
```

### 3. Use in Astro Page
```astro
---
import { isFeatureEnabled } from "@/features";

if (!isFeatureEnabled("signup")) {
  return new Response(null, { status: 403 });
}
---
```

## 📋 Available Flags

| Flag | Local | Integration | Prod |
|------|-------|-------------|------|
| `signup` | ✅ | ❌ | ❌ |
| `resetPassword` | ✅ | ❌ | ❌ |

## 🔧 Functions

```typescript
// Check if feature is enabled
isFeatureEnabled("signup") // → boolean

// Check + return 403 if disabled (for APIs)
requireFeatureEnabled("signup", "User Registration") // → Response | null

// Create 403 response
createFeatureDisabledResponse("Feature Name") // → Response

// Get all flags (debugging)
getAllFeatureFlags() // → { signup: true, ... }

// Get current environment
getEnvironment() // → "local" | "integration" | "prod"
```

## ➕ Add New Flag

1. Edit `src/features/index.ts`
2. Add to type: `export type FeatureFlag = "signup" | "newFlag";`
3. Add config:
```typescript
newFlag: {
  defaultEnabled: false,
  environments: { local: true, integration: false, prod: false },
}
```

## 🧪 Testing

```bash
# Run tests
npm run test src/features/index.test.ts

# Test different environments
PUBLIC_ENV_NAME=local npm run dev
PUBLIC_ENV_NAME=integration npm run dev
PUBLIC_ENV_NAME=prod npm run dev
```

## 📚 Full Documentation

- **Complete Guide**: `Docs/FEATURE-FLAGS.md`
- **Implementation**: `Docs/FEATURE-FLAGS-IMPLEMENTATION.md`
- **Examples**: `src/features/examples.ts`
