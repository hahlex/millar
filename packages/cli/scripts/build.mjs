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
let skillCount = 0;
if (fs.existsSync(skillsSrc)) {
  fs.cpSync(skillsSrc, skillsOut, { recursive: true });
  skillCount = fs
    .readdirSync(skillsOut, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(skillsOut, d.name, "SKILL.md"))).length;
}

const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));
console.log(`PASS: Built millar CLI v${pkg.version} (dist/cli.js) + ${skillCount} bundled Millar Skills`);
