export type ExplorerDistribution = "lateral" | "abajo";

export function readExplorerDistribution(params: URLSearchParams): ExplorerDistribution {
  return params.get("distribucion") === "abajo" ? "abajo" : "lateral";
}
