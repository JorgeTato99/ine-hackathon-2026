import { describe, expect, it } from "vitest";
import { freeMapRectangle } from "@/utils/map-viewport";
import { riskTokens, riskMapColor, colors } from "@/theme/tokens";

describe("área libre y semáforo por tema", () => {
  it("reserva espacio entre paneles abiertos y lo recupera al minimizarlos", () => {
    const open = [
      { left: 16, top: 16, right: 376, bottom: 350 },
      { left: 16, top: 520, right: 296, bottom: 680 },
      { left: 810, top: 16, right: 1170, bottom: 680 },
    ];
    const expanded = freeMapRectangle(1265, 712, open);
    for (const box of open)
      expect(
        expanded.right <= box.left ||
          expanded.left >= box.right ||
          expanded.bottom <= box.top ||
          expanded.top >= box.bottom
      ).toBe(true);
    const collapsed = freeMapRectangle(
      1265,
      712,
      open.map((box) => ({ ...box, right: box.left + 240, bottom: box.top + 44 }))
    );
    expect((collapsed.right - collapsed.left) * (collapsed.bottom - collapsed.top)).toBeGreaterThan(
      (expanded.right - expanded.left) * (expanded.bottom - expanded.top)
    );
  });
  it("soporta vista pequeña, panel fuera del marco y ausencia de espacio", () => {
    expect(freeMapRectangle(320, 220, []).left).toBe(24);
    expect(freeMapRectangle(20, 20, []).left).toBe(5);
    expect(
      freeMapRectangle(320, 220, [{ left: -100, top: -100, right: 400, bottom: 400 }]).right
    ).toBe(296);
    expect(
      freeMapRectangle(320, 220, [{ left: 600, top: 600, right: 900, bottom: 900 }]).bottom
    ).toBe(196);
  });
  it("ofrece seis rellenos distintos y mantiene el significado de riesgo", () => {
    expect(colors.light.accent).toBe("#4338CA");
    expect(colors.dark.accent).toBe("#B8AEFF");
    const colorsByTheme = ["alto", "medio", "bajo"].flatMap((risk) => [
      riskMapColor(risk as keyof typeof riskTokens),
      riskMapColor(risk as keyof typeof riskTokens, true),
    ]);
    expect(new Set(colorsByTheme).size).toBe(6);
    const luminance = (hex: string) => {
      const rgb = [1, 3, 5]
        .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
    };
    for (const risk of ["alto", "medio", "bajo"] as const)
      expect(luminance(riskMapColor(risk, true))).toBeLessThan(luminance(riskMapColor(risk)));
    expect(parseInt(riskTokens.alto.map.slice(5, 7), 16)).toBeGreaterThan(
      parseInt(riskTokens.alto.map.slice(3, 5), 16)
    );
  });
});
