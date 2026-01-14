# Cloudflare Pages Deployment Guide

This document provides comprehensive guidance for deploying the Word Repeater application to Cloudflare Pages.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Project Configuration](#project-configuration)
4. [Environment Variables](#environment-variables)
5. [CI/CD Workflow](#cicd-workflow)
6. [Manual Deployment](#manual-deployment)
7. [Troubleshooting](#troubleshooting)

## Overview

The Word Repeater application is configured to deploy to Cloudflare Pages using:

- **Astro 5** with SSR (Server-Side Rendering)
- **@astrojs/cloudflare** adapter
- **Cloudflare Pages** for hosting with global CDN
- **GitHub Actions** for automated CI/CD

## Prerequisites

Before deploying to Cloudflare Pages, ensure you have:

1. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
2. **Cloudflare Pages Project**: Create a new Pages project in the Cloudflare dashboard
3. **API Token**: Generate a Cloudflare API token with Pages permissions
4. **GitHub Repository**: Connected to GitHub Actions

### Required Cloudflare Credentials

You'll need the following credentials:

- **CLOUDFLARE_API_TOKEN**: API token with "Cloudflare Pages:Edit" permissions
- **CLOUDFLARE_ACCOUNT_ID**: Your Cloudflare account ID (found in dashboard URL)

## Project Configuration

### Astro Configuration

The project is already configured for Cloudflare Pages in `astro.config.mjs`:

```javascript
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "compile",
    platformProxy: {
      enabled: true,
    },
  }),
});
```

### Wrangler Configuration

The `wrangler.toml` file contains Cloudflare Pages configuration:

```toml
name = "word-repeater"
compatibility_date = "2024-01-01"
pages_build_output_dir = "dist"

[vars]
PUBLIC_ENV_NAME = "prod"
```

## Environment Variables

### Required Environment Variables

The application requires the following environment variables:

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `SUPABASE_URL` | Supabase project URL | Cloudflare Pages dashboard |
| `SUPABASE_KEY` | Supabase service role key | Cloudflare Pages dashboard |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI | Cloudflare Pages dashboard |
| `PUBLIC_ENV_NAME` | Environment name (prod) | Already set in wrangler.toml |

### Setting Environment Variables in Cloudflare

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment variables**
3. Add each variable for the **Production** environment
4. Click **Save**

⚠️ **Security Note**: Never commit sensitive credentials to your repository. Always use environment variables or secrets.

## CI/CD Workflow

### Automated Deployment (master.yml)

The `master.yml` workflow automatically deploys to Cloudflare Pages when code is pushed to the `master` branch.

#### Workflow Steps

1. **Lint**: Run ESLint to check code quality
2. **Unit Test**: Run unit tests with coverage
3. **Build**: Build the Astro project with production settings
4. **Deploy**: Deploy to Cloudflare Pages using Wrangler

#### Required GitHub Secrets

Add these secrets to your GitHub repository:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add the following secrets:

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service role key |
| `OPENROUTER_API_KEY` | OpenRouter API key |

#### Workflow Configuration

The workflow uses the latest stable versions of GitHub Actions:

- `actions/checkout@v6`
- `actions/setup-node@v6`
- `actions/upload-artifact@v6`
- `actions/download-artifact@v7`
- `actions/github-script@v8`
- `cloudflare/wrangler-action@v3`

### Pull Request Workflow (pull-request.yml)

The `pull-request.yml` workflow runs on pull requests to the `master` branch:

1. **Lint**: Check code quality
2. **Unit Test**: Run unit tests with coverage
3. **E2E Test**: Run end-to-end tests (if configured)
4. **Status Comment**: Post results to PR

This workflow does NOT deploy to Cloudflare - it only validates the code.

## Manual Deployment

### Using Wrangler CLI

You can manually deploy using the Wrangler CLI:

```bash
# Install Wrangler globally (if not already installed)
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build the project
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=word-repeater
```

### Using npm script

You can verify your Cloudflare setup:

```bash
npm run verify:cloudflare
```

## Troubleshooting

### Common Issues

#### 1. Build Fails with Module Errors

**Problem**: Build fails with "Cannot find module" errors.

**Solution**: Ensure all dependencies are installed:

```bash
npm ci
npm run build
```

#### 2. Environment Variables Not Available

**Problem**: Application crashes due to missing environment variables.

**Solution**: 
- Check Cloudflare Pages dashboard → Settings → Environment variables
- Ensure all required variables are set for the Production environment
- Redeploy the application after adding variables

#### 3. Deployment Fails with Authentication Error

**Problem**: GitHub Actions fails with "Authentication error".

**Solution**:
- Verify `CLOUDFLARE_API_TOKEN` is correctly set in GitHub secrets
- Check that the API token has "Cloudflare Pages:Edit" permissions
- Generate a new API token if needed

#### 4. Wrong Environment Variables in Build

**Problem**: Build uses development variables instead of production.

**Solution**: 
- Check that `PUBLIC_ENV_NAME` is set to "prod" in the build job
- Verify environment variables are passed to the build step in the workflow

#### 5. Functions Not Working

**Problem**: Server-side functions return errors.

**Solution**:
- Ensure the Astro adapter is properly configured
- Check Cloudflare Pages function logs in the dashboard
- Verify that the `output: "server"` is set in astro.config.mjs

### Debugging Tips

1. **Check Build Logs**: Review GitHub Actions logs for detailed error messages
2. **Check Cloudflare Logs**: View function logs in Cloudflare Pages dashboard
3. **Test Locally**: Run `npm run build && npm run preview` to test the production build locally
4. **Verify Environment**: Use `npm run verify:cloudflare` to check configuration

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## Support

For issues specific to:

- **Cloudflare Pages**: Check [Cloudflare Community](https://community.cloudflare.com/)
- **Astro**: Check [Astro Discord](https://astro.build/chat)
- **GitHub Actions**: Check [GitHub Community](https://github.community/)
