/**
 * Feature Flags Visualization Script
 *
 * Run this script to see all feature flags and their states across environments
 *
 * Usage:
 *   node --loader tsx scripts/show-feature-flags.mjs
 *   or
 *   tsx scripts/show-feature-flags.mjs
 */

// Since this is an .mjs file and we need to import TypeScript,
// we'll create a simple visualization based on the configuration

const config = {
  signup: {
    defaultEnabled: false,
    environments: {
      local: true,
      integration: false,
      prod: false,
    },
  },
  resetPassword: {
    defaultEnabled: false,
    environments: {
      local: true,
      integration: false,
      prod: false,
    },
  },
};

const environments = ["local", "integration", "prod"];

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║          Feature Flags Configuration Matrix           ║");
console.log("╚════════════════════════════════════════════════════════════╝\n");

// Print header
const header = "Feature Flag".padEnd(20) + environments.map((env) => env.padEnd(15)).join("");
console.log(header);
console.log("─".repeat(65));

// Print each feature flag
Object.entries(config).forEach(([flag, flagConfig]) => {
  const row =
    flag.padEnd(20) +
    environments
      .map((env) => {
        const enabled = flagConfig.environments[env] ?? flagConfig.defaultEnabled;
        const symbol = enabled ? "✅" : "❌";
        return `${symbol} ${enabled ? "Enabled " : "Disabled"}`.padEnd(15);
      })
      .join("");
  console.log(row);
});

console.log("\n");

// Print current environment info
const currentEnv = process.env.ENV_NAME?.toLowerCase() || "local";
console.log(`Current ENV_NAME: ${currentEnv}`);

if (!environments.includes(currentEnv) && process.env.ENV_NAME) {
  console.log(`⚠️  Warning: Invalid ENV_NAME "${process.env.ENV_NAME}", will default to "local"`);
}

console.log("\n");

// Print current active flags
console.log("Active flags in current environment:");
Object.entries(config).forEach(([flag, flagConfig]) => {
  const enabled = flagConfig.environments[currentEnv] ?? flagConfig.defaultEnabled;
  if (enabled) {
    console.log(`  ✅ ${flag}`);
  }
});

const disabledCount = Object.entries(config).filter(([, flagConfig]) => {
  const enabled = flagConfig.environments[currentEnv] ?? flagConfig.defaultEnabled;
  return !enabled;
}).length;

if (disabledCount > 0) {
  console.log("\nDisabled flags in current environment:");
  Object.entries(config).forEach(([flag, flagConfig]) => {
    const enabled = flagConfig.environments[currentEnv] ?? flagConfig.defaultEnabled;
    if (!enabled) {
      console.log(`  ❌ ${flag}`);
    }
  });
}

console.log("\n");
