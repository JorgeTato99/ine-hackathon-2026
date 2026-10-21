import { describe, expect, it } from "vitest";
import { waitFor } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { renderHookWithProviders } from "../test-utils/render-with-providers";
import { server } from "../test-utils/msw/server";

const fixtureUrl = "https://fixtures.invalid/version.json";

function useFixture() {
  return useQuery({
    queryKey: ["test-fixture"],
    queryFn: async () => {
      const response = await fetch(fixtureUrl);
      if (!response.ok) throw new Error("No se pudo leer el archivo");
      return (await response.json()) as { version: string };
    },
  });
}

describe("Infraestructura de consultas y red simulada", () => {
  it("resuelve un archivo sin necesitar servicios externos", async () => {
    server.use(http.get(fixtureUrl, () => HttpResponse.json({ version: "fixture" })));
    const { result, unmount } = renderHookWithProviders(useFixture);
    await waitFor(() => expect(result.current.data?.version).toBe("fixture"));
    unmount();

    server.use(http.get(fixtureUrl, () => new HttpResponse(null, { status: 503 })));
    const next = renderHookWithProviders(useFixture);
    await waitFor(() => expect(next.result.current.isError).toBe(true));
    expect(next.result.current.data).toBeUndefined();
  });
});
