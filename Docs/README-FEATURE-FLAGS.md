# Feature Flags System - Complete Documentation Index

## 🎯 What is This?

A **type-safe feature flag system** that separates deployments from releases, allowing you to:
- Deploy code to production with features disabled
- Enable features independently without redeployment
- Test features in different environments
- Roll back features instantly by disabling them

## 📚 Documentation Overview

### 1. **Quick Start** - [FEATURE-FLAGS-QUICKREF.md](./FEATURE-FLAGS-QUICKREF.md)
⚡ 5-minute guide to start using feature flags immediately
- Setting environment variables
- Basic usage patterns
- Quick reference table
- Common functions

**Start here if:** You need to use feature flags right now

### 2. **Complete Guide** - [FEATURE-FLAGS.md](./FEATURE-FLAGS.md)
📖 Comprehensive documentation with detailed examples
- Configuration details
- Usage examples for API endpoints and Astro pages
- All available functions
- Best practices

**Start here if:** You want to understand the system thoroughly

### 3. **Implementation Summary** - [FEATURE-FLAGS-IMPLEMENTATION.md](./FEATURE-FLAGS-IMPLEMENTATION.md)
🔧 Technical implementation details and file structure
- Files created/modified
- Current configuration
- API functions reference
- Testing information
- Implementation checklist

**Start here if:** You want to see what was implemented

### 4. **Integration Guide** - [FEATURE-FLAGS-INTEGRATION.md](./FEATURE-FLAGS-INTEGRATION.md)
🚀 CI/CD, deployment, and monitoring integration
- Environment setup for different platforms (Vercel, Netlify, AWS, etc.)
- GitHub Actions and GitLab CI examples
- Monitoring and logging
- Deployment workflows
- Troubleshooting

**Start here if:** You're ready to deploy to production

## 🎬 Getting Started in 3 Steps

### Step 1: Set Environment Variable
```bash
# In your .env or .env.local file
PUBLIC_ENV_NAME=local
```

### Step 2: Use in Your Code

**API Endpoint:**
```typescript
import { requireFeatureEnabled } from "@/features";

export const POST: APIRoute = async ({ request }) => {
  const check = requireFeatureEnabled("signup", "User Registration");
  if (check) return check;
  
  // Your code here
};
```

**Astro Page:**
```astro
---
import { isFeatureEnabled } from "@/features";

if (!isFeatureEnabled("signup")) {
  return new Response(null, { status: 403 });
}
---
```

### Step 3: Deploy with Confidence
Deploy your code with features disabled in production, then enable them when ready!

## 📋 Current Feature Flags

| Flag | Default | Local | Integration | Prod |
|------|---------|-------|-------------|------|
| `signup` | ❌ | ✅ | ❌ | ❌ |
| `resetPassword` | ❌ | ✅ | ❌ | ❌ |

## 🗂️ File Structure

```
src/features/
├── index.ts          # Core implementation (IMPORT FROM HERE)
├── index.d.ts        # TypeScript definitions
├── index.test.ts     # Test suite (27 tests)
├── examples.ts       # Code examples
└── README.md         # Module documentation

Docs/
├── FEATURE-FLAGS.md                  # Complete guide
├── FEATURE-FLAGS-QUICKREF.md         # Quick reference
├── FEATURE-FLAGS-IMPLEMENTATION.md   # Implementation details
├── FEATURE-FLAGS-INTEGRATION.md      # CI/CD integration guide
└── README-FEATURE-FLAGS.md           # This file

scripts/
└── show-feature-flags.mjs            # Visualization script
```

## 🔍 Finding What You Need

| I want to... | Read this document |
|-------------|-------------------|
| Start using feature flags immediately | [Quick Reference](./FEATURE-FLAGS-QUICKREF.md) |
| Understand all features and options | [Complete Guide](./FEATURE-FLAGS.md) |
| See what was implemented | [Implementation Summary](./FEATURE-FLAGS-IMPLEMENTATION.md) |
| Set up CI/CD and deploy | [Integration Guide](./FEATURE-FLAGS-INTEGRATION.md) |
| See code examples | [examples.ts](../src/features/examples.ts) |
| Understand the module structure | [Module README](../src/features/README.md) |
| Run tests | See "Testing" section below |
| Visualize current flags | See "Visualization" section below |

## 🧪 Testing

### Run Test Suite
```bash
npm run test src/features/index.test.ts
```

### Test Different Environments
```bash
PUBLIC_ENV_NAME=local npm run dev
PUBLIC_ENV_NAME=integration npm run dev
PUBLIC_ENV_NAME=prod npm run dev
```

### Visualize Feature Flags
```bash
node scripts/show-feature-flags.mjs
```

Output:
```
╔════════════════════════════════════════════════════════════╗
║          Feature Flags Configuration Matrix           ║
╚════════════════════════════════════════════════════════════╝

Feature Flag        local          integration    prod           
─────────────────────────────────────────────────────────────────
signup              ✅ Enabled      ✅ Enabled      ❌ Disabled     
resetPassword       ✅ Enabled      ❌ Disabled     ❌ Disabled     
```

## 🎨 Key Features

### ✅ Type Safety
```typescript
isFeatureEnabled("signup")     // ✅ Valid
isFeatureEnabled("typo")       // ❌ TypeScript error
```

### ✅ Runtime Evaluation
Flags are evaluated at runtime based on `PUBLIC_ENV_NAME` environment variable - no rebuild needed to change environments.

### ✅ Per-Flag Defaults
Each flag can have its own default state when environment is not explicitly configured.

### ✅ Environment-Specific
Configure different states for local, integration, and production.

### ✅ Universal
Works on both frontend (Astro pages) and backend (API endpoints).

### ✅ Proper HTTP Responses
Disabled features return proper 403 Forbidden responses.

## 🚀 Common Use Cases

### Use Case 1: Deploy New Feature Disabled
1. Add feature flag (default: disabled)
2. Implement feature behind flag
3. Deploy to production
4. Enable flag when ready
5. Monitor and roll back if needed

### Use Case 2: Gradual Rollout
1. Deploy with feature disabled in prod
2. Enable in integration for testing
3. Enable in prod for gradual rollout
4. Monitor metrics
5. Adjust as needed

### Use Case 3: Kill Switch
If something goes wrong:
1. Disable feature flag
2. Redeploy (or use runtime override)
3. Feature is immediately unavailable
4. No code changes needed

## ➕ Adding New Feature Flags

1. Open `src/features/index.ts`
2. Add flag to `FeatureFlag` type:
   ```typescript
   export type FeatureFlag = "signup" | "resetPassword" | "newFeature";
   ```
3. Add configuration:
   ```typescript
   newFeature: {
     defaultEnabled: false,
     environments: {
       local: true,
       integration: false,
       prod: false,
     },
   }
   ```
4. Use in your code with full type safety!

## 📊 API Reference

### Core Functions

```typescript
// Check if feature is enabled
isFeatureEnabled(flagName: FeatureFlag): boolean

// Check + return 403 if disabled (for APIs)
requireFeatureEnabled(flagName: FeatureFlag, featureName: string): Response | null

// Create 403 response
createFeatureDisabledResponse(featureName: string): Response

// Get all flags (debugging)
getAllFeatureFlags(): Record<FeatureFlag, boolean>

// Get current environment
getEnvironment(): Environment
```

## 🎓 Learning Path

### Beginner
1. Read [Quick Reference](./FEATURE-FLAGS-QUICKREF.md)
2. Try examples from [examples.ts](../src/features/examples.ts)
3. Run visualization script

### Intermediate
1. Read [Complete Guide](./FEATURE-FLAGS.md)
2. Review [Implementation Summary](./FEATURE-FLAGS-IMPLEMENTATION.md)
3. Run test suite and understand tests

### Advanced
1. Read [Integration Guide](./FEATURE-FLAGS-INTEGRATION.md)
2. Set up CI/CD pipeline
3. Add monitoring and observability
4. Implement progressive rollout strategy

## 🔧 Troubleshooting

### Feature Not Working as Expected
1. Check `PUBLIC_ENV_NAME` value: `echo $PUBLIC_ENV_NAME`
2. Run visualization: `node scripts/show-feature-flags.mjs`
3. Check configuration in `src/features/index.ts`
4. Review console warnings

### TypeScript Errors
1. Ensure flag is defined in `FeatureFlag` type
2. Ensure flag has configuration in `featureFlagsConfig`
3. Check import statement: `import { isFeatureEnabled } from "@/features"`

### Tests Failing
1. Check environment setup in test
2. Verify configuration matches test expectations
3. Run tests with verbose output: `npm run test -- --reporter=verbose`

## 📞 Support & Resources

- **Code Examples**: `src/features/examples.ts`
- **Tests**: `src/features/index.test.ts` (27 test cases)
- **Module Docs**: `src/features/README.md`
- **All Documentation**: This `Docs/` directory

## ✨ Benefits

### For Developers
- ✅ Type-safe - no string typos
- ✅ Easy to use - simple API
- ✅ Well documented - comprehensive guides
- ✅ Well tested - 27 test cases

### For Teams
- ✅ Separate deployments from releases
- ✅ Reduce deployment risk
- ✅ Test in production safely
- ✅ Quick rollback capability

### For Business
- ✅ Faster time to market
- ✅ Reduced downtime risk
- ✅ Better quality assurance
- ✅ Gradual feature rollout

## 🎯 Next Steps

1. **New to feature flags?** → [Quick Reference](./FEATURE-FLAGS-QUICKREF.md)
2. **Want to understand everything?** → [Complete Guide](./FEATURE-FLAGS.md)
3. **Ready to deploy?** → [Integration Guide](./FEATURE-FLAGS-INTEGRATION.md)
4. **Want to see code?** → [examples.ts](../src/features/examples.ts)

---

**Questions?** Check the relevant documentation above or review the code examples in `src/features/examples.ts`.

**Ready to deploy?** Follow the [Integration Guide](./FEATURE-FLAGS-INTEGRATION.md) for CI/CD setup.
