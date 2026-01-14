# Cloudflare Pages Deployment Guide

This document provides instructions for deploying the WordRepeater AI application to Cloudflare Pages.

## Prerequisites

- A Cloudflare account (free tier is sufficient for development)
- GitHub repository connected to Cloudflare Pages
- Environment variables configured in Cloudflare Pages dashboard

## Configuration

The project is already configured to work with Cloudflare Pages using the `@astrojs/cloudflare` adapter.

### Astro Configuration (`astro.config.mjs`)

```javascript
adapter: cloudflare({
  imageService: "compile",
  platformProxy: {
    enabled: true,
  },
})
```

**Key Configuration Options:**

- **`imageService: "compile"`** - Optimizes images at build time for better performance
- **`platformProxy.enabled: true`** - Enables local development with Cloudflare Workers runtime features (like KV, D1, etc.)

### Wrangler Configuration (`wrangler.toml`)

The `wrangler.toml` file contains Cloudflare-specific configuration:

- **`name`** - Project name
- **`compatibility_date`** - Cloudflare Workers runtime compatibility date
- **`pages_build_output_dir`** - Build output directory (dist)
- **KV namespaces** - Optional session storage configuration
- **D1 databases** - Optional database bindings

You can customize this file to add Cloudflare-specific features like KV storage, D1 databases, or R2 object storage.

## Local Development

The configuration works seamlessly for both local development and Cloudflare deployment:

```bash
npm run dev
```

This will start the development server on `http://localhost:3000` with the same runtime environment that will be used in production.

## Build Command

To build for production:

```bash
npm run build
```

This creates an optimized build in the `dist/` directory that's ready for Cloudflare Pages deployment.

## Cloudflare Pages Setup

### 1. Connect Your Repository

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** in the sidebar
3. Click **Create a project**
4. Connect your GitHub account and select the `word-repeater` repository

### 2. Configure Build Settings

In the Cloudflare Pages project settings, configure:

- **Framework preset**: Astro
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Deploy command**: **LEAVE EMPTY** (Cloudflare Pages deploys automatically)
- **Node version**: `22.14.0` (matches `.nvmrc`)

**IMPORTANT**: Do NOT set a deploy command. Cloudflare Pages automatically deploys the build output. Do NOT use `wrangler versions upload` or `wrangler deploy` (those are for Workers, not Pages).

### 3. Environment Variables

Add the following environment variables in the Cloudflare Pages dashboard under **Settings > Environment variables**:

#### Required Variables

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Your Supabase anonymous/public key
- `OPENROUTER_API_KEY` - Your OpenRouter API key for AI functionality

#### Optional Variables

- `NODE_VERSION` - Set to `22.14.0` to match your `.nvmrc`

**Note**: Set these variables for both **Production** and **Preview** environments.

### 4. Deploy

Once configured, Cloudflare Pages will automatically:

- Deploy on every push to your main branch (production)
- Create preview deployments for pull requests
- Provide unique URLs for each deployment

## Deployment Workflow

### Automatic Deployments

- **Production**: Triggered on push to `main` branch
- **Preview**: Triggered on pull requests

### Manual Deployments

You can also trigger manual deployments from the Cloudflare Pages dashboard.

## Cloudflare-Specific Features

### Edge Runtime

Your application runs on Cloudflare's edge network, providing:

- Global CDN distribution
- Low latency worldwide
- Automatic SSL/TLS certificates
- DDoS protection

### Platform Bindings

The Cloudflare adapter supports platform-specific features:

- **KV** - Key-value storage
- **D1** - SQL database
- **R2** - Object storage
- **Durable Objects** - Stateful serverless objects

These can be accessed via `context.locals.runtime` in your Astro pages and API routes.

## Troubleshooting

### Authentication Issues (Login Redirect Loop)

If you experience infinite redirects to the login page or cannot authenticate:

**Cause**: Cookie `secure` flag set to `true` in local development (HTTP)

**Solution**: The project is already configured to handle this correctly. The `createSupabaseServerClient` function in `src/db/supabase.client.ts` automatically sets `secure: false` for cookies in development and `secure: true` in production.

If you still experience issues:
1. Clear browser cookies for `localhost:3000`
2. Restart the dev server
3. Ensure `import.meta.env.PROD` is `false` in development

### Build Failures

If builds fail, check:

1. **Node version**: Ensure Cloudflare is using Node.js 22.14.0
2. **Environment variables**: Verify all required variables are set
3. **Build logs**: Review detailed logs in the Cloudflare Pages dashboard

### Runtime Errors

If the application runs locally but fails on Cloudflare:

1. **Check compatibility**: Some Node.js APIs may not be available in Cloudflare Workers runtime
2. **Review logs**: Check the Functions logs in Cloudflare dashboard
3. **Test with wrangler**: Use `wrangler pages dev` for local testing with Cloudflare runtime

### Environment Variables Not Working

- Ensure variables are set for the correct environment (Production/Preview)
- Restart the deployment after adding new variables
- Check variable names match exactly (case-sensitive)

## Performance Optimization

### Caching

Cloudflare automatically caches static assets. For API routes, you can add cache headers:

```typescript
return new Response(JSON.stringify(data), {
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, max-age=60",
  },
});
```

### Image Optimization

Images are optimized at build time with `imageService: "compile"`. For runtime optimization, consider using Cloudflare Images.

## Monitoring

Monitor your application using:

- **Cloudflare Analytics** - Traffic, performance, and errors
- **Real User Monitoring (RUM)** - Web Vitals and user experience metrics
- **Functions Logs** - Server-side logs and errors

## Cost Considerations

Cloudflare Pages offers:

- **Free tier**: 500 builds/month, unlimited requests
- **Paid tier**: Unlimited builds, advanced features

For most MVP applications, the free tier is sufficient.

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Cloudflare Workers Runtime](https://developers.cloudflare.com/workers/runtime-apis/)

