/**
 * Hand-off for the Workers AI binding. worker/index.ts registers it per
 * request because route handlers can't see `env`; kept dependency-free so
 * the worker entry doesn't pull in the app's modules.
 */

export interface WorkersAiBinding {
  run(
    model: string,
    input: { text: string[] },
  ): Promise<{ data?: number[][] }>;
}

const BINDING_KEY = "__taaWorkersAi";

export function registerWorkersAi(binding: WorkersAiBinding | undefined): void {
  (globalThis as Record<string, unknown>)[BINDING_KEY] = binding;
}

export function getWorkersAi(): WorkersAiBinding | undefined {
  return (globalThis as Record<string, unknown>)[BINDING_KEY] as
    | WorkersAiBinding
    | undefined;
}
