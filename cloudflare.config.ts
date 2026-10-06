import { bindings, defineConfig, defineWorker, triggers } from "cf/config";

export default defineConfig({
  worker: defineWorker({
    name: "tulsa-ai-readiness-index",
    entrypoint: "./worker/index.ts",
    compatibilityDate: "2026-10-06",
    compatibilityFlags: ["nodejs_compat"],
    assets: { notFoundHandling: "none" },
    triggers: [triggers.scheduled({ schedule: "0 * * * *" })],
    env: {
      ASSETS: bindings.assets(),
      IMAGES: bindings.images(),
    },
  }),
});
