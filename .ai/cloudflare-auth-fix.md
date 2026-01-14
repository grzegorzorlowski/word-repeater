# Cloudflare Adapter Authentication Fix

## Problem

After switching from the `@astrojs/node` adapter to `@astrojs/cloudflare` adapter, authentication stopped working in local development. Users experienced:

- Infinite redirect loop to `/login?redirect=%2Fdashboard`
- Unable to log in successfully
- Session cookies not being set

## Root Cause

The issue was caused by the `secure` flag in cookie options being set to `true` for all environments. 

In the original implementation:

```typescript
export const cookieOptions: CookieOptionsWithName = {
  path: "/",
  secure: true,  // ❌ This requires HTTPS
  httpOnly: true,
  sameSite: "lax",
};
```

**Why this caused issues:**

1. The `secure: true` flag requires cookies to be transmitted only over HTTPS
2. Local development runs on HTTP (`http://localhost:3000`)
3. Browsers refuse to set cookies with `secure: true` over HTTP connections
4. Without cookies, the authentication session cannot be established
5. The middleware detects no authenticated user and redirects to login
6. After successful login, cookies still can't be set, creating an infinite loop

## Solution

Modified the `createSupabaseServerClient` function in `src/db/supabase.client.ts` to explicitly set all security flags for cookies:

```typescript
export const createSupabaseServerClient = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return parseCookieHeader(context.headers.get("Cookie") ?? "");
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Explicitly set security options for authentication cookies
          const cookieOptions = {
            ...options,
            httpOnly: true,              // ✅ Prevent XSS attacks
            sameSite: "lax" as const,    // ✅ Prevent CSRF attacks
            secure: import.meta.env.PROD, // ✅ false in dev, true in prod
          };
          context.cookies.set(name, value, cookieOptions);
        });
      },
    },
  });

  return supabase;
};
```

**Key changes:**

1. Explicitly set `httpOnly: true` - Prevents XSS attacks
2. Explicitly set `sameSite: "lax"` - Prevents CSRF attacks while allowing normal navigation
3. Set `secure` flag dynamically in the `setAll` function based on environment
4. Use `import.meta.env.PROD` to determine environment:
   - `false` in development (allows HTTP cookies)
   - `true` in production (requires HTTPS cookies for security)

## Why This Works

### Development Environment
- `import.meta.env.PROD` is `false`
- Cookies are set with `secure: false`
- Browsers accept cookies over HTTP
- Authentication works correctly on `localhost`

### Production Environment (Cloudflare Pages)
- `import.meta.env.PROD` is `true`
- Cookies are set with `secure: true`
- Cloudflare Pages always uses HTTPS
- Cookies are transmitted securely
- No security compromise

## Testing the Fix

### Manual Testing

1. **Clear existing cookies**:
   - Open browser DevTools
   - Go to Application/Storage tab
   - Clear all cookies for `localhost:3000`

2. **Restart dev server**:
   ```bash
   npm run dev
   ```

3. **Test login flow**:
   - Navigate to `http://localhost:3000/login`
   - Enter valid credentials
   - Submit the form
   - Should redirect to `/dashboard` successfully
   - Check DevTools → Application → Cookies to verify cookies are set

4. **Test protected routes**:
   - Navigate to `http://localhost:3000/dashboard`
   - Should stay on dashboard (not redirect to login)
   - Verify middleware allows access

### E2E Testing

Run the E2E tests to verify authentication flows:

```bash
npm run test:e2e
```

The tests should pass, including:
- Login flow
- Protected route access
- Session persistence
- Logout flow

## Security Considerations

### Development
- ✅ Cookies work over HTTP for local testing
- ⚠️ Never use development mode in production
- ⚠️ Development cookies are less secure (by design)

### Production
- ✅ Cookies require HTTPS (secure flag enforced)
- ✅ Cloudflare Pages provides automatic HTTPS
- ✅ No security compromise compared to previous setup
- ✅ Follows security best practices

## Cloudflare-Specific Notes

### Why This Issue Appeared

The Node.js adapter (`@astrojs/node`) may have handled cookie options differently or had different defaults. The Cloudflare adapter is stricter about cookie handling because it runs in the Cloudflare Workers runtime, which has different characteristics than a traditional Node.js server.

### Cloudflare Workers Runtime

- Runs on V8 isolates (not full Node.js)
- Stricter security defaults
- Edge-first architecture
- Different cookie handling mechanisms

### Best Practices for Cloudflare

1. **Always use environment-aware cookie settings**
2. **Test locally with the Cloudflare adapter** before deploying
3. **Use `wrangler pages dev`** for even closer production parity
4. **Set appropriate `sameSite` values** for your use case
5. **Consider using Cloudflare KV** for session storage in production (optional)

## Alternative Solutions Considered

### Option 1: Use wrangler for local development
```bash
wrangler pages dev -- npm run dev
```
- ✅ Provides HTTPS locally
- ❌ More complex setup
- ❌ Requires additional configuration

### Option 2: Static secure flag based on environment variable
```typescript
secure: process.env.NODE_ENV === 'production'
```
- ❌ Doesn't work in Cloudflare Workers (no `process.env`)
- ❌ Less reliable than `import.meta.env.PROD`

### Option 3: Separate cookie options for dev/prod
```typescript
const cookieOptions = import.meta.env.PROD ? prodOptions : devOptions;
```
- ✅ Works but more verbose
- ❌ Requires maintaining two configurations

**Chosen solution (dynamic override) is the cleanest and most maintainable.**

## Related Files

- `src/db/supabase.client.ts` - Cookie handling implementation
- `src/middleware/index.ts` - Authentication middleware
- `src/pages/api/auth/login.ts` - Login endpoint
- `astro.config.mjs` - Cloudflare adapter configuration

## Additional Resources

- [Supabase SSR Documentation](https://supabase.com/docs/guides/auth/server-side/overview)
- [Cloudflare Workers Runtime](https://developers.cloudflare.com/workers/runtime-apis/)
- [MDN: Set-Cookie Secure Flag](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#secure)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)

## Conclusion

The authentication issue was caused by incompatible cookie security settings between development (HTTP) and the Cloudflare adapter's expectations. By making the `secure` flag environment-aware, we maintain security in production while enabling proper functionality in local development.

This fix is transparent to the rest of the application and requires no changes to authentication logic, middleware, or API endpoints.

