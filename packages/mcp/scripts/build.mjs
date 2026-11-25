import esbuild from "esbuild";
import path from "node:path";

const pkgDir = path.resolve(import.meta.dirname, "..");

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

console.log("PASS: Bundled @hahlex/millar-mcp dist/stdio.js and dist/http.js");
