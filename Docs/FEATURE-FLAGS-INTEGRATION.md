# Feature Flags Integration Guide

## 🎯 Overview

This guide walks you through integrating the feature flag system with your deployment pipeline, CI/CD, and monitoring systems.

## 📋 Prerequisites

Before integrating, ensure you have:
- ✅ Feature flags system implemented (`src/features/`)
- ✅ `PUBLIC_ENV_NAME` environment variable defined
- ✅ Tests passing (`npm run test src/features/index.test.ts`)

## 🔧 Environment Setup

### Local Development

**`.env.local`** (not committed to git):
```bash
PUBLIC_ENV_NAME=local
```

### Integration/Staging Environment

Set in your hosting platform or CI/CD:
```bash
PUBLIC_ENV_NAME=integration
```

### Production Environment

Set in your hosting platform:
```bash
PUBLIC_ENV_NAME=prod
```

## 🚀 CI/CD Integration

### GitHub Actions

#### Option 1: Environment Variables in Workflow

```yaml
# .github/workflows/deploy-integration.yml
name: Deploy to Integration

on:
  push:
    branches: [develop]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build
        env:
          PUBLIC_ENV_NAME: integration
        run: npm run build
      
      - name: Deploy
        env:
          PUBLIC_ENV_NAME: integration
        run: |
          # Your deployment commands here
```

#### Option 2: Environment Secrets

1. Go to GitHub Settings → Secrets and variables → Actions
2. Add environment-specific secrets:
   - `INTEGRATION_PUBLIC_ENV_NAME` = `integration`
   - `PROD_PUBLIC_ENV_NAME` = `prod`

```yaml
# .github/workflows/deploy-prod.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and Deploy
        env:
          PUBLIC_ENV_NAME: ${{ secrets.PROD_PUBLIC_ENV_NAME }}
        run: |
          npm ci
          npm run build
          # Deploy commands
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"

test:
  stage: test
  script:
    - npm ci
    - npm test

build:integration:
  stage: build
  only:
    - develop
  variables:
    PUBLIC_ENV_NAME: integration
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:integration:
  stage: deploy
  only:
    - develop
  variables:
    PUBLIC_ENV_NAME: integration
  script:
    - # Your deploy commands

build:production:
  stage: build
  only:
    - main
  variables:
    PUBLIC_ENV_NAME: prod
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

deploy:production:
  stage: deploy
  only:
    - main
  variables:
    PUBLIC_ENV_NAME: prod
  script:
    - # Your deploy commands
```

## ☁️ Hosting Platform Configuration

### Vercel

#### Dashboard Method
1. Go to Project Settings → Environment Variables
2. Add for each environment:
   - **Production**: `PUBLIC_ENV_NAME` = `prod`
   - **Preview**: `PUBLIC_ENV_NAME` = `integration`
   - **Development**: `PUBLIC_ENV_NAME` = `local`

#### CLI Method
```bash
# Add to production
vercel env add PUBLIC_ENV_NAME production
# Enter: prod

# Add to preview
vercel env add PUBLIC_ENV_NAME preview
# Enter: integration

# Add to development
vercel env add PUBLIC_ENV_NAME development
# Enter: local
```

### Netlify

#### Dashboard Method
1. Site Settings → Build & deploy → Environment
2. Add environment variable:
   - Key: `PUBLIC_ENV_NAME`
   - Value: `integration` (for deploy previews) or `prod` (for production)

#### Deploy Contexts
```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[context.production.environment]
  PUBLIC_ENV_NAME = "prod"

[context.deploy-preview.environment]
  PUBLIC_ENV_NAME = "integration"

[context.branch-deploy.environment]
  PUBLIC_ENV_NAME = "integration"
```

### Cloudflare Pages

1. Go to Settings → Environment variables
2. Add variables per environment:
   - **Production**: `PUBLIC_ENV_NAME` = `prod`
   - **Preview**: `PUBLIC_ENV_NAME` = `integration`

### AWS (ECS/Lambda/Elastic Beanstalk)

#### ECS Task Definition
```json
{
  "containerDefinitions": [{
    "name": "app",
    "environment": [
      {
        "name": "PUBLIC_ENV_NAME",
        "value": "prod"
      }
    ]
  }]
}
```

#### Lambda Environment Variables
```yaml
# serverless.yml or SAM template
Environment:
  Variables:
    PUBLIC_ENV_NAME: prod
```

#### Elastic Beanstalk
```bash
eb setenv PUBLIC_ENV_NAME=prod
```

### Docker

```dockerfile
# Dockerfile
FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Set default (can be overridden at runtime)
ENV PUBLIC_ENV_NAME=prod

RUN npm run build

CMD ["npm", "start"]
```

```bash
# Override at runtime
docker run -e PUBLIC_ENV_NAME=integration myapp

# Or in docker-compose.yml
services:
  app:
    environment:
      - PUBLIC_ENV_NAME=integration
```

## 🧪 Testing in CI/CD

### Test Different Environments

```yaml
# .github/workflows/test-all-environments.yml
name: Test All Environments

on: [pull_request]

jobs:
  test-environments:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        env: [local, integration, prod]
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      
      - name: Test ${{ matrix.env }}
        env:
          PUBLIC_ENV_NAME: ${{ matrix.env }}
        run: |
          npm test
          node scripts/show-feature-flags.mjs
```

### Feature Flag Validation

Create a test that validates feature flags are correctly configured:

```typescript
// e2e/feature-flags.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Flags', () => {
  test('signup should respect environment', async ({ page }) => {
    const env = process.env.PUBLIC_ENV_NAME || 'local';
    
    await page.goto('/register');
    
    if (env === 'prod') {
      // Should be blocked in production
      expect(page.url()).toContain('/');
      await expect(page.locator('[data-testid="register-form"]')).not.toBeVisible();
    } else {
      // Should be accessible in local/integration
      await expect(page.locator('[data-testid="register-form"]')).toBeVisible();
    }
  });

  test('API respects feature flags', async ({ request }) => {
    const env = process.env.PUBLIC_ENV_NAME || 'local';
    
    const response = await request.post('/api/auth/register', {
      data: {
        email: 'test@example.com',
        password: 'password123',
        acceptTerms: true,
      },
    });
    
    if (env === 'prod') {
      // Should return 403 in production
      expect(response.status()).toBe(403);
    } else {
      // Should work in local/integration (may return 400 for invalid data, but not 403)
      expect(response.status()).not.toBe(403);
    }
  });
});
```

## 📊 Monitoring & Observability

### Log Feature Flag State on Startup

```typescript
// src/lib/monitoring/feature-flags-logger.ts
import { getAllFeatureFlags, getEnvironment } from "@/features";

export function logFeatureFlagsOnStartup() {
  const environment = getEnvironment();
  const flags = getAllFeatureFlags();
  
  console.log('='.repeat(60));
  console.log('Feature Flags Configuration');
  console.log('='.repeat(60));
  console.log(`Environment: ${environment}`);
  console.log('Flags:');
  Object.entries(flags).forEach(([flag, enabled]) => {
    console.log(`  ${flag}: ${enabled ? '✅ Enabled' : '❌ Disabled'}`);
  });
  console.log('='.repeat(60));
}

// Call in your app startup (e.g., src/middleware/index.ts or server entry point)
```

### Add to Application Startup

```typescript
// src/middleware/index.ts or app initialization
import { logFeatureFlagsOnStartup } from "@/lib/monitoring/feature-flags-logger";

// Log feature flags on server startup
if (import.meta.env.DEV || process.env.NODE_ENV !== 'production') {
  logFeatureFlagsOnStartup();
}
```

### Monitoring Disabled Feature Access Attempts

```typescript
// src/lib/monitoring/feature-flags-metrics.ts
import { isFeatureEnabled, type FeatureFlag } from "@/features";

export function trackFeatureAccess(
  flagName: FeatureFlag,
  userId?: string
) {
  const enabled = isFeatureEnabled(flagName);
  
  if (!enabled) {
    // Log to your monitoring service (e.g., Sentry, DataDog, CloudWatch)
    console.warn(`[FEATURE_FLAG] Attempt to access disabled feature: ${flagName}`, {
      userId,
      timestamp: new Date().toISOString(),
      environment: process.env.PUBLIC_ENV_NAME,
    });
    
    // Example: Send to monitoring service
    // Sentry.captureMessage(`Disabled feature access: ${flagName}`);
  }
  
  return enabled;
}
```

### Health Check Endpoint

```typescript
// src/pages/api/health.ts
import type { APIRoute } from "astro";
import { getAllFeatureFlags, getEnvironment } from "@/features";

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      status: "healthy",
      environment: getEnvironment(),
      featureFlags: getAllFeatureFlags(),
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};
```

## 🔄 Deployment Workflow

### Progressive Rollout Strategy

1. **Deploy to Integration** (with feature disabled)
   ```bash
   PUBLIC_ENV_NAME=integration
   signup: ❌ Disabled
   resetPassword: ❌ Disabled
   ```

2. **Enable in Integration** (test the feature)
   - Update config: `integration: true`
   - Deploy
   - Run E2E tests
   - Monitor for issues

3. **Deploy to Production** (with feature disabled)
   ```bash
   PUBLIC_ENV_NAME=prod
   signup: ❌ Disabled
   ```

4. **Enable in Production** (when ready)
   - Update config: `prod: true`
   - Deploy
   - Monitor gradually

### Blue-Green Deployment

```yaml
# Deploy blue (new code, features disabled)
blue:
  env:
    PUBLIC_ENV_NAME: prod
  features:
    signup: false

# Verify blue deployment
# Switch traffic to blue
# Enable features on blue

# Update blue config
blue:
  features:
    signup: true  # Enable gradually
```

## 🎛️ Runtime Configuration (Advanced)

For dynamic feature flags without redeployment, consider:

### Option 1: Environment Variable Override

```typescript
// In src/features/index.ts - Add override mechanism
function isFeatureEnabled(flagName: FeatureFlag): boolean {
  // Check for override in environment
  const override = process.env[`FF_${flagName.toUpperCase()}`];
  if (override !== undefined) {
    return override === 'true';
  }
  
  // Fall back to configuration
  const config = featureFlagsConfig[flagName];
  // ... rest of logic
}
```

Then set:
```bash
FF_SIGNUP=true npm start
```

### Option 2: Remote Configuration (Future Enhancement)

```typescript
// Fetch from remote config service (e.g., Firebase, AWS AppConfig)
async function fetchFeatureFlagOverrides() {
  const response = await fetch('https://config.example.com/feature-flags');
  return response.json();
}
```

## ✅ Deployment Checklist

Before deploying:

- [ ] `PUBLIC_ENV_NAME` set correctly for each environment
- [ ] Feature flags configured correctly in `src/features/index.ts`
- [ ] Tests passing in all environments
- [ ] CI/CD pipeline configured with correct environment variables
- [ ] Monitoring/logging set up for feature flag access
- [ ] Health check endpoint includes feature flag status
- [ ] Team notified of feature flag states
- [ ] Rollback plan ready if issues occur

## 🚨 Troubleshooting

### Feature Not Available in Expected Environment

1. Check `PUBLIC_ENV_NAME` value:
   ```bash
   echo $PUBLIC_ENV_NAME
   ```

2. Verify configuration in `src/features/index.ts`

3. Check logs for warnings about PUBLIC_ENV_NAME

4. Use visualization script:
   ```bash
   node scripts/show-feature-flags.mjs
   ```

### Feature Flag Not Updating After Deployment

1. Verify environment variable is set in hosting platform
2. Check if app needs restart after env var change
3. Clear any caches (CDN, application cache)
4. Check health endpoint: `/api/health`

### Different Behavior Between Local and Deployed

1. Compare `PUBLIC_ENV_NAME` values
2. Check for build-time vs runtime evaluation issues
3. Verify no hardcoded overrides in code

## 📚 Additional Resources

- **Quick Reference**: `Docs/FEATURE-FLAGS-QUICKREF.md`
- **Complete Guide**: `Docs/FEATURE-FLAGS.md`
- **Implementation**: `Docs/FEATURE-FLAGS-IMPLEMENTATION.md`
- **Examples**: `src/features/examples.ts`
- **Tests**: `src/features/index.test.ts`

## 🎯 Next Steps

1. Choose your hosting platform
2. Configure environment variables
3. Set up CI/CD pipeline
4. Add monitoring/logging
5. Create E2E tests for feature flags
6. Document your deployment process
7. Train team on feature flag usage

---

**Ready to deploy?** Follow the checklist above and you're good to go! 🚀
