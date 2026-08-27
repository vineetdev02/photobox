import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  treeshake: true,
  sourcemap: false,
  external: ["react", "react-dom"],
  // "use client" is added by scripts/postbuild.mjs instead of here: rollup
  // hoists module-level directives out of bundled chunks, so a banner set at
  // this point is silently dropped.
});
