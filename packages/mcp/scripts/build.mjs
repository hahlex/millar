import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";

const pkgDir = path.resolve(import.meta.dirname, "..");
const repoRoot = path.resolve(pkgDir, "../..");

const shared = {
  bundle: true,
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: false,
  banner: {
    js: 'import { createRequire } from "node:module"; const require = createRequire(import.meta.url);',
  },
};

await esbuild.build({
  ...shared,
  entryPoints: [path.join(pkgDir, "src/stdio.ts")],
  outfile: path.join(pkgDir, "dist/stdio.js"),
});

await esbuild.build({
  ...shared,
  entryPoints: [path.join(pkgDir, "src/http.ts")],
  outfile: path.join(pkgDir, "dist/http.js"),
});

// Bundle standalone glossary, changelog, and Millar Agent Skills so npx @hahlex/millar-mcp works outside the monorepo
const docsOut = path.join(pkgDir, "dist/docs");
fs.mkdirSync(docsOut, { recursive: true });
for (const docFile of ["GLOSSARY.md", "CHANGELOG.md"]) {
  const src = path.join(repoRoot, docFile);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(docsOut, docFile));
  }
}

const skillsSrc = path.join(repoRoot, "skills");
const skillsOut = path.join(pkgDir, "dist/skills");
let bundledSkillCount = 0;
if (fs.existsSync(skillsSrc)) {
  fs.rmSync(skillsOut, { recursive: true, force: true });
  fs.cpSync(skillsSrc, skillsOut, { recursive: true });
  bundledSkillCount = fs
    .readdirSync(skillsOut, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(skillsOut, d.name, "SKILL.md"))).length;
}

// Bundle registry source files so get_component / get_section / get_template / get_visual_assets(includeSource: true)
// work identically when @hahlex/millar-mcp runs standalone via npx outside the monorepo.
const registryPath = path.join(repoRoot, "packages/tokens/dist/millar-registry.json");
const sourcesOut = path.join(pkgDir, "dist/sources");
fs.rmSync(sourcesOut, { recursive: true, force: true });
let bundledSourceCount = 0;
if (fs.existsSync(registryPath)) {
  const reg = JSON.parse(fs.readFileSync(registryPath, "utf8"));
  const sourcePaths = new Set(
    [
      ...(reg.components ?? []),
      ...(reg.sections ?? []),
      ...(reg.templates ?? []),
      ...(reg.visualAssets ?? []),
    ]
      .map((item) => item?.sourcePath)
      .filter((p) => typeof p === "string" && p.length > 0),
  );
  for (const relPath of sourcePaths) {
    const src = path.join(repoRoot, relPath);
    if (fs.existsSync(src)) {
      const dst = path.join(sourcesOut, relPath);
      fs.mkdirSync(path.dirname(dst), { recursive: true });
      fs.copyFileSync(src, dst);
      bundledSourceCount++;
    }
  }
}

console.log(
  `PASS: Bundled @hahlex/millar-mcp dist/stdio.js, dist/http.js, standalone docs, ${bundledSourceCount} source files, and ${bundledSkillCount} Millar Skills`,
);
