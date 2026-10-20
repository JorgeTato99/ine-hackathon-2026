import { availableParallelism } from "node:os";

// Calibrados con la batería real. La evidencia resumida vive en test/benchmark-baseline.json.
const profiles = {
  ligero: {
    unit: 1,
    e2e: 1,
    schedule: "series",
  },
  eficiente: {
    unit: 2,
    e2e: 1,
    schedule: "parallel",
  },
  rapido: {
    unit: 2,
    e2e: 2,
    schedule: "parallel",
  },
} as const;

export type TestProfile = keyof typeof profiles;

export function resolveProfile(value = process.env.TEST_PROFILE): TestProfile {
  if (value === undefined || value === "") return "eficiente";
  if (value === "ligero" || value === "eficiente" || value === "rapido") return value;
  throw new Error(`TEST_PROFILE=${value}: usa ligero, eficiente o rapido.`);
}

export function profileSettings(profile: TestProfile) {
  return profiles[profile];
}

export function workersFor(battery: "unit" | "e2e"): number {
  return Math.max(1, Math.min(profiles[resolveProfile()][battery], availableParallelism() - 1));
}
