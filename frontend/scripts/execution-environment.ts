import { constants, setPriority } from "node:os";
import { getBuildWorkers } from "./build-budget.ts";
import type { TestProfile } from "./execution-profile.ts";

export function environmentFor(kind: "test" | "build", profile?: TestProfile): NodeJS.ProcessEnv {
  const inheritedOptions = process.env.NODE_OPTIONS ?? "";
  const testOptions = /--max[-_]old[-_]space[-_]size/.test(inheritedOptions)
    ? inheritedOptions
    : `${inheritedOptions} --max-old-space-size=3072`.trim();
  const buildOptions =
    process.env.BUILD_NODE_OPTIONS ?? (inheritedOptions || "--max-old-space-size=6144");
  const threads = kind === "build" ? String(getBuildWorkers()) : "2";

  return {
    ...process.env,
    ...(profile ? { TEST_PROFILE: profile } : {}),
    UV_THREADPOOL_SIZE: threads,
    RAYON_NUM_THREADS: threads,
    NEXT_TELEMETRY_DISABLED: "1",
    STORYBOOK_DISABLE_TELEMETRY: "1",
    NODE_OPTIONS: kind === "build" ? buildOptions : testOptions,
  };
}

export function applyTestPriority(profile: TestProfile): void {
  try {
    setPriority(
      profile === "ligero"
        ? constants.priority.PRIORITY_BELOW_NORMAL
        : constants.priority.PRIORITY_NORMAL
    );
  } catch {
    console.warn("El sistema no permitió ajustar la prioridad del testing.");
  }
}
