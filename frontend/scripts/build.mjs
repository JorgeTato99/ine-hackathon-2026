import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { environmentFor } from "./execution-environment.ts";
import { verifyBrandAssets } from "./prepare-brand-assets.mjs";
import { verifyDataAssets } from "./verify-data-assets.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const [target, ...args] = process.argv.slice(2);
if (target !== "next" && target !== "storybook") throw new Error("Build desconocido.");
await verifyBrandAssets();
await verifyDataAssets();
const manifest = JSON.parse(
  readFileSync(resolve(root, "node_modules", target, "package.json"), "utf8")
);
const entry = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.[target];
if (!entry) throw new Error(`No se encontró el ejecutable de ${target}.`);
const commandArgs = target === "next" ? ["build", "--webpack", ...args] : ["build", ...args];
const child = spawn(
  process.execPath,
  [resolve(root, "node_modules", target, entry), ...commandArgs],
  {
    cwd: root,
    env: environmentFor("build"),
    stdio: "inherit",
    windowsHide: true,
  }
);
child.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on("close", (code) => {
  process.exitCode = code ?? 1;
});
