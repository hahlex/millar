#!/usr/bin/env node
/**
 * Enforces Millar Lifecycle Governance (Draft / Approved / Deprecated):
 * 1. Every registry item must declare lifecycle.status in ["draft", "approved", "deprecated"].
 * 2. Any item marked "approved" MUST include human sign-off metadata (approvedBy + ISO approvedAt)
 *    and approvedBy MUST NOT identify an AI agent.
 * 3. Any item marked "deprecated" MUST include deprecatedSince and migration/replacement guidance.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const REGISTRY_PATH = path.join(ROOT, "packages", "tokens", "dist", "millar-registry.json");
const VALID_STATUSES = new Set(["draft", "approved", "deprecated"]);
const AI_APPROVER_PATTERN = /\b(ai|agent|bot|llm|claude|gemini|gpt|copilot|antigravity)\b/i;

if (!fs.existsSync(REGISTRY_PATH)) {
  console.log("PASS: Governance gate active (no compiled registry yet in Phase 0).");
  process.exit(0);
}

const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8"));
/** @type {string[]} */
const errors = [];
let checked = 0;

function checkEntry(kind, entry) {
  checked += 1;
  const id = entry?.id ?? "(missing-id)";
  const status = entry?.status;
  if (!VALID_STATUSES.has(status)) {
    errors.push(`${kind}:${id} has invalid lifecycle status "${String(status)}"`);
    return;
  }
  if (status === "approved") {
    if (!entry.approvedBy || typeof entry.approvedBy !== "string" || entry.approvedBy.trim().length < 2) {
      errors.push(`${kind}:${id} is marked "approved" without human approvedBy sign-off`);
    } else if (AI_APPROVER_PATTERN.test(entry.approvedBy)) {
      errors.push(`${kind}:${id} cannot be approved by an AI agent ("${entry.approvedBy}")`);
    }
    if (!entry.approvedAt || !/^\d{4}-\d{2}-\d{2}/.test(entry.approvedAt)) {
      errors.push(`${kind}:${id} is marked "approved" without ISO approvedAt date`);
    }
  }
  if (status === "deprecated") {
    if (!entry.deprecatedSince || !entry.migrationNote) {
      errors.push(`${kind}:${id} is marked "deprecated" without deprecatedSince and migrationNote`);
    }
  }
}

for (const collectionKey of [
  "guidelines",
  "components",
  "compositionPatterns",
  "visualAssets",
  "sections",
  "templates",
  "motionPresets",
]) {
  const list = registry[collectionKey];
  if (Array.isArray(list)) {
    for (const item of list) checkEntry(collectionKey, item);
  }
}

// Verify referential integrity of visual asset IDs across patterns, sections, and templates
const validAssetIds = new Set((registry.visualAssets ?? []).map((v) => v.id));
for (const pat of registry.compositionPatterns ?? []) {
  for (const ref of pat.pairedAssets ?? []) {
    if (!validAssetIds.has(ref)) {
      errors.push(`compositionPatterns:${pat.id} references unknown visual asset "${ref}"`);
    }
  }
}
for (const sec of registry.sections ?? []) {
  for (const ref of sec.visualAssetsUsed ?? []) {
    if (!validAssetIds.has(ref)) {
      errors.push(`sections:${sec.id} references unknown visual asset "${ref}"`);
    }
  }
}
for (const tpl of registry.templates ?? []) {
  for (const ref of tpl.visualAssetsUsed ?? []) {
    if (!validAssetIds.has(ref)) {
      errors.push(`templates:${tpl.id} references unknown visual asset "${ref}"`);
    }
  }
}

if (errors.length > 0) {
  console.error(`FAIL: Governance check failed with ${errors.length} violation(s):`);
  for (const e of errors) console.error(`  - ${e}`);
  process.exit(1);
}

console.log(`PASS: Governance check verified ${checked} registry item(s).`);
