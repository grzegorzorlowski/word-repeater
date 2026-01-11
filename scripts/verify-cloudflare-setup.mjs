#!/usr/bin/env node

/**
 * Verification script for Cloudflare Pages setup
 *
 * This script checks:
 * 1. Cloudflare adapter is installed
 * 2. Astro config uses Cloudflare adapter
 * 3. Required environment variables are set
 * 4. Cookie handling is configured correctly
 */

import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

console.log("🔍 Verifying Cloudflare Pages Setup...\n");

let hasErrors = false;

// Check 1: Cloudflare adapter package
console.log("1️⃣  Checking Cloudflare adapter installation...");
try {
  const packageJson = JSON.parse(readFileSync(join(rootDir, "package.json"), "utf-8"));

  if (packageJson.dependencies["@astrojs/cloudflare"]) {
    console.log("   ✅ @astrojs/cloudflare is installed\n");
  } else {
    console.log("   ❌ @astrojs/cloudflare is NOT installed");
    console.log("   Run: npm install @astrojs/cloudflare\n");
    hasErrors = true;
  }

  if (packageJson.dependencies["@astrojs/node"]) {
    console.log("   ⚠️  @astrojs/node is still installed (should be removed)");
    console.log("   Run: npm uninstall @astrojs/node\n");
  }
} catch {
  console.log("   ❌ Could not read package.json\n");
  hasErrors = true;
}

// Check 2: Astro config
console.log("2️⃣  Checking Astro configuration...");
try {
  const astroConfig = readFileSync(join(rootDir, "astro.config.mjs"), "utf-8");

  if (astroConfig.includes("@astrojs/cloudflare")) {
    console.log("   ✅ Astro config imports Cloudflare adapter");
  } else {
    console.log("   ❌ Astro config does NOT import Cloudflare adapter");
    hasErrors = true;
  }

  if (astroConfig.includes("adapter: cloudflare")) {
    console.log("   ✅ Astro config uses Cloudflare adapter");
  } else {
    console.log("   ❌ Astro config does NOT use Cloudflare adapter");
    hasErrors = true;
  }

  if (astroConfig.includes("adapter: node")) {
    console.log("   ⚠️  Astro config still references Node adapter");
    hasErrors = true;
  }

  console.log("");
} catch {
  console.log("   ❌ Could not read astro.config.mjs\n");
  hasErrors = true;
}

// Check 3: Environment variables
console.log("3️⃣  Checking environment variables...");
const requiredEnvVars = ["SUPABASE_URL", "SUPABASE_KEY"];
const missingVars = [];

for (const varName of requiredEnvVars) {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName} is set`);
  } else {
    console.log(`   ⚠️  ${varName} is NOT set (required for runtime)`);
    missingVars.push(varName);
  }
}

if (missingVars.length > 0) {
  console.log("\n   Note: These variables should be set in your .env file for local development");
  console.log("   and in Cloudflare Pages dashboard for production.\n");
} else {
  console.log("");
}

// Check 4: Cookie handling
console.log("4️⃣  Checking cookie configuration...");
try {
  const supabaseClient = readFileSync(join(rootDir, "src/db/supabase.client.ts"), "utf-8");

  if (supabaseClient.includes("secure: import.meta.env.PROD")) {
    console.log("   ✅ Cookie secure flag is environment-aware");
  } else if (supabaseClient.includes("secure: true")) {
    console.log("   ⚠️  Cookie secure flag is hardcoded to true");
    console.log("   This may cause authentication issues in local development.");
    console.log("   See: .ai/cloudflare-auth-fix.md for details\n");
  } else {
    console.log("   ✅ Cookie configuration looks correct");
  }

  console.log("");
} catch {
  console.log("   ⚠️  Could not verify cookie configuration\n");
}

// Check 5: Wrangler config
console.log("5️⃣  Checking Wrangler configuration...");
if (existsSync(join(rootDir, "wrangler.toml"))) {
  console.log("   ✅ wrangler.toml exists\n");
} else {
  console.log("   ⚠️  wrangler.toml not found (optional but recommended)\n");
}

// Summary
console.log("━".repeat(50));
if (hasErrors) {
  console.log("❌ Setup verification FAILED");
  console.log("\nPlease fix the errors above before deploying to Cloudflare Pages.");
  console.log("For detailed instructions, see: .ai/cloudflare-deployment.md\n");
  process.exit(1);
} else {
  console.log("✅ Setup verification PASSED");
  console.log("\nYour project is configured for Cloudflare Pages!");
  console.log("\nNext steps:");
  console.log("  1. Test locally: npm run dev");
  console.log("  2. Build: npm run build");
  console.log("  3. Deploy to Cloudflare Pages");
  console.log("\nFor deployment instructions, see: .ai/cloudflare-deployment.md\n");
}
