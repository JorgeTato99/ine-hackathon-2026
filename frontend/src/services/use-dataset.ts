"use client";

import { useQuery } from "@tanstack/react-query";
import { decodeDataset } from "@/utils/dataset";
import { resultsRelease } from "@/content/release";

export function useDataset() {
  return useQuery({
    queryKey: ["territorial-dataset", resultsRelease.version],
    staleTime: Infinity,
    queryFn: async ({ signal }) => {
      const response = await fetch(new URL("/data/dataset.json", window.location.origin), {
        signal,
      });
      if (!response.ok)
        throw new Error("No se pudo cargar el corte de datos. Puedes volver a intentarlo.");
      return decodeDataset(await response.json());
    },
  });
}
