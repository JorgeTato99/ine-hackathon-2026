import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { cleanup, configure } from "@testing-library/react";
import failOnConsole from "vitest-fail-on-console";
import { server } from "./test-utils/msw/server";

configure({ testIdAttribute: "data-pw" });
failOnConsole({ shouldFailOnError: true, shouldFailOnWarn: false });

// jsdom no implementa matchMedia, que MUI consulta para los esquemas de color.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
    dispatchEvent: () => false,
  }),
});

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  document.documentElement.classList.remove("light", "dark");
});
afterAll(() => server.close());
