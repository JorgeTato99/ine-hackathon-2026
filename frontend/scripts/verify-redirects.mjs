import assert from "node:assert/strict";

const origin = new URL(process.env.REDIRECT_CHECK_URL ?? "http://127.0.0.1:18080");
for (let attempt = 0; ; attempt++) {
  try {
    const response = await fetch(new URL("/healthz", origin), {
      signal: AbortSignal.timeout(1000),
    });
    assert.equal(response.status, 200);
    break;
  } catch (error) {
    if (attempt === 29) throw error;
    await new Promise((done) => setTimeout(done, 200));
  }
}

for (const path of ["/datos", "/metodologia"]) {
  const response = await fetch(new URL(path, origin), { redirect: "manual" });
  assert.equal(response.status, 301, `${path}: canonicalización de directorio`);
  const location = response.headers.get("location");
  assert.equal(location, `${path}/`, `${path}: Location debe ser relativo al origen público`);
  const target = new URL(location, new URL(path, origin));
  assert.equal(target.origin, origin.origin);
  const destination = await fetch(target);
  assert.equal(destination.status, 200, `${path}: destino accesible`);
  console.log(`${path} -> ${location}: 301 relativo, destino 200`);
}
