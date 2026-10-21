import { spawn } from "node:child_process";
import { closeSync, mkdirSync, openSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const options = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const match = /^--(unit-workers|e2e-workers|schedule|output)=(.+)$/.exec(arg);
    if (!match) throw new Error(`Argumento inválido: ${arg}`);
    return [match[1], match[2]];
  })
);
for (const key of ["unit-workers", "e2e-workers"]) {
  if (!/^[1-9]\d*$/.test(options[key] ?? "")) throw new Error(`Falta ${key} positivo.`);
}
if (!["series", "parallel"].includes(options.schedule) || !options.output) {
  throw new Error("Indicar schedule=series|parallel y output.");
}
const output = resolve(options.output);
mkdirSync(output, { recursive: true });

async function run(name, entry, args, env = process.env) {
  const fd = openSync(resolve(output, `${name}.log`), "w");
  try {
    return await new Promise((done) => {
      const child = spawn(process.execPath, [resolve(root, "node_modules", entry), ...args], {
        cwd: root,
        env,
        stdio: ["ignore", fd, fd],
        windowsHide: true,
      });
      child.on("error", (error) => {
        console.error(error);
        done(1);
      });
      child.on("close", (code) => done(code ?? 1));
    });
  } finally {
    closeSync(fd);
  }
}
const unit = () =>
  run("unit", "vitest/vitest.mjs", [
    "run",
    "--coverage",
    `--maxWorkers=${options["unit-workers"]}`,
    "--reporter=json",
    `--outputFile=${resolve(output, "unit.json")}`,
    `--coverage.reportsDirectory=${resolve(output, "coverage")}`,
  ]);
const e2e = () =>
  run(
    "e2e",
    "@playwright/test/cli.js",
    [
      "test",
      `--workers=${options["e2e-workers"]}`,
      "--retries=0",
      "--reporter=json",
      `--output=${resolve(output, "assets")}`,
    ],
    { ...process.env, PLAYWRIGHT_JSON_OUTPUT_FILE: resolve(output, "e2e.json") }
  );
const codes =
  options.schedule === "parallel"
    ? await Promise.all([unit(), e2e()])
    : [await unit(), await e2e()];
writeFileSync(
  resolve(output, "controller.json"),
  JSON.stringify({ schedule: options.schedule, codes }) + "\n"
);
process.exitCode = codes.every((code) => code === 0) ? 0 : 1;
