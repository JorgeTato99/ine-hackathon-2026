import { test as base, expect } from "@playwright/test";

export const test = base.extend<{ consoleGuard: void }>({
  consoleGuard: [
    async ({ page }, runTest) => {
      const errors: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      page.on("pageerror", (error) => errors.push(error.message));
      await runTest();
      expect(errors, "La aplicación no debe emitir errores de consola").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
