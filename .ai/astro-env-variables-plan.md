# Astro Environment Variables Plan

## 1. Objectives

- Inventory and classify every environment variable currently in use.
- Document where each variable is loaded and how it’s accessed (build-time vs. runtime).
- Align naming conventions and loading mechanisms with Vite/Astro best practices.
- Define a type-safe schema via `astro:env` in `astro.config.mjs`.
- Outline migration steps and code changes for consistency and secret safety.

## 2. Variables Inventory

| Variable Name            | Context                 | Access Pattern                                 | Current Usage                                                | Exposure     |
|--------------------------|-------------------------|------------------------------------------------|--------------------------------------------------------------|--------------|
| `SUPABASE_URL`           | Server                  | `import.meta.env.SUPABASE_URL`                 | Supabase client in `src/db/supabase.client.ts`               | Build-time   |
| `SUPABASE_KEY`           | Server                  | `import.meta.env.SUPABASE_KEY`                 | Supabase anon key in same file, SSR auth                     | Build-time   |
| `OPENROUTER_API_KEY`     | Server                  | `import.meta.env.OPENROUTER_API_KEY`           | AI service in `src/lib/services/aiFlashcardGenerator.service.ts` | Build-time   |
| `PUBLIC_ENV_NAME`        | Public client & server  | `import.meta.env.PUBLIC_ENV_NAME` and fallback `process.env.PUBLIC_ENV_NAME` | Feature-flag logic in `src/features/index.ts`               | Build-time   |
| `E2E_USERNAME`           | Node (Playwright tests) | `process.env.E2E_USERNAME`                     | Credentials in `e2e/fixtures/auth.setup.ts`                  | Runtime only |
| `E2E_PASSWORD`           | Node (Playwright tests) | `process.env.E2E_PASSWORD`                     | Credentials in `e2e/fixtures/auth.setup.ts`                  | Runtime only |


## 3. Loading Sources & Modes

| Environment           | Source                 | Loader                                            | Notes                                                                    |
|-----------------------|------------------------|---------------------------------------------------|--------------------------------------------------------------------------|
| Local Dev (`npm run dev`)     | `.env`                 | Vite/Astro: exposes only `VITE_`-prefixed vars in `import.meta.env` | Non-`VITE_` vars aren’t exposed by default; secrets in `.env` are server-only. |
| Local E2E Dev (`npm run dev:e2e`) | `.env.test`            | `dotenv.config({ path: '.env.test' })` in `playwright.config.ts` | Tests read from `process.env`; `astro:env` does not apply in Node tests.  |
| Vitest                | `.env.test`            | Vite test mode auto-loads `.env.test` into `import.meta.env` | Shares same loader as `npm run dev:test`.                              |
| GitHub Actions        | `env:` block in workflow | native runner env injection                         | Unit: only `PUBLIC_ENV_NAME: local`. E2E & build: inject full set.      |
| Cloudflare Pages      | Dashboard & `wrangler.toml` | Dashboard vars bound at runtime; `wrangler.toml` inlines public vars at build | Secrets bound only to the Worker at runtime; public vars baked into `/dist`. |

## 4. Variable Types & Exposure

- **Build-time (`import.meta.env`)**: Static replacement by Vite at bundle time. Only intended for values that are safe to expose in client code when prefixed `PUBLIC_` (or `VITE_`).
- **Runtime (`astro:env`)**: Use `astro:env` virtual module to read secrets at runtime in SSR contexts (e.g. Cloudflare Worker). Keeps private values out of client bundles.
- **Node tests (`process.env`)**: Traditional `process.env` usage for E2E and CI tasks. Do not migrate test credentials to Astro’s env modules.

## 5. Naming & Convention Alignment

1. **Public variables** must be prefixed `PUBLIC_` (or `VITE_` for Vite).
2. **Server-only secrets** use no prefix; they remain hidden from client bundles.
3. **E2E credentials** remain unprefixed and loaded via `process.env` in test runners.
4. Update `.env.example` to:
   - List all six variables with correct prefixes.
   - Call out which variables are public vs. secret.

## 6. Type-Safe Schema (`astro:env`)

In `astro.config.mjs`:

```js
import { defineConfig, envField } from 'astro/config';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import cloudflare from '@astrojs/cloudflare';

// Detect test mode from command line arguments
const mode = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1]
  : 'development';

// Load .env.test for Astro's astro:env module when in test mode
// This must happen BEFORE defineConfig() is called
if (mode === 'test') {
  const envTestPath = path.resolve(process.cwd(), '.env.test');
  if (fs.existsSync(envTestPath)) {
    dotenv.config({ path: envTestPath, override: true });
    console.log('✓ [Config] Loaded .env.test (overriding .env values for astro:env)');
  }
}

export default defineConfig({
  env: {
    schema: {
      SUPABASE_URL: envField.string({ context: 'server', access: 'secret', optional: false }),
      SUPABASE_KEY: envField.string({ context: 'server', access: 'secret', optional: false }),
      OPENROUTER_API_KEY: envField.string({ context: 'server', access: 'secret', optional: false }),
      OPENROUTER_MODEL_NAME: envField.string({ context: 'server', access: 'secret', optional: true, default: 'openai/gpt-4o-mini' }),
      PUBLIC_ENV_NAME: envField.string({ context: 'server', access: 'public', optional: false, default: 'prod' }),
      // E2E credentials omitted; handled by process.env in Node tests
    }
  },
  
  adapter: cloudflare({
    imageService: 'compile',
    platformProxy: {
      enabled: true,
      // Tell Wrangler's platformProxy to use the test environment
      // This makes Wrangler load .env.test instead of .env
      environment: mode === 'test' ? 'test' : undefined,
      configPath: mode === 'test' ? 'wrangler.toml' : undefined,
    },
  }),
});
```

**Why both `dotenv.config()` and `platformProxy.environment` are needed:**
- `dotenv.config()` loads `.env.test` for **Astro's `astro:env` module** (used in your application code)
- `platformProxy.environment` tells **Wrangler's platformProxy** to use `.env.test` (used for Cloudflare runtime emulation)
- Both systems load environment variables independently and both are required for `npm run dev:e2e` to work correctly

- Run `astro sync` to generate TypeScript types for `import.meta.env` and `astro:env` modules.

## 6.1. Wrangler Configuration (Optional)

**Note:** No changes to `wrangler.toml` are required for `.env.test` loading to work.

When `platformProxy.environment: 'test'` is set in `astro.config.mjs`, Wrangler automatically loads the `.env.test` file based on the file naming convention (`.env.<environment>`).

The `[env.test]` section in `wrangler.toml` is **only needed if** you want environment-specific Wrangler configuration such as:
- Different KV namespace bindings for testing
- Different D1 database bindings
- Environment-specific compatibility dates
- Custom vars that override `.env.test` values

Example (only if needed):
```toml
[env.test]
compatibility_date = "2025-01-01"
# Add environment-specific bindings here if needed
```

For most use cases, the default `wrangler.toml` configuration is sufficient.

## 7. Migration Steps

1. **Install/import** `astro:env` (included by default in Astro 5).
2. **Replace** all `import.meta.env.<VAR>` usages in SSR code with `env.<VAR>` from `astro:env`:
   - `src/db/supabase.client.ts`
   - `src/lib/services/aiFlashcardGenerator.service.ts`
   - `src/features/index.ts`
3. **Prefix** any variables meant for client code with `PUBLIC_` and, if desired, with `VITE_` for dev loader compatibility.
4. **Update** `.env.example`:
   - Add public vs. secret variables to `.env.example`
   - Document which variables are required for different environments
5. **Validate** local dev, test, and CI builds:
   - `npm run dev`
   - `npm run dev:e2e`
   - `npm run test`
6. **Deploy** to Cloudflare Pages and verify:
   - Public vars baked into the client bundle.
   - Secrets bound at runtime in the Worker.

## 8. Verification & Testing

- **Manual smoke tests** of public UI behavior using `PUBLIC_ENV_NAME`.
- **Unit tests** pass with `import.meta.env` types enforced.
- **E2E tests** authenticate using `process.env` credentials.
- **CI workflow** injects correct variables per job.
- **Cloudflare preview** shows no missing runtime secrets.

---

*Generated based on project documentation and Astro environment-variable best practices.*