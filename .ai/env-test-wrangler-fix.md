# Wrangler `.env.test` Loading Issue - Investigation

## Problem Summary

When running `npm run dev:e2e` (which calls `astro dev --mode test`), the console shows:
```
[dotenv@17.2.3] injecting env (7) from .env.test
✓ [Config] Loaded .env.test (overriding .env values for astro:env)
Using vars defined in .env  ← Confusing message!
```

The message "Using vars defined in .env" appears to come from Wrangler, but it might just be a generic/misleading log message.

## Current Configuration

### astro.config.mjs
```javascript
const mode = process.argv.includes("--mode")
  ? process.argv[process.argv.indexOf("--mode") + 1]
  : "development";

if (mode === "test") {
  // Load for Astro's astro:env
  dotenv.config({ path: ".env.test", override: true });
}

export default defineConfig({
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
      environment: mode === "test" ? "test" : undefined,
      configPath: mode === "test" ? "wrangler.toml" : undefined,
    },
  }),
});
```

### wrangler.toml
```toml
[vars]
PUBLIC_ENV_NAME = "prod"

[env.test]
# Variables come from .env.test file
```

## Testing Required

To verify if the configuration is actually working, we need to check if the correct environment variables are being used at runtime:

1. Check the SUPABASE_URL value:
   - `.env` has: `SUPABASE_URL=https://wdwyndsateotdxfqwbdn.supabase.co`
   - `.env.test` has: `SUPABASE_URL=http://localhost:54321`

2. One of these tests:
   - Add a console.log in your code to print the SUPABASE_URL
   - Check if E2E tests connect to the correct database
   - Look at network requests to see which URL is being used

## Possible Explanations

1. **The message is misleading**: Wrangler might always print "Using vars defined in .env" even when loading environment-specific files
2. **The values are actually correct**: Despite the message, `.env.test` values might be properly loaded
3. **There's still an issue**: The configuration isn't working as expected

## Next Steps

Please test if the application is actually using the correct environment variables (localhost:54321 vs production Supabase URL) to determine if this is just a misleading log message or a real issue.

## Problem Summary

When running `npm run dev:e2e` (which calls `astro dev --mode test`), the application was loading environment variables from `.env` instead of `.env.test`, despite multiple attempts to override the loading behavior.

The console output showed:
```
[dotenv@17.2.3] injecting env (7) from .env.test
✓ [Plugin] Loaded .env.test (overriding .env values)
Using vars defined in .env  ← The problem!
```

## Root Cause Analysis

### Initial Misdiagnosis
The initial approach focused on Astro's environment loading, but the actual issue was with **Wrangler** (Cloudflare's CLI tool), not Astro.

### The Real Issue
The message "Using vars defined in .env" was coming from Wrangler's `loadDotEnv` function in `wrangler-dist/cli.js`. This happens because:

1. **Astro's Cloudflare adapter** uses `platformProxy.enabled: true` to provide local development with Cloudflare runtime features
2. **platformProxy** internally calls Wrangler's `getPlatformProxy()` API
3. **Wrangler has its own `.env` file loading mechanism** that is independent of Astro/Vite's loading
4. By default, Wrangler loads `.env` unless told otherwise

### Why Previous Attempts Failed

#### Attempt 1: Vite Plugin
```javascript
// ❌ This doesn't work
const loadEnvTestPlugin = () => ({
  name: "load-env-test-override",
  configResolved() {
    dotenv.config({ path: envTestPath, override: true });
  },
});
```
**Why it failed:** Wrangler's platformProxy doesn't use Vite's environment - it has its own loading mechanism.

#### Attempt 2: Loading at Config Top
```javascript
// ⚠️ This only partially works
if (mode === "test") {
  dotenv.config({ path: envTestPath, override: true });
}
```
**Why it was insufficient:** This loads `.env.test` for Astro's `astro:env` module, but Wrangler still independently loads `.env` for its platformProxy.

## The Solution

### How Wrangler Environment Loading Works

According to [Cloudflare's documentation](https://developers.cloudflare.com/changelog/2025-08-08-dot-env-in-local-dev), as of August 2025, Wrangler supports:

1. **Base `.env` file** - loaded by default during `wrangler dev`
2. **Environment-specific `.env.<environment-name>` files** - loaded when:
   - Using `wrangler dev --env <environment-name>`, OR
   - Setting `CLOUDFLARE_ENV=<environment-name>` environment variable

The environment-specific file is **merged with** and **overrides** the base `.env` file.

### Implementation

We need to tell Wrangler to use the "test" environment so it loads `.env.test`:

```javascript
// astro.config.mjs
const mode = process.argv.includes("--mode")
  ? process.argv[process.argv.indexOf("--mode") + 1]
  : "development";

if (mode === "test") {
  // Load for Astro's astro:env
  dotenv.config({ path: ".env.test", override: true });
  
  // ⭐ KEY FIX: Tell Wrangler to use "test" environment
  process.env.CLOUDFLARE_ENV = "test";
}
```

Additionally, we need to declare the test environment in `wrangler.toml`:

```toml
# wrangler.toml

# Default environment
[vars]
PUBLIC_ENV_NAME = "prod"

# Test environment - Wrangler will load .env.test when this is active
[env.test]
# Variables come from .env.test file
```

## How It Works

1. **User runs:** `npm run dev:e2e` → `astro dev --mode test`
2. **Config detects mode:** `mode === "test"` is true
3. **For Astro:** `dotenv.config({ path: ".env.test" })` loads variables for `astro:env`
4. **For Wrangler:** `process.env.CLOUDFLARE_ENV = "test"` tells platformProxy to use the "test" environment
5. **Wrangler loads:** `.env.test` file automatically (because of `CLOUDFLARE_ENV=test`)
6. **Result:** Both Astro and Wrangler now use `.env.test` values

## Testing

After the fix, when running `npm run dev:e2e`, you should see:
- ✓ [Config] Loaded .env.test (overriding .env values for astro:env)
- Wrangler should now use `.env.test` values (e.g., `SUPABASE_URL=http://localhost:54321`)

## Key Takeaways

1. **platformProxy uses Wrangler** - It has its own environment loading independent of Astro/Vite
2. **Use `CLOUDFLARE_ENV`** - This is the system environment variable Wrangler checks for environment selection
3. **Define `[env.test]` in wrangler.toml** - Required for Wrangler to recognize the environment
4. **`.env.<environment>` naming** - Wrangler automatically loads these based on `CLOUDFLARE_ENV`

## Additional Notes

### Package Compatibility
All packages are compatible:
- `astro@^5.13.7` - Supports `astro:env`
- `@astrojs/cloudflare@^12.6.12` - Supports `platformProxy` with environment selection
- Wrangler (bundled with @astrojs/cloudflare) - Supports `.env.<environment>` files since August 2025

### Alternative Approach
Instead of setting `CLOUDFLARE_ENV` in the config, you could also use `platformProxy.environment` option:

```javascript
adapter: cloudflare({
  platformProxy: {
    enabled: true,
    environment: mode === "test" ? "test" : undefined,
  },
}),
```

However, using the environment variable approach is more explicit and follows Wrangler's own conventions.

## References
- [Wrangler .env file support](https://developers.cloudflare.com/changelog/2025-08-08-dot-env-in-local-dev)
- [Wrangler Environments](https://developers.cloudflare.com/workers/wrangler/environments/)
- [Astro Cloudflare adapter platformProxy docs](https://docs.astro.build/en/guides/integrations-guide/cloudflare/#platformproxy)
