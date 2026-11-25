import path from "node:path";
import { compileMillar } from "./compiler.js";

const rootDir = path.resolve(import.meta.dirname, "../../..");
const result = compileMillar({ rootDir, writeFiles: true });

if (result.registry.contrastSummary.failed > 0) {
  console.error("FAIL: WCAG AA contrast failures detected:");
  for (const f of result.registry.contrastSummary.failures) {
    console.error(`  - [${f.theme}] ${f.token} on ${f.against}: ${f.ratio}:1 (min ${f.minRequired}:1)`);
  }
  process.exit(1);
}

if (!result.registry.colorBlindSummary.passed) {
  console.error(
    `FAIL: Data-viz color-blind separation below threshold (minDeltaE=${result.registry.colorBlindSummary.minDeltaE})`,
  );
  process.exit(1);
}

console.log(
  `PASS: Compiled Millar SSoT (DTCG ${result.registry.dtcgSpecVersion}) | contrast=${result.registry.contrastSummary.passed}/${result.registry.contrastSummary.totalChecked} | cvdMinDeltaE=${result.registry.colorBlindSummary.minDeltaE} | guidelines=${result.registry.guidelines.length} | components=${result.registry.components.length} | patterns=${result.registry.compositionPatterns.length} | visualAssets=${result.registry.visualAssets.length} | sections=${result.registry.sections.length} | templates=${result.registry.templates.length}`,
);
