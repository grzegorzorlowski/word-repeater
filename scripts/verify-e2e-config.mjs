#!/usr/bin/env node

/**
 * Verification script to check E2E test configuration
 * Usage: node scripts/verify-e2e-config.mjs
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

console.log("🔍 E2E Configuration Verification\n");
console.log("=".repeat(50));

// Check if .env.test exists
const envTestPath = path.join(projectRoot, ".env.test");
console.log("\n📄 Checking .env.test file...");
if (fs.existsSync(envTestPath)) {
  console.log("✅ .env.test file exists");

  // Load and display environment variables
  const envConfig = dotenv.config({ path: envTestPath });
  if (envConfig.parsed) {
    console.log("\n🔑 Environment variables loaded from .env.test:");
    Object.keys(envConfig.parsed).forEach((key) => {
      // Don't show sensitive values, just confirm they're set
      const value = envConfig.parsed[key];
      if (
        key.toLowerCase().includes("secret") ||
        key.toLowerCase().includes("password") ||
        key.toLowerCase().includes("key")
      ) {
        console.log(`   ${key}: [HIDDEN]`);
      } else {
        console.log(`   ${key}: ${value}`);
      }
    });
  }
} else {
  console.log("❌ .env.test file not found");
  console.log("   Create a .env.test file in the project root");
}

// Check playwright.config.ts
console.log("\n⚙️  Checking playwright.config.ts...");
const playwrightConfigPath = path.join(projectRoot, "playwright.config.ts");
if (fs.existsSync(playwrightConfigPath)) {
  console.log("✅ playwright.config.ts exists");
  const content = fs.readFileSync(playwrightConfigPath, "utf-8");

  // Check for dotenv import
  if (content.includes('import * as dotenv from "dotenv"')) {
    console.log("✅ dotenv is imported");
  } else {
    console.log("❌ dotenv is not imported");
  }

  // Check for .env.test loading
  if (content.includes(".env.test")) {
    console.log("✅ .env.test is being loaded");
  } else {
    console.log("⚠️  .env.test might not be loaded");
  }

  // Check webServer command
  if (content.includes("npm run dev:e2e")) {
    console.log("✅ webServer uses 'npm run dev:e2e'");
  } else {
    console.log("⚠️  webServer might not use the correct command");
  }
} else {
  console.log("❌ playwright.config.ts not found");
}

// Check package.json scripts
console.log("\n📦 Checking package.json scripts...");
const packageJsonPath = path.join(projectRoot, "package.json");
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));

  if (packageJson.scripts["dev:e2e"]) {
    console.log(`✅ dev:e2e script exists: "${packageJson.scripts["dev:e2e"]}"`);
  } else {
    console.log("❌ dev:e2e script not found in package.json");
  }

  if (packageJson.scripts["test:e2e"]) {
    console.log(`✅ test:e2e script exists: "${packageJson.scripts["test:e2e"]}"`);
  } else {
    console.log("❌ test:e2e script not found in package.json");
  }
}

// Check astro.config.mjs
console.log("\n🚀 Checking astro.config.mjs...");
const astroConfigPath = path.join(projectRoot, "astro.config.mjs");
if (fs.existsSync(astroConfigPath)) {
  console.log("✅ astro.config.mjs exists");
  const content = fs.readFileSync(astroConfigPath, "utf-8");

  // Check for test mode handling
  if (content.includes("test") && content.includes(".env.test")) {
    console.log("✅ Test mode configuration detected");
  } else {
    console.log("⚠️  Test mode configuration might be missing");
  }

  // Check for port configuration
  const portMatch = content.match(/port:\s*(\d+)/);
  if (portMatch) {
    console.log(`✅ Server port configured: ${portMatch[1]}`);
  }
} else {
  console.log("❌ astro.config.mjs not found");
}

console.log("\n" + "=".repeat(50));
console.log("\n💡 Recommendations:");
console.log("   1. Make sure .env.test contains all necessary environment variables");
console.log("   2. Run tests with: npm run test:e2e");
console.log("   3. For debugging: npm run test:e2e:debug");
console.log("   4. For UI mode: npm run test:e2e:ui");
console.log("\n🎯 Current Configuration:");
console.log(`   Base URL: ${process.env.BASE_URL || "http://localhost:3000"}`);
console.log(`   Mode: ${process.env.NODE_ENV || "development"}`);
console.log("\n");
