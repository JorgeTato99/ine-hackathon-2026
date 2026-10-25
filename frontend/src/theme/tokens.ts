export const brand = {
  name: "Traza Cívica",
  descriptor: "Participación y territorio",
} as const;

export const designSystem = { name: "Traza Cívica", version: "1.18.1" } as const;

export const brandImageTokens = {
  bannerWidth: 400,
  methodologyWidth: 760,
  downloadsWidth: 320,
} as const;

export const fontFamilies = {
  interface: '"Source Sans 3 Variable", Arial, sans-serif',
  editorial: '"Newsreader Variable", Georgia, serif',
} as const;

export const identityTokens = {
  rule: "1px",
  strongRule: "2px",
  signatureWidth: 52,
  signatureHeight: 16,
  signaturePath: "M2 11 16 5 31 11 49 3",
  signatureNodes: [
    [2, 11],
    [16, 5],
    [31, 11],
    [49, 3],
  ],
  territory: {
    viewBox: 96,
    padding: 8,
    width: 80,
    compactWidth: 64,
    compactTitleSize: "1.25rem",
    stroke: 1.25,
    fillOpacity: 0.15,
    titleSize: "clamp(1.5rem, 9cqi, 1.875rem)",
  },
} as const;

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
  panel: "8px",
  feature: "12px",
  overlay: "16px",
  pill: "999px",
} as const;
export const layout = { app: 1600, editorial: 1240, reading: "72ch", rail: 200 } as const;
const normalMapMinimum = 560;
export const forecastLayout = {
  detailWidth: 390,
  minimumMapHeight: normalMapMinimum,
  normalMapHeight: `var(--tc-workspace-height, max(${normalMapMinimum}px, calc(100dvh - 190px)))`,
  mobileMapHeight: "max(460px, 70dvh)",
  viewportGutter: 16,
} as const;
// Medidas en píxeles CSS; fracción de viewport para la hoja inferior.
export const explorerLayout = {
  sidebar: 340,
  stickyMinimumHeight: 520,
  stickyMapMinimum: 160,
  toolbar: 360,
  compactToolbar: 300,
  panel: 360,
  compactPanel: 320,
  panelHeader: 44,
  compactPanelHeader: 32,
  detailWidths: {
    compacta: 360,
    normal: "clamp(400px, calc(100dvw - 800px), 480px)",
    amplia: "clamp(480px, calc(100dvw - 720px), 600px)",
  },
  mapMode: {
    toolsWidth: { md: 240, lg: 320, xl: 360 },
    compactDetailWidth: 300,
    summaryMaximumWidth: 760,
    summaryMaximumHeight: 320,
    dock: { navigationWidth: 126, actionsWidth: 190, height: 50, gap: 8, bottom: 34 },
    // Añadir 14 % por lado al encuadre municipal deja contexto sin alejarlo demasiado.
    municipalityContextPadding: 0.14,
  },
  zoomReserve: 76,
  inset: 16,
  narrowInset: 8,
  sheetFraction: 0.52,
  mapHeight: {
    xs: "clamp(280px, calc(100dvh - 475px), 520px)",
    sm: "clamp(420px, calc(100dvh - 180px), 900px)",
    lg: "clamp(480px, calc(100dvh - 180px), 1000px)",
  },
} as const;
export const density = { compact: 2, comfortable: 3, editorial: 4 } as const;
export const typeScale = {
  family: fontFamilies.interface,
  wordmark: {
    fontFamily: fontFamilies.editorial,
    fontSize: "1.5rem",
    fontWeight: 600,
    lineHeight: 1.15,
    letterSpacing: "-.025em",
  },
  display: {
    fontFamily: fontFamilies.editorial,
    fontSize: "clamp(2.125rem, 3.8vw, 3.375rem)",
    lineHeight: 1.08,
    fontWeight: 500,
    letterSpacing: "-.025em",
  },
  title: {
    fontFamily: fontFamilies.editorial,
    fontSize: "clamp(1.625rem, 2.5vw, 2rem)",
    lineHeight: 1.2,
    fontWeight: 500,
    letterSpacing: "-.02em",
  },
  compactTitle: {
    fontFamily: fontFamilies.interface,
    fontSize: "clamp(1.375rem, 2vw, 1.75rem)",
    lineHeight: 1.15,
    fontWeight: 500,
    letterSpacing: "-.02em",
  },
  recordTitle: {
    fontFamily: fontFamilies.interface,
    fontSize: "1.875rem",
    lineHeight: 1.15,
    fontWeight: 500,
    letterSpacing: "-.02em",
  },
  fileTitle: {
    fontFamily: fontFamilies.interface,
    fontSize: "1.5rem",
    lineHeight: 1.2,
    fontWeight: 500,
    letterSpacing: "-.015em",
  },
  metric: {
    fontFamily: fontFamilies.interface,
    fontSize: "2.5rem",
    lineHeight: 1.2,
    fontWeight: 600,
    fontVariantNumeric: "tabular-nums",
  },
  section: {
    fontFamily: fontFamilies.interface,
    fontSize: "1.75rem",
    lineHeight: 1.2,
    fontWeight: 500,
    letterSpacing: "-.02em",
  },
  subtitle: { fontSize: "1.125rem", lineHeight: 1.4, fontWeight: 700 },
  body: { fontSize: "1.0625rem", lineHeight: 1.65 },
  small: { fontSize: ".875rem", lineHeight: 1.6 },
  caption: { fontSize: ".75rem", lineHeight: 1.5 },
  label: { fontSize: ".75rem", lineHeight: 1.5, fontWeight: 600, letterSpacing: ".085em" },
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
    secondary: "#275A70",
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
    secondary: "#A4CDDF",
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

/** Superficie de cierre editorial, con contraste propio en ambos temas. */
export const footerTokens = {
  background: colors.light.ink,
  darkBackground: colors.dark.surface,
  ink: colors.dark.ink,
  muted: colors.dark.muted,
  line: colors.dark.line,
  accent: colors.dark.accent,
} as const;

export const riskTokens = {
  bajo: {
    label: "Bajo",
    shape: "●",
    ink: "#17664B",
    fill: "#E7F2EB",
    map: "#65A58A",
    mapDark: "#39715D",
    darkInk: "#8DD6AF",
    darkFill: "#19392D",
  },
  medio: {
    label: "Medio",
    shape: "◆",
    ink: "#805800",
    fill: "#FFF2CC",
    map: "#D9B44A",
    mapDark: "#A18435",
    darkInk: "#F0CF82",
    darkFill: "#3D3218",
  },
  alto: {
    label: "Alto",
    shape: "■",
    ink: "#A42E35",
    fill: "#FCE9EB",
    map: "#C74A5A",
    mapDark: "#903545",
    darkInk: "#FFA6AD",
    darkFill: "#48242B",
  },
  sin_estimacion: {
    label: "Sin estimación",
    shape: "▧",
    ink: "#656D79",
    fill: "#EEF0F2",
    map: "#D8DBDE",
    mapDark: "#69717D",
    darkInk: "#B4BBC7",
    darkFill: "#2C313C",
  },
} as const;

export type Risk = keyof typeof riskTokens;

export function riskMapColor(risk: Risk, dark = false) {
  return dark ? riskTokens[risk].mapDark : riskTokens[risk].map;
}
