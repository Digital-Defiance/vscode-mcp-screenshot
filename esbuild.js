const esbuild = require("esbuild");
const { globSync } = require("glob");

const production = process.argv.includes("--production");
const test = process.argv.includes("--test");
const watch = process.argv.includes("--watch");

async function main() {
  const entryPoints = test
    ? ["src/test/runTest.ts", "src/test/suite/index.ts", ...globSync("src/test/suite/*.test.ts")]
    : ["src/extension.ts"];

  const ctx = await esbuild.context({
    entryPoints,
    bundle: true,
    format: "cjs",
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: "node",
    outdir: "out",
    outbase: "src",
    external: ["vscode"],
    logLevel: "silent",
    plugins: [
      /* add to the end of plugins array */
      esbuildProblemMatcherPlugin,
    ],
  });
  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      console.log("[watch] build finished");
    });
  },
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
