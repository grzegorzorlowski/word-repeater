# Alternative Solution: Use GitHub Actions Deployment

## Why This is Better

Your Cloudflare UI configuration is broken/corrupted with conflicting commands. Instead of fighting with the UI, **use GitHub Actions** which you already have configured!

## Benefits

✅ More control over deployment process  
✅ Run tests before deployment  
✅ Better CI/CD pipeline  
✅ Avoid Cloudflare UI bugs  
✅ Already configured in `.github/workflows/master.yml`

## Setup Steps

### Step 1: Disable Cloudflare Automatic Builds

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Workers & Pages** > **word-repeater**
3. Go to **Settings** > **Builds & deployments**
4. Find **Git integration** or **Build configuration**
5. **Disable automatic builds** or **Disconnect Git integration**

This prevents Cloudflare from trying to build on every push.

### Step 2: Set Up GitHub Secrets

You need to add these secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Add these secrets (click **New repository secret** for each):

| Secret Name | Value | Where to Get It |
|-------------|-------|-----------------|
| `CLOUDFLARE_API_TOKEN` | Your Cloudflare API token | Cloudflare Dashboard → My Profile → API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID | Cloudflare Dashboard → Account Home (in URL) |
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Project Settings |
| `SUPABASE_KEY` | Your Supabase service role key | Supabase Dashboard → Project Settings → API |
| `OPENROUTER_API_KEY` | Your OpenRouter API key | OpenRouter Dashboard |

#### How to Create Cloudflare API Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use template: **Edit Cloudflare Workers**
4. Or create custom token with these permissions:
   - **Account** > **Cloudflare Pages** > **Edit**
5. Copy the token and add it to GitHub secrets as `CLOUDFLARE_API_TOKEN`

#### How to Get Cloudflare Account ID

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Look at the URL: `https://dash.cloudflare.com/YOUR_ACCOUNT_ID_HERE/...`
3. Copy the account ID and add it to GitHub secrets as `CLOUDFLARE_ACCOUNT_ID`

### Step 3: Test the Workflow

1. Make a small change to your code (or an empty commit):
   ```bash
   git commit --allow-empty -m "Test GitHub Actions deployment"
   git push origin master
   ```

2. Watch the GitHub Actions workflow:
   - Go to your GitHub repository
   - Click **Actions** tab
   - Watch the "Master Branch Deployment" workflow run

3. The workflow will:
   - ✅ Lint your code
   - ✅ Run unit tests
   - ✅ Build the project
   - ✅ Deploy to Cloudflare Pages
   - ✅ Post deployment URL as a comment

### Step 4: Verify Deployment

After the workflow completes:

1. Check the **Actions** tab for success ✅
2. Visit your site: `https://word-repeater.pages.dev`
3. Verify it's working correctly

## How It Works

Your GitHub Actions workflow (`master.yml`) does this:

```yaml
1. Lint Job
   └── Run ESLint to check code quality

2. Unit Test Job (after lint)
   └── Run tests with coverage

3. Build Job (after tests pass)
   └── Build with production env vars
   └── Upload dist/ as artifact

4. Deploy Job (after build)
   └── Download dist/ artifact
   └── Deploy to Cloudflare Pages using Wrangler
   └── Post deployment status
```

The deployment command it uses:
```bash
wrangler pages deploy dist --project-name=word-repeater
```

This is the **correct** command for Cloudflare Pages!

## Troubleshooting

### If deployment fails with "Project not found"

The Cloudflare Pages project might not exist yet. Create it:

```bash
# Install Wrangler locally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy manually once to create the project
npm run build
wrangler pages deploy dist --project-name=word-repeater
```

After the first manual deployment, GitHub Actions will work automatically.

### If API token is invalid

Make sure your API token has these permissions:
- **Account** > **Cloudflare Pages** > **Edit**

Generate a new token if needed.

### If environment variables are missing

The environment variables you set in GitHub secrets are used during:
- **Build time** (for building the app)
- **Runtime** (for the deployed app)

Runtime variables also need to be set in Cloudflare Pages dashboard:
1. Go to **Workers & Pages** > **word-repeater**
2. Go to **Settings** > **Environment variables**
3. Add the same variables for **Production** environment

## Comparison

### Cloudflare Automatic Builds (Current - Broken)
❌ UI is buggy with conflicting commands  
❌ Less control over build process  
❌ Harder to debug  
✅ Simpler setup (when it works)

### GitHub Actions (Recommended)
✅ Full control over deployment  
✅ Run tests before deploying  
✅ Better debugging with logs  
✅ Already configured in your repo  
❌ Requires GitHub secrets setup (one-time)

## Maintenance

Once set up, GitHub Actions will:
- ✅ Automatically deploy every push to `master` branch
- ✅ Run tests before deployment
- ✅ Fail deployment if tests fail
- ✅ Post deployment status

No manual intervention needed!

## Optional: Keep Cloudflare Builds for Preview

You can use a hybrid approach:
- **GitHub Actions** for `master` branch (production)
- **Cloudflare automatic** for preview/PR branches

Just enable Cloudflare builds only for non-production branches.
