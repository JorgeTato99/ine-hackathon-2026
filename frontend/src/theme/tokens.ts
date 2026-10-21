export const brand = {
  name: "Traza Cívica",
  descriptor: "Participación y territorio",
} as const;

export const designSystem = { name: "Traza Cívica", version: "1.8.0" } as const;

// Factores MUI en unidades de 8 px; strings para usar dimensiones CSS sin multiplicarlas.
export const space = {
  0: "0px",
  0.5: "4px",
  1: "8px",
  1.5: "12px",
  2: "16px",
  2.5: "20px",
  3: "24px",
  4: "32px",
  5: "40px",
  6: "48px",
  8: "64px",
  10: "80px",
  12: "96px",
} as const;
export const radii = {
  control: "6px",
  panel: "12px",
  feature: "20px",
  overlay: "16px",
  pill: "999px",
} as const;
export const layout = { app: 1600, editorial: 1240, reading: "72ch", rail: 200 } as const;
// Medidas en píxeles CSS; fracción de viewport para la hoja inferior.
export const explorerLayout = {
  toolbar: 360,
  compactToolbar: 300,
  panel: 360,
  compactPanel: 320,
  zoomReserve: 76,
  inset: 16,
  narrowInset: 8,
  sheetFraction: 0.52,
  mapHeight: {
    xs: "clamp(280px, calc(100dvh - 475px), 520px)",
    sm: "clamp(340px, calc(100dvh - 390px), 700px)",
    lg: "clamp(360px, calc(100dvh - 375px), 720px)",
  },
} as const;
export const density = { compact: 2, comfortable: 3, editorial: 4 } as const;
export const typeScale = {
  family: "Roboto, Arial, sans-serif",
  display: {
    fontSize: "clamp(2.125rem, 3.8vw, 3.375rem)",
    lineHeight: 1.08,
    fontWeight: 700,
    letterSpacing: "-.045em",
  },
  title: {
    fontSize: "clamp(1.625rem, 2.5vw, 2rem)",
    lineHeight: 1.2,
    fontWeight: 700,
    letterSpacing: "-.04em",
  },
  compactTitle: {
    fontSize: "clamp(1.25rem, 2vw, 1.5rem)",
    lineHeight: 1.25,
    fontWeight: 700,
    letterSpacing: "-.035em",
  },
  section: { fontSize: "1.5rem", lineHeight: 1.3, fontWeight: 700, letterSpacing: "-.025em" },
  subtitle: { fontSize: "1.125rem", lineHeight: 1.4, fontWeight: 700 },
  body: { fontSize: "1rem", lineHeight: 1.7 },
  small: { fontSize: ".875rem", lineHeight: 1.6 },
  caption: { fontSize: ".75rem", lineHeight: 1.5 },
  label: { fontSize: ".6875rem", lineHeight: 1.6, fontWeight: 700, letterSpacing: ".11em" },
} as const;
export const motionTokens = {
  duration: { instant: 0, feedback: 120, enter: 220, emphasis: 360, mapFlight: 800 },
  easing: {
    standard: "cubic-bezier(.2, 0, 0, 1)",
    entrance: "cubic-bezier(.22, 0, .36, 1)",
    exit: "cubic-bezier(.4, 0, 1, 1)",
  },
  distance: { subtle: 6, entrance: 12 },
  stagger: { step: 60, max: 120 },
} as const;

export const entrancePresets = {
  hero: { duration: 520, distance: 24 },
  heading: { duration: 400, distance: 16 },
  block: { duration: 520, distance: 24 },
  item: { duration: 400, distance: 16 },
  card: { duration: 520, distance: 0 },
} as const;

export const motionCompositions = {
  trace: {
    delay: 120,
    step: 220,
    duration: 520,
    markerDuration: 360,
    linkDuration: 220,
    linkOffset: 180,
    detailOffset: 60,
    distance: 24,
    markerScale: 0.65,
  },
  archive: { delay: 120, step: 140, duration: 640, gap: 12, distance: 24, startScale: 0.94 },
  card: { startScale: 0.965 },
  location: { duration: 640, delay: 160, ringDelay: 400, distance: 24, planeScale: 0.9 },
} as const;

export const contextMapTokens = {
  sequential: ["#E4EDF5", "#C4DBEE", "#9AC3E0", "#6AA4CD", "#417FAE", "#285D89", "#173F67"],
  categorical: [
    "#426DA9",
    "#D29C47",
    "#759C81",
    "#8D76AE",
    "#A86873",
    "#599FAD",
    "#92924E",
    "#667383",
    "#BC8460",
    "#897B6A",
  ],
  missing: "#B9BEC7",
  noBooth: "#8D76AE",
  zones: {
    "fría (bajo-bajo)": "#4C78AD",
    "caliente (alto-alto)": "#C77355",
    "bajo rodeado de alto": "#95B8D9",
    "alto rodeado de bajo": "#E6B18B",
    "no significativa": "#D9DDDF",
  },
} as const;

export const colors = {
  light: {
    canvas: "#F7F6F2",
    surface: "#FFFFFF",
    ink: "#222838",
    muted: "#596273",
    line: "#DDDCD6",
    control: "#78818E",
    accent: "#4338CA",
    accentSoft: "#EDEBFF",
    neutralSoft: "#ECECE8",
    info: "#245C8A",
    infoSoft: "#EAF2F8",
    warning: "#805800",
    warningSoft: "#FFF2CC",
    error: "#A42E35",
    errorSoft: "#FCE9EB",
    success: "#17664B",
    successSoft: "#E7F2EB",
  },
  dark: {
    canvas: "#151823",
    surface: "#1D2230",
    ink: "#F2F3F8",
    muted: "#BBC1CF",
    line: "#454C5C",
    control: "#929BAD",
    accent: "#B8AEFF",
    accentSoft: "#302D53",
    neutralSoft: "#2C313C",
    info: "#9CCDF4",
    infoSoft: "#20394B",
    warning: "#F0CF82",
    warningSoft: "#3D3218",
    error: "#FFA6AD",
    errorSoft: "#48242B",
    success: "#8DD6AF",
    successSoft: "#19392D",
  },
} as const;

export const riskTokens = {
  bajo: {
    label: "Bajo",
    shape: "●",
    ink: "#17664B",
    fill: "#E7F2EB",
    map: "#69AE90",
    darkInk: "#8DD6AF",
    darkFill: "#19392D",
  },
  medio: {
    label: "Medio",
    shape: "◆",
    ink: "#805800",
    fill: "#FFF2CC",
    map: "#DBB956",
    darkInk: "#F0CF82",
    darkFill: "#3D3218",
  },
  alto: {
    label: "Alto",
    shape: "■",
    ink: "#A42E35",
    fill: "#FCE9EB",
    map: "#CB727C",
    darkInk: "#FFA6AD",
    darkFill: "#48242B",
  },
  sin_estimacion: {
    label: "Sin estimación",
    shape: "▧",
    ink: "#656D79",
    fill: "#EEF0F2",
    map: "#D8DBDE",
    darkInk: "#B4BBC7",
    darkFill: "#2C313C",
  },
} as const;

export type Risk = keyof typeof riskTokens;
