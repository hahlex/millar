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

// Bundle standalone glossary & changelog docs so npx @hahlex/millar-mcp works outside the monorepo
const docsOut = path.join(pkgDir, "dist/docs");
fs.mkdirSync(docsOut, { recursive: true });
for (const docFile of ["GLOSSARY.md", "CHANGELOG.md"]) {
  const src = path.join(repoRoot, docFile);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(docsOut, docFile));
  }
}

console.log("PASS: Bundled @hahlex/millar-mcp dist/stdio.js, dist/http.js, and standalone docs");
