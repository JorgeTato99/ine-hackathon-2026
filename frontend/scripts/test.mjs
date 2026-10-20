import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveProfile, workersFor } from "./execution-profile.ts";
import { applyTestPriority, environmentFor } from "./execution-environment.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [task, ...args] = process.argv.slice(2);
const commands = {
  unit: ["vitest/vitest.mjs", "run"],
  watch: ["vitest/vitest.mjs"],
  coverage: ["vitest/vitest.mjs", "run", "--coverage"],
  e2e: ["@playwright/test/cli.js", "test"],
  "e2e-ui": ["@playwright/test/cli.js", "test", "--ui"],
};
if (!Object.hasOwn(commands, task)) {
  throw new Error("Tarea de testing desconocida.");
}
const profile = resolveProfile();
applyTestPriority(profile);
console.log(
  `Testing ${task}: perfil ${profile}, límite ${workersFor(task.startsWith("e2e") ? "e2e" : "unit")} workers.`
);
const [entry, ...baseArgs] = commands[task];
const child = spawn(
  process.execPath,
  [resolve(root, "node_modules", entry), ...baseArgs, ...args],
  {
    cwd: root,
    env: environmentFor("test", profile),
    stdio: "inherit",
    windowsHide: true,
  }
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("exit", (code) => {
  process.exitCode = code ?? 1;
});
