// Two things tsup cannot do on its own.
//
// 1. dist/styles.css, written from the same string the component injects, so
//    the injected and the importable stylesheet can never drift.
// 2. The "use client" directive. tsup's banner option runs before rollup, and
//    rollup hoists module-level directives out of bundled chunks — it says so
//    in a warning. Prepending after the bundle is written is the only way it
//    survives, and without it Next.js App Router treats the component as a
//    server component and throws on the first useState.
import { readFileSync, writeFileSync } from "node:fs";

const root = new URL("../", import.meta.url);

const source = readFileSync(new URL("src/styles.ts", root), "utf8");
const match = source.match(/export const css = `([\s\S]*)`;\s*$/);
if (!match) {
  console.error("postbuild: could not find the css template literal in src/styles.ts");
  process.exit(1);
}
const bannerText = "/* Generated from src/styles.ts — do not edit by hand. */\n";
writeFileSync(new URL("dist/styles.css", root), bannerText + match[1].trimStart());
console.log(`postbuild: dist/styles.css (${match[1].length} bytes)`);

// "use client" may precede "use strict": both sit in the directive prologue,
// so strict mode still applies in the CJS build.
for (const file of ["dist/index.js", "dist/index.cjs"]) {
  const target = new URL(file, root);
  const code = readFileSync(target, "utf8");
  if (/^\s*["']use client["']/.test(code)) continue;
  writeFileSync(target, `"use client";\n${code}`);
  console.log(`postbuild: "use client" prepended to ${file}`);
}
