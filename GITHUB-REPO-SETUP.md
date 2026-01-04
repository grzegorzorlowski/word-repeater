# GitHub Repository Configuration Checklist

Before running your workflows, verify these GitHub settings:

## 1. ✅ Actions Permissions

Go to: **Settings** → **Actions** → **General**

### Workflow Permissions
- [ ] Select **"Read and write permissions"** 
  - OR keep "Read repository contents and packages permissions" if you prefer more security
  - The workflow now has explicit permissions defined, so this should work either way
  
### Allow GitHub Actions to create and approve pull requests
- [ ] Check this box if you want workflows to be able to create PRs (optional for now)

## 2. ✅ Create Integration Environment

Go to: **Settings** → **Environments** → **New environment**

- [ ] Create environment named: `integration`
- [ ] Add the following secrets to this environment:

### Required Secrets for E2E Tests:
```
BASE_URL                 (e.g., http://localhost:3000)
SUPABASE_URL             (your Supabase project URL)
SUPABASE_ANON_KEY        (your Supabase anonymous key)
SUPABASE_KEY             (your Supabase service role key)
E2E_USERNAME             (test user email, e.g., test@example.com)
E2E_PASSWORD             (test user password)
E2E_USERNAME_ID          (test user UUID from Supabase)
```

**Note:** You can get these values from:
- Your local `.env.test` file (if you have one)
- Your Supabase project dashboard
- Create a test user in your Supabase database

## 3. ✅ Branch Protection Rules (Optional but Recommended)

Go to: **Settings** → **Branches** → **Add rule**

For branch: `master`

Recommended settings:
- [ ] **Require a pull request before merging**
  - [ ] Require approvals: 1 (if working in a team)
- [ ] **Require status checks to pass before merging**
  - [ ] Add status checks: `lint`, `unit-test`, `e2e-test`
  - [ ] Require branches to be up to date before merging
- [ ] **Do not allow bypassing the above settings** (uncheck "Allow administrators to bypass")

## 4. ✅ Actions Settings

Go to: **Settings** → **Actions** → **General**

### Actions permissions:
- [ ] Select **"Allow all actions and reusable workflows"**
  - OR "Allow [organization] and select non-[organization] actions and reusable workflows"

### Artifact and log retention:
- [ ] Default is 90 days (our workflows use 7 days for artifacts)

### Fork pull request workflows:
- [ ] **"Require approval for first-time contributors"** (recommended for security)

## 5. ✅ Verify Workflow Files Are in Master Branch

- [ ] Make sure `.github/workflows/` directory exists in `master` branch
- [ ] Both `build.yml` and `pull-request.yml` should be visible in the Actions tab

**Important:** GitHub only recognizes workflows that exist in the default branch (`master` in your case).

## 6. ✅ Check Current Settings (Quick Commands)

You can check some settings via GitHub CLI (if installed):

```bash
# Check workflow permissions
gh api repos/grzegorzorlowski/word-repeater/actions/permissions

# List environments
gh api repos/grzegorzorlowski/word-repeater/environments

# List secrets in an environment
gh secret list --env integration
```

Or simply go to your repository URL:
```
https://github.com/grzegorzorlowski/word-repeater/settings
```

## 7. ✅ Test User Setup in Supabase

For E2E tests to work, you need a test user in Supabase:

### Option A: Create via Supabase Dashboard
1. Go to: **Authentication** → **Users** → **Add user**
2. Create user with email matching `E2E_USERNAME`
3. Set password matching `E2E_PASSWORD`
4. Copy the user's UUID for `E2E_USERNAME_ID`

### Option B: Create via SQL
```sql
-- In Supabase SQL Editor
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),  -- This will be your E2E_USERNAME_ID
  'test@example.com',  -- Your E2E_USERNAME
  crypt('SecurePass123!', gen_salt('bf')),  -- Your E2E_PASSWORD
  now(),
  now(),
  now()
);
```

## Summary Checklist

Before you continue testing:

- [ ] Workflow permissions configured
- [ ] `integration` environment created
- [ ] All 7 secrets added to `integration` environment
- [ ] Test user exists in Supabase
- [ ] Workflow files merged to `master` branch
- [ ] Branch protection rules configured (optional)

## What Happens After Setup

Once all settings are configured:

1. **Push changes** → Triggers `build` workflow on `master`
2. **Create/Update PR** → Triggers `pull-request` workflow
3. **Workflows run** with proper permissions
4. **E2E tests** use secrets from `integration` environment
5. **Status comment** appears on your PR with results

## Need Help?

If you get stuck, check:
- GitHub Actions logs in the **Actions** tab
- The "Verify environment variables" step in the e2e-test job
- `GITHUB-ACTIONS-DEBUG.md` for troubleshooting tips

