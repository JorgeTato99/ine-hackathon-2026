import release from "./release.json";

export const resultsRelease = {
  version: release.version,
  year: 2027,
  illustrative: false,
} as const;
export const resultMetadata = release.metadata;
export const publicationControls = release.controls;
