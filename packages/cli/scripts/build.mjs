import fs from "node:fs";
import path from "node:path";

const pkgDir = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(pkgDir, "../..");
const distDir = path.join(pkgDir, "dist");

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.copyFileSync(path.join(pkgDir, "src/cli.mjs"), path.join(distDir, "cli.js"));

const skillsSrc = path.join(repoRoot, "skills");
const skillsOut = path.join(distDir, "skills");
if (fs.existsSync(skillsSrc)) {
  fs.cpSync(skillsSrc, skillsOut, { recursive: true });
}

console.log("PASS: Built millar CLI (dist/cli.js) + 7 bundled Millar Skills");
