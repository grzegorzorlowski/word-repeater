
## 1. Variables & Current Usage

1. **SUPABASE_URL**  
   • In `src/db/supabase.client.ts` via  
     ```ts
     const supabaseUrl = import.meta.env.SUPABASE_URL
     ```  
   • Used by both client-side and SSR Supabase clients.  
   • Currently inlined at build time by Vite/Astro.

2. **SUPABASE_KEY**  
   • In the same file as above (`import.meta.env.SUPABASE_KEY`).  
   • Used for anonymous client access & SSR authentication.

3. **OPENROUTER_API_KEY**  
   • In `src/lib/services/aiFlashcardGenerator.service.ts`  
     ```ts
     const apiKey = import.meta.env.OPENROUTER_API_KEY
     ```  
   • Passed into `createOpenRouterService`.

4. **PUBLIC_ENV_NAME**  
   • In `src/features/index.ts` inside `getCurrentEnvironment()`  
     - First tries `import.meta.env.PUBLIC_ENV_NAME`  
     - Falls back to `process.env.PUBLIC_ENV_NAME`  
   • Drives feature-flag logic.

5. **E2E_USERNAME** & **E2E_PASSWORD**  
   • In `e2e/fixtures/auth.setup.ts` via  
     ```ts
     const TEST_EMAIL    = process.env.E2E_USERNAME
     const TEST_PASSWORD = process.env.E2E_PASSWORD
     ```  
   • Used only by Playwright setup, running under Node.

---

## 2. Loading Sources / Contexts

- **Local Dev (`npm run dev`)**  
  `.env` → Vite/Astro automatically exposes all `VITE_`-prefixed vars to `import.meta.env`.  
  (Note: non-`VITE_` vars aren’t exposed by default.)

- **Local E2E Dev (`npm run dev:e2e`)**  
  `playwright.config.ts` explicitly calls  
  ```ts
  dotenv.config({ path: '.env.test' })
  ```  
  before any test runs.

- **Vitest**  
  By default, Vite’s test mode also loads `.env.test` → `import.meta.env`.

- **GitHub Actions**  
  - Unit tests: `PUBLIC_ENV_NAME: local` injected via `env:` block.  
  - E2E tests: full set of secrets (`SUPABASE_URL`, `SUPABASE_KEY`, `OPENROUTER_API_KEY`, `E2E_USERNAME`, `E2E_PASSWORD`, `PUBLIC_ENV_NAME: local`, `CI: true`) injected via `env:`.  
  - Build/deploy: workflows set `PUBLIC_ENV_NAME: prod` and inject `SUPABASE_*` & `OPENROUTER_API_KEY`.

- **Cloudflare Pages**  
  - Build step sees only `wrangler.toml` `[vars]` and any Dashboard variables it inlines.  
  - Any `import.meta.env.*` usage is baked into `dist/` at build time. Secrets bound only at runtime are never inlined.

---

## 3. Cloudflare Pages 500 Error Root Cause

- Using `import.meta.env.SUPABASE_URL` in SSR code inlines `undefined` at build time (because Astro didn’t see that var in `.env` or `wrangler.toml`), so at runtime the Worker throws “supabaseUrl is required.”

---

## 4. Astro’s `astro:env` Advantages

- **Separation of build vs runtime**  
  - `import.meta.env.*` → build-time values only  
  - `astro:env` → generates `env.get('VAR')` calls inside your Cloudflare Worker at runtime

- **Secret safety**  
  - You only inline public variables; private secrets remain bound to the Worker.

---

## 5. Files & Code Patterns to Change

1. **src/db/supabase.client.ts**  
   - Replace  
     ```ts
     const supabaseUrl     = import.meta.env.SUPABASE_URL
     const supabaseAnonKey = import.meta.env.SUPABASE_KEY
     ```  
     with  
     ```ts
     import { env } from 'astro:env'
     const supabaseUrl     = env.SUPABASE_URL
     const supabaseAnonKey = env.SUPABASE_KEY
     ```

2. **src/lib/services/aiFlashcardGenerator.service.ts**  
   - Replace  
     ```ts
     const apiKey = import.meta.env.OPENROUTER_API_KEY
     ```  
     with  
     ```ts
     import { env } from 'astro:env'
     const apiKey = env.OPENROUTER_API_KEY
     ```

3. **src/features/index.ts**  
   - In `getCurrentEnvironment()`, remove `import.meta.env` usage and solely read from `astro:env`:  
     ```ts
     import { env } from 'astro:env'
     const envName = env.PUBLIC_ENV_NAME
     ```

4. **.env.example**  
   - Prefix any public vars with `PUBLIC_` and list all six variables.  
   - Document that private vars require Cloudflare Dashboard or `wrangler.toml` binding.

5. **wrangler.toml**  
   - Verify that only **public** variables (e.g. `PUBLIC_ENV_NAME`) live here.  
   - Private secrets stay in the Dashboard, not committed to Git.

6. **Playwright & Vitest configs**  
   - Leave E2E username/password on `process.env`. `astro:env` does not apply there.

---

## 6. Next Steps

- Install/import `astro:env` (added by default in Astro 5).  
- Update each file above to use `env.*`.  
- Remove any non-`VITE_` prefixes from `.env` so Vite/Astro only exposes intended public vars.  
- Test locally in both `npm run dev` and `npm run dev:e2e`.  
- Push to Cloudflare Pages; confirm runtime binding of secrets.  
