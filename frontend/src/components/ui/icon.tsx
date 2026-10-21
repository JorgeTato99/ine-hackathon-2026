import type { CSSProperties } from "react";

const paths = {
  bookmark: "M6 3h12v18l-6-4-6 4V3Z",
  map: "m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16m6-14v16",
  table: "M3 4h18v16H3V4Zm0 5h18M9 4v16M3 14h18",
  search: "m20 20-5-5M10 17a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0ZM12 7v6m-3-3h6",
  compare: "M4 5h6v14H4V5Zm10 0h6v14h-6V5ZM12 2v20",
  info: "M12 11v6m0-10v1m9 4a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  help: "M9.5 8.5a2.5 2.5 0 1 1 4 2c-1 .7-1.5 1.2-1.5 2.5m0 3v.1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  chevron: "m9 5 7 7-7 7",
  close: "m6 6 12 12M6 18 18 6",
  reset: "M3 11a9 9 0 1 1 2 7M3 4v7h7",
  filter: "M4 5h16M7 12h10M10 19h4M8 3v4m8 3v4m-4 3v4",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  collapse: "M3 8h5V3m8 0v5h5M8 21v-5H3m18 0h-5v5",
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1m-2 7a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11Z",
} as const;

export function Icon({
  name,
  size = 20,
  style,
}: {
  name: keyof typeof paths;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, verticalAlign: "middle", ...style }}
    >
      <path d={paths[name]} />
    </svg>
  );
}
