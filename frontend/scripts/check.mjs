import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { profileSettings, resolveProfile } from "./execution-profile.ts";
import { environmentFor } from "./execution-environment.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const profileArgs = args.filter((arg) => arg.startsWith("--profile="));
if (
  args.some(
    (arg) => !/^(--full|--tests|--reuse-build|--profile=(ligero|eficiente|rapido))$/.test(arg)
  ) ||
  new Set(args).size !== args.length ||
  profileArgs.length > 1 ||
  (args.includes("--full") && args.includes("--tests")) ||
  (args.includes("--reuse-build") && !args.includes("--tests"))
) {
  throw new Error("Uso: check.mjs [--full | --tests] [--profile=ligero|eficiente|rapido]");
}
const profile = resolveProfile(profileArgs[0]?.slice("--profile=".length));
if (args.includes("--reuse-build") && !existsSync(resolve(root, "out/index.html"))) {
  throw new Error("No hay exportación disponible: ejecutar npm run build antes.");
}
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error("Ejecutar este orquestador mediante npm run.");

const results = [];
let exitCode = 0;
let testingSeconds = null;
console.log(`Perfil ${profile}: compilado independiente y una ejecución de cada batería.`);

async function runTask(task, scope = "single") {
  const kind = task === "build" || task === "build-storybook" ? "build" : "test";
  const start = performance.now();
  console.log(`\n> ${task}`);
  const code = await new Promise((done) => {
    const child = spawn(process.execPath, [npmCli, "run", task], {
      cwd: root,
      env: environmentFor(kind, profile),
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", (error) => {
      console.error(error.message);
      done(1);
    });
    child.on("close", (code) => done(code ?? 1));
  });
  results.push({
    task,
    kind,
    scope,
    code,
    seconds: Number(((performance.now() - start) / 1000).toFixed(3)),
  });
  return code;
}

const complete = args.includes("--tests") || args.includes("--full");
const tasks = args.includes("--tests")
  ? args.includes("--reuse-build")
    ? []
    : ["build"]
  : ["typecheck", "lint", "format:check"];
if (args.includes("--full")) tasks.push("build", "build-storybook");
if (!complete) tasks.push("test:unit:coverage");
for (const task of tasks) {
  if ((await runTask(task)) !== 0) {
    exitCode = 1;
    break;
  }
}

if (exitCode === 0 && complete) {
  const testingStart = performance.now();
  const schedule = profileSettings(profile).schedule;
  console.log(`\nTesting completo: ${schedule}, con build ya disponible.`);
  if (schedule === "parallel") {
    const codes = await Promise.all([
      runTask("test:unit:coverage", "all"),
      runTask("test:e2e:run", "all"),
    ]);
    if (codes.some((code) => code !== 0)) exitCode = 1;
  } else {
    for (const task of ["test:unit:coverage", "test:e2e:run"]) {
      if ((await runTask(task, "all")) !== 0) {
        exitCode = 1;
        break;
      }
    }
  }
  testingSeconds = Number(((performance.now() - testingStart) / 1000).toFixed(3));
}

const reports = resolve(root, "artifacts/checks");
await mkdir(reports, { recursive: true });
await writeFile(
  resolve(reports, "latest.json"),
  JSON.stringify(
    { date: new Date().toISOString(), profile, testingSeconds, results, exitCode },
    null,
    2
  ) + "\n"
);
console.table(results);
process.exitCode = exitCode;
