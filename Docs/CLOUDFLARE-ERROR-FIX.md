# URGENT FIX: Invalid Request Body Error

## What's Happening

Your Cloudflare configuration has **conflicting deployment commands**:

Looking at your screenshot:
```
Build configuration (summary on left side):
├── Build command: npm run build           ✅ OK
├── Deploy command: npx wrangler pages deploy dist  ✅ OK for Pages
├── Version command: npx wrangler versions upload   ❌ CONFLICT! (Workers command)
└── Root directory: /
```

The error "Invalid request body" happens because **you have both a Pages deploy command AND a Workers version command**. These are mutually exclusive!

## The Fix: CLEAR the Deploy Command Field

Based on the error, try this:

### Step 1: Empty the Deploy Command
1. In the **Deploy command** field on the right side
2. **DELETE everything** - make it completely empty
3. Leave it blank/empty
4. Click **Update**

### Why?
- When you have Git integration, Cloudflare Pages deploys **automatically**
- You should NOT have a deploy command at all
- The "Version command" in the summary is old/stale config
- By removing the deploy command, it might clear the conflict

## If That Doesn't Work: Reset Configuration

### Option 1: Use Cloudflare API/Wrangler
```bash
# Delete the build configuration via CLI
wrangler pages project delete word-repeater
```

Then recreate the project with correct settings.

### Option 2: Disconnect and Reconnect Git

1. Go to **Settings** > **Builds & deployments**
2. Find **Git integration** or **Repository** section  
3. Click **Disconnect** or **Remove integration**
4. Reconnect your GitHub repository
5. Set ONLY these values:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Deploy command: **[LEAVE EMPTY]**

### Option 3: Contact Cloudflare Support

The configuration might be corrupted. The "Version command: npx wrangler versions upload" shouldn't exist for a Pages project at all.

## Root Cause

Somewhere in your project history:
1. The project was created or configured as a **Worker** (not Pages)
2. This set "Version command: npx wrangler versions upload"
3. Now you're trying to configure it as **Pages**
4. But the old Workers config is still there
5. This creates a conflict: "Am I deploying a Worker or a Page?"

## Correct Configuration for Pages

For a Cloudflare Pages project with Git integration:

```yaml
Build command: npm run build
Build output directory: dist
Deploy command: [EMPTY]
Version command: [SHOULD NOT EXIST]
Root directory: /
```

That's it! No deploy commands needed.

## Alternative: Use GitHub Actions Instead

If Cloudflare's UI is too broken, you can disable Cloudflare's automatic builds and use GitHub Actions instead:

1. Disconnect Git integration in Cloudflare
2. Use the `.github/workflows/master.yml` you already have
3. Set up `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` in GitHub secrets
4. The workflow will handle deployment using `wrangler pages deploy dist`

This bypasses Cloudflare's UI configuration entirely!

## Check Your Master Workflow

Your `.github/workflows/master.yml` should have deployment configured. Let me know if you want to use that instead of Cloudflare's automatic deployment.
