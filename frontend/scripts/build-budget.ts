import { availableParallelism } from "node:os";

export function getBuildWorkers(value = process.env.BUILD_WORKERS ?? "8"): number {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error("BUILD_WORKERS debe ser un entero positivo.");
  }
  return Math.max(1, Math.min(Number(value), availableParallelism() - 1));
}
