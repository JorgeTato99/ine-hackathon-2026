import { describe, expect, it } from "vitest";
import { readExplorerDistribution } from "@/utils/explorer-distribution";

describe("Distribución del mapa y ficha", () => {
  it.each(["", "distribucion=lateral", "distribucion=otra"])(
    "usa lateral como lectura segura: %s",
    (query) => {
      expect(readExplorerDistribution(new URLSearchParams(query))).toBe("lateral");
    }
  );
  it("lee la preferencia inferior sin modificar el resto de la consulta", () => {
    const query = new URLSearchParams("distribucion=abajo&municipio=30087&anio=2024");
    expect(readExplorerDistribution(query)).toBe("abajo");
    expect(query.get("municipio")).toBe("30087");
    expect(query.get("anio")).toBe("2024");
  });
});
