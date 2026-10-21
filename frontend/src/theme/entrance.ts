import type { entrancePresets } from "./tokens";

export type EntrancePreset = keyof typeof entrancePresets;

/** Marca un contenedor existente sin introducir wrappers ni alterar su semántica. */
export function entranceProps(preset: EntrancePreset) {
  return { "data-entrance": preset } as const;
}
