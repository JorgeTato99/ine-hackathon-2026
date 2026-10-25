import type { Risk } from "@/theme/tokens";

export type Municipality = {
  id: string;
  name: string;
  state: string;
  stateCode: string;
  nominal: number | null;
  history: Record<string, number | null>;
  historyIssue: string | null;
  hasData: boolean;
  hasGeometry: boolean;
  baseRisk?: Risk;
  indicators?: Record<string, string | number | boolean | null>;
  historyStatus?: Record<string, "sin_casilla">;
};
export type Scenario = { id: string; national: string; intervention: string; year: number };
export type Estimate = {
  participation: number | null;
  lower: number | null;
  upper: number | null;
  risk: Risk;
  state: string;
  reason: string | null;
  additionalVotes?: number | null;
  interventionEffect?: number | null;
};
export type Dataset = {
  schemaVersion: 1 | 2;
  version: string;
  sample: boolean;
  generatedAtSource: string;
  municipalities: Municipality[];
  scenarios: Scenario[];
  estimates: Record<string, Record<string, Estimate>>;
  comparisonPolicy: { status: "pending" | "confirmed"; pairs: string[][] };
  nationalLevels?: Record<string, number>;
  nationalHistory?: Record<string, number>;
  model?: string;
  intervalDescription?: string;
  source?: { repository: string; commit: string; directory: string };
  warnings: string[];
  geometry: {
    path: string;
    features: number;
    metadata: {
      captured: string;
      source: string;
      transformations: string;
      sourceMetadata: { state: string; metadata: Record<string, string> }[];
    };
  };
};
