# Environment Setup Guide for Feature Flags

This guide walks you through setting up the `PUBLIC_ENV_NAME` environment variable across all environments.

## 📋 Overview

The feature flags system requires the `PUBLIC_ENV_NAME` environment variable to be set in:
- ✅ Local development (`.env.local`)
- ✅ GitHub Actions CI/CD
- ✅ Cloudflare Pages (production & preview)
- ✅ Test environments

## 🔒 Security: Why PUBLIC_ENV_NAME Matters

**CRITICAL:** The feature flag system defaults to `prod` (most restrictive) when `PUBLIC_ENV_NAME` is missing or invalid.

```typescript
// Missing PUBLIC_ENV_NAME
PUBLIC_ENV_NAME not set → defaults to "prod" → ✅ All features DISABLED

// Invalid PUBLIC_ENV_NAME  
PUBLIC_ENV_NAME="development" → defaults to "prod" → ✅ All features DISABLED
```

**This is by design for security:**
- Prevents accidental feature leaks in production
- Better to break in development than leak features in production
- Forces explicit configuration

**Valid values:** Only `local`, `integration`, or `prod` are accepted.

## 🏠 Local Development

### 1. Create `.env.local` File

Create a file named `.env.local` in the project root (it's gitignored):

```bash
# .env.local
PUBLIC_ENV_NAME=local

# Your other environment variables...
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
OPENROUTER_API_KEY=your-openrouter-api-key
```

### 2. Verify Local Setup

```bash
# Check feature flags state
node scripts/show-feature-flags.mjs

# Should show all features enabled in local
```

### 3. Test Different Environments Locally

```bash
# Test as if in production (all features disabled)
PUBLIC_ENV_NAME=prod npm run dev

# Test as if in integration
PUBLIC_ENV_NAME=integration npm run dev

# Back to normal local (all features enabled)
PUBLIC_ENV_NAME=local npm run dev
```

---

## 🤖 GitHub Actions

### Status: ✅ Already Configured

The GitHub Actions workflows have been updated with `PUBLIC_ENV_NAME`:

#### Build Workflow (`.github/workflows/build.yml`)
- **Tests**: `PUBLIC_ENV_NAME=local` (features enabled for testing)
- **Build**: `PUBLIC_ENV_NAME=integration` (build for integration environment)

#### Pull Request Workflow (`.github/workflows/pull-request.yml`)
- **Unit Tests**: `PUBLIC_ENV_NAME=local` (features enabled)
- **E2E Tests**: `PUBLIC_ENV_NAME=integration` (features per integration config)

### No Action Required
GitHub Actions are already configured. Features will work as expected in CI/CD.

---

## ☁️ Cloudflare Pages

### Option 1: Dashboard Configuration (Recommended)

#### For Production

1. Go to Cloudflare Pages dashboard
2. Select your project: **word-repeater**
3. Go to **Settings** → **Environment variables**
4. Click **Add variable**
5. Add:
   ```
   Variable name: PUBLIC_ENV_NAME
   Value: prod
   Environment: Production
   ```
6. Click **Save**

#### For Preview Deployments

1. In the same **Environment variables** section
2. Click **Add variable**
3. Add:
   ```
   Variable name: PUBLIC_ENV_NAME
   Value: integration
   Environment: Preview
   ```
4. Click **Save**

### Option 2: wrangler.toml (Already Done)

The `wrangler.toml` file has been updated with:

```toml
[vars]
PUBLIC_ENV_NAME = "prod"  # Default to production
```

This sets the default, but dashboard configuration takes precedence.

### Verify Cloudflare Setup

After deployment, check:
```bash
# Visit your deployed app
curl https://your-app.pages.dev/api/health

# Should show feature flags state
```

---

## 🧪 Test Environments

### E2E Tests (`.env.test`)

Create `.env.test` file (gitignored):

```bash
# .env.test
PUBLIC_ENV_NAME=local

BASE_URL=http://localhost:3000
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-supabase-anon-key-here
OPENROUTER_API_KEY=your-test-api-key-here
E2E_USERNAME=test@example.com
E2E_PASSWORD=SecurePass123!
E2E_USERNAME_ID=your-test-user-uuid-here
```

### Run Tests

```bash
# Local tests (features enabled)
npm run test

# E2E tests (features enabled)
npm run test:e2e

# Test with features disabled
PUBLIC_ENV_NAME=prod npm run test:e2e
```

---

## 📊 Environment Configuration Matrix

| Environment | PUBLIC_ENV_NAME | signup | resetPassword | Location |
|-------------|----------|--------|---------------|----------|
| **Local Dev** | `local` | ✅ | ✅ | `.env.local` |
| **GitHub Actions (tests)** | `local` | ✅ | ✅ | `.github/workflows/*.yml` |
| **GitHub Actions (build)** | `integration` | ❌ | ❌ | `.github/workflows/build.yml` |
| **GitHub Actions (e2e)** | `integration` | ❌ | ❌ | `.github/workflows/pull-request.yml` |
| **Cloudflare (preview)** | `integration` | ❌ | ❌ | Cloudflare Dashboard |
| **Cloudflare (prod)** | `prod` | ❌ | ❌ | Cloudflare Dashboard |

---

## 🔍 Verification Steps

### 1. Verify Local Development

```bash
# Should show: local environment, all features enabled
node scripts/show-feature-flags.mjs
```

Expected output:
```
Current PUBLIC_ENV_NAME: local

Active flags in current environment:
  ✅ signup
  ✅ resetPassword
```

### 2. Verify GitHub Actions

- Push to a branch
- Open a Pull Request
- Check that CI/CD passes
- Unit tests should run with features enabled
- E2E tests should run with integration config

### 3. Verify Cloudflare Deployment

After deploying:

1. **Check Preview Deployment** (should have features disabled)
   ```bash
   curl https://preview-branch.your-app.pages.dev/register
   # Should redirect to /login (feature disabled)
   ```

2. **Check Production** (should have features disabled)
   ```bash
   curl https://your-app.pages.dev/register
   # Should redirect to /login (feature disabled)
   ```

3. **Check Health Endpoint** (if you add one)
   ```bash
   curl https://your-app.pages.dev/api/health
   # Should return feature flags state
   ```

---

## 🚀 Deployment Checklist

### Before First Deployment

- [x] ✅ GitHub Actions configured
- [x] ✅ `wrangler.toml` updated
- [ ] ⚠️ Set `PUBLIC_ENV_NAME=prod` in Cloudflare Pages (Production)
- [ ] ⚠️ Set `PUBLIC_ENV_NAME=integration` in Cloudflare Pages (Preview)
- [ ] Create `.env.local` with `PUBLIC_ENV_NAME=local`
- [ ] Verify local development works
- [ ] Test in all environments

### After Deployment

- [ ] Verify production shows features disabled
- [ ] Verify preview deployments show features disabled
- [ ] Test feature enabling (update config, redeploy)
- [ ] Set up monitoring/alerts

---

## 🛠️ Troubleshooting

### Features Not Disabled in Production

**Problem:** Features are still enabled in production.

**Solutions:**
1. Check `PUBLIC_ENV_NAME` is set in Cloudflare:
   - Go to Settings → Environment variables
   - Verify `PUBLIC_ENV_NAME=prod` for Production

2. Check application logs:
   ```
   // Should see no warnings
   // If you see: "PUBLIC_ENV_NAME not set", it's missing
   ```

3. Force redeploy:
   ```bash
   # Trigger a new deployment
   git commit --allow-empty -m "Trigger redeploy"
   git push
   ```

### Features Not Enabled in Local Development

**Problem:** All features are disabled locally.

**Solutions:**
1. Check `.env.local` exists and has:
   ```
   PUBLIC_ENV_NAME=local
   ```

2. Restart dev server:
   ```bash
   npm run dev
   ```

3. Verify:
   ```bash
   node scripts/show-feature-flags.mjs
   ```

### CI/CD Tests Failing

**Problem:** Tests fail because features are disabled.

**Solutions:**
1. Check GitHub Actions has `PUBLIC_ENV_NAME=local` for tests
2. Review `.github/workflows/*.yml` files
3. Tests should run with features enabled

### Can't Access Cloudflare Dashboard

**Problem:** Don't have access to Cloudflare dashboard.

**Solutions:**
1. Ask team lead for access
2. Temporarily use `wrangler` CLI:
   ```bash
   npx wrangler pages project create word-repeater
   npx wrangler pages deployment create dist --project-name=word-repeater
   ```

---

## 📝 Quick Commands Reference

```bash
# Local development
npm run dev                              # Uses .env.local (PUBLIC_ENV_NAME=local)

# Test different environments locally
PUBLIC_ENV_NAME=prod npm run dev               # Test as production
PUBLIC_ENV_NAME=integration npm run dev        # Test as integration

# Visualize current configuration
node scripts/show-feature-flags.mjs     # Show all flags

# Run tests
npm test                                 # Unit tests (PUBLIC_ENV_NAME=local)
npm run test:e2e                        # E2E tests (uses .env.test)

# Build for different environments
PUBLIC_ENV_NAME=prod npm run build             # Build for production
PUBLIC_ENV_NAME=integration npm run build      # Build for integration
```

---

## 🎯 Next Steps

1. **Immediate (Do Now)**
   - [ ] Create `.env.local` with `PUBLIC_ENV_NAME=local`
   - [ ] Set `PUBLIC_ENV_NAME` in Cloudflare Pages dashboard
   - [ ] Verify local development works

2. **Before Next Deploy**
   - [ ] Test application with `PUBLIC_ENV_NAME=prod` locally
   - [ ] Verify features are properly disabled
   - [ ] Plan feature enablement strategy

3. **After First Deploy**
   - [ ] Monitor application health
   - [ ] Verify feature flags working
   - [ ] Document any issues

---

## 📞 Getting Help

If you encounter issues:

1. Check this guide first
2. Review `Docs/FEATURE-FLAGS-INTEGRATION.md`
3. Run `node scripts/show-feature-flags.mjs` to debug
4. Check application logs for warnings

---

**Last Updated:** January 2026  
**Status:** Ready for deployment
