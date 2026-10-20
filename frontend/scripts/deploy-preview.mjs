import { spawn } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { cp, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--reuse-build"))
  throw new Error("Solo se admite --reuse-build para una exportación vigente y comprobada.");
const host = process.env.PREVIEW_SSH_HOST ?? "dell-latitude-5420";
if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(host)) throw new Error("Alias SSH inválido.");

function run(command, parameters) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, parameters, { cwd: root, stdio: "inherit", windowsHide: true });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolveRun() : reject(new Error(`${command} terminó con código ${code}.`))
    );
  });
}

if (!args.includes("--reuse-build"))
  await run(process.execPath, [resolve(root, "scripts/build.mjs"), "next"]);
for (const file of [
  "index.html",
  "datos/index.html",
  "metodologia/index.html",
  "data/manifest.json",
])
  if (!(await stat(resolve(root, "out", file))).isFile()) throw new Error(`Falta out/${file}.`);

const builtAt = new Date().toISOString();
const release = `r${builtAt.replace(/[^0-9]/g, "").slice(0, 14)}-${randomBytes(4).toString("hex")}`;
const work = resolve(root, "artifacts/preview", release);
const context = resolve(work, "context");
await mkdir(context, { recursive: true });
await cp(resolve(root, "out"), resolve(context, "out"), { recursive: true });
await cp(resolve(root, "LICENSE"), resolve(context, "LICENSE"));
for (const file of ["Dockerfile.export", "compose.preview.yaml", "activate.sh"])
  await cp(resolve(root, "deploy", file), resolve(context, file));
const nginx = await readFile(resolve(root, "nginx.conf"), "utf8");
await writeFile(
  resolve(context, "nginx.conf"),
  nginx.replace(
    "server_tokens off;",
    'server_tokens off;\n    add_header X-Robots-Tag "noindex, nofollow, noarchive" always;'
  )
);
await writeFile(
  resolve(context, "out/deployment.json"),
  `${JSON.stringify({ release, builtAt, environment: "development-preview", mode: "production-static" })}\n`
);
const archive = resolve(work, `${release}.tar.gz`);
await run("tar", ["-czf", archive, "-C", context, "."]);
const sha256 = createHash("sha256")
  .update(await readFile(archive))
  .digest("hex");
await writeFile(
  resolve(work, "deployment.json"),
  `${JSON.stringify({ release, host, sha256, builtAt }, null, 2)}\n`
);
const sshArgs = ["-o", "BatchMode=yes", "-o", "ConnectTimeout=15", host];
await run("ssh", [
  ...sshArgs,
  'mkdir -p "$HOME/projects/traza-civica-preview/incoming" "$HOME/projects/traza-civica-preview/releases"',
]);
await run("scp", [
  "-o",
  "BatchMode=yes",
  archive,
  `${host}:projects/traza-civica-preview/incoming/${release}.tar.gz`,
]);
const remote = [
  "set -eu",
  'cd "$HOME/projects/traza-civica-preview"',
  `echo '${sha256}  incoming/${release}.tar.gz' | sha256sum -c -`,
  `mkdir 'releases/${release}'`,
  `tar -xzf 'incoming/${release}.tar.gz' -C 'releases/${release}'`,
  `bash 'releases/${release}/activate.sh'`,
].join(" && ");
await run("ssh", [...sshArgs, remote]);
console.log(`\nVista de desarrollo: https://traza-civica.jorgetato.com/ (${release})`);
