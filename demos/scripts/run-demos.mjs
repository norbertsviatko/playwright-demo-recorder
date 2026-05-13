#!/usr/bin/env node

import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { checkbox } from "@inquirer/prompts";

const DEMOS_ROOT = path.resolve(import.meta.dirname, "..");
const GENERATED_DIR = path.join(DEMOS_ROOT, "generated");
const PROJECT_ROOT = path.resolve(DEMOS_ROOT, "..");
const CONFIG_PATH = "playwright.demos.config.ts";

// Discover available demo specs
const specs = fs
  .readdirSync(GENERATED_DIR)
  .filter((f) => f.endsWith(".spec.ts"))
  .sort();

if (specs.length === 0) {
  console.log("No demo specs found in demos/generated/");
  process.exit(0);
}

// Let user pick which demos to run
const selected = await checkbox({
  message: "Select demos to run (space to toggle, enter to confirm)",
  choices: specs.map((file) => ({
    name: file.replace(".spec.ts", ""),
    value: file,
    checked: true,
  })),
});

if (selected.length === 0) {
  console.log("No demos selected.");
  process.exit(0);
}

// Build Playwright command with selected files
const filePaths = selected
  .map((f) => `demos/generated/${f}`)
  .join(" ");

const cmd = `npx playwright test --config ${CONFIG_PATH} ${filePaths}`;

console.log(`\nRunning ${selected.length} demo(s)...\n`);

try {
  execSync(cmd, { cwd: PROJECT_ROOT, stdio: "inherit" });
} catch {
  process.exit(1);
}
