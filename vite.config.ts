import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

import { defineConfig, type Plugin } from "vite";
import vinext from "vinext";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { imagesOptimizer } from "@vinext/cloudflare/images/images-optimizer";

const require = createRequire(import.meta.url);

/**
 * Route handlers run in the RSC environment, where `react` / `react-dom`
 * resolve to their react-server builds. The PDF (@react-pdf reconciler) and
 * email (@react-email -> react-dom/server.edge) renderers need the full
 * builds, as they get under Next.js where they are server-external packages.
 * React DOM's own react-server files keep the server build.
 */
const FULL_REACT_IMPORTER =
  /\/node_modules\/(@react-pdf|@react-email)\/|\/node_modules\/react-dom\/(?!.*react-server)/;

function rendererFullReact(): Plugin {
  const serverEdge = require.resolve("react-dom/server.edge");
  const targets: Record<string, string> = {
    react: require.resolve("react"),
    "react/jsx-runtime": require.resolve("react/jsx-runtime"),
    "react-dom": require.resolve("react-dom"),
    "react-dom/server": serverEdge,
    "react-dom/server.edge": serverEdge,
  };
  return {
    name: "renderer-full-react",
    enforce: "pre",
    applyToEnvironment: (environment) => environment.name === "rsc",
    resolveId(source, importer) {
      if (importer && FULL_REACT_IMPORTER.test(importer) && source in targets) {
        return targets[source];
      }
    },
  };
}

/**
 * yoga-layout (used by @react-pdf/layout) compiles WebAssembly from embedded
 * base64 at runtime, which Workers forbid. Extract the bytes to a .wasm file so
 * it is imported as a precompiled module, and hand it to Emscripten's
 * `instantiateWasm` hook instead.
 */
function yogaPrecompiledWasm(): Plugin {
  const yogaDist = path.join(path.dirname(require.resolve("yoga-layout")), "..");
  const loaderPath = path.join(yogaDist, "binaries/yoga-wasm-base64-esm.js");
  const match = /data:application\/octet-stream;base64,([A-Za-z0-9+/=]+)/.exec(
    readFileSync(loaderPath, "utf8"),
  );
  if (!match) throw new Error("yoga-layout: embedded wasm not found");
  const wasmDir = path.join(import.meta.dirname, "node_modules/.cache/yoga-workers");
  const wasmPath = path.join(wasmDir, "yoga.wasm");
  mkdirSync(wasmDir, { recursive: true });
  writeFileSync(wasmPath, Buffer.from(match[1], "base64"));

  const virtualId = "\0yoga-layout-load-workers";
  return {
    name: "yoga-precompiled-wasm",
    enforce: "pre",
    applyToEnvironment: (environment) => environment.name === "rsc",
    resolveId(source) {
      if (source === "yoga-layout/load") return virtualId;
    },
    load(id) {
      if (id !== virtualId) return;
      return [
        `import loadYogaImpl from ${JSON.stringify(loaderPath)};`,
        `import wrapAssembly from ${JSON.stringify(path.join(yogaDist, "src/wrapAssembly.js"))};`,
        `import yogaWasm from ${JSON.stringify(`${wasmPath}?module`)};`,
        `export * from ${JSON.stringify(path.join(yogaDist, "src/generated/YGEnums.js"))};`,
        `export async function loadYoga() {`,
        `  return wrapAssembly(await loadYogaImpl({`,
        `    instantiateWasm(imports, receiveInstance) {`,
        `      WebAssembly.instantiate(yogaWasm, imports).then((instance) => receiveInstance(instance, yogaWasm));`,
        `      return {};`,
        `    },`,
        `  }));`,
        `}`,
      ].join("\n");
    },
  };
}

export default defineConfig({
  // postcss.config.mjs is for `next build`; Tailwind runs as a Vite plugin here.
  css: { postcss: {} },
  plugins: [
    rendererFullReact(),
    yogaPrecompiledWasm(),
    tailwindcss(),
    vinext({
      images: { optimizer: imagesOptimizer() },
    }),
    cloudflare({
      viteEnvironment: {
        name: "rsc",
        childEnvironments: ["ssr"],
      },
    }),
  ],
});
