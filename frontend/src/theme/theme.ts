"use client";

import { createTheme } from "@mui/material/styles";
import {
  colors,
  radii,
  typeScale,
  motionTokens,
  entrancePresets,
  motionCompositions,
} from "./tokens";

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "class" },
  spacing: 8,
  motion: { reducedMotion: "system" },
  transitions: {
    duration: {
      shortest: motionTokens.duration.feedback,
      shorter: 160,
      short: motionTokens.duration.enter,
      standard: motionTokens.duration.enter,
      complex: motionTokens.duration.emphasis,
      enteringScreen: motionTokens.duration.enter,
      leavingScreen: 160,
    },
    easing: { easeOut: motionTokens.easing.standard, easeIn: motionTokens.easing.exit },
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: colors.light.accent, contrastText: colors.light.surface },
        secondary: { main: colors.light.info },
        info: { main: colors.light.info, light: colors.light.infoSoft },
        warning: { main: colors.light.warning, light: colors.light.warningSoft },
        error: { main: colors.light.error, light: colors.light.errorSoft },
        success: { main: colors.light.success, light: colors.light.successSoft },
        background: { default: colors.light.canvas, paper: colors.light.surface },
        text: { primary: colors.light.ink, secondary: colors.light.muted },
        divider: colors.light.line,
      },
    },
    dark: {
      palette: {
        primary: { main: colors.dark.accent, contrastText: colors.dark.canvas },
        secondary: { main: colors.dark.info },
        info: { main: colors.dark.info, light: colors.dark.infoSoft },
        warning: { main: colors.dark.warning, light: colors.dark.warningSoft },
        error: { main: colors.dark.error, light: colors.dark.errorSoft },
        success: { main: colors.dark.success, light: colors.dark.successSoft },
        background: { default: colors.dark.canvas, paper: colors.dark.surface },
        text: { primary: colors.dark.ink, secondary: colors.dark.muted },
        divider: colors.dark.line,
      },
    },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: typeScale.family,
    h1: typeScale.title,
    h2: typeScale.section,
    h3: typeScale.subtitle,
    body1: typeScale.body,
    body2: typeScale.small,
    caption: typeScale.caption,
    button: { textTransform: "none", fontWeight: 500 },
    overline: typeScale.label,
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: radii.control,
          transitionDuration: `${motionTokens.duration.feedback}ms`,
        },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: "none", borderRadius: radii.panel } },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: ({ theme }) => ({
          borderColor: colors.light.control,
          ...theme.applyStyles("dark", { borderColor: colors.dark.control }),
        }),
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { fontVariantNumeric: "tabular-nums", paddingTop: 13, paddingBottom: 13 },
        head: { fontWeight: 700 },
      },
    },
    MuiAlert: { styleOverrides: { root: { borderRadius: radii.panel } } },
    MuiCssBaseline: {
      styleOverrides: {
        ":root": {
          "--tc-motion-feedback": `${motionTokens.duration.feedback}ms`,
          "--tc-motion-enter": `${motionTokens.duration.enter}ms`,
          "--tc-motion-emphasis": `${motionTokens.duration.emphasis}ms`,
          "--tc-motion-easing": motionTokens.easing.standard,
          "--tc-entrance-easing": motionTokens.easing.entrance,
          "--tc-motion-distance": `${motionTokens.distance.entrance}px`,
          "--tc-motion-subtle": `${motionTokens.distance.subtle}px`,
          "--tc-motion-stagger-step": `${motionTokens.stagger.step}ms`,
          "--tc-motion-stagger-max": `${motionTokens.stagger.max}ms`,
          "--tc-trace-delay": `${motionCompositions.trace.delay}ms`,
          "--tc-trace-step": `${motionCompositions.trace.step}ms`,
          "--tc-trace-duration": `${motionCompositions.trace.duration}ms`,
          "--tc-trace-marker-duration": `${motionCompositions.trace.markerDuration}ms`,
          "--tc-trace-link-duration": `${motionCompositions.trace.linkDuration}ms`,
          "--tc-trace-link-offset": `${motionCompositions.trace.linkOffset}ms`,
          "--tc-trace-detail-offset": `${motionCompositions.trace.detailOffset}ms`,
          "--tc-trace-distance": `${motionCompositions.trace.distance}px`,
          "--tc-trace-marker-scale": motionCompositions.trace.markerScale,
          "--tc-archive-delay": `${motionCompositions.archive.delay}ms`,
          "--tc-archive-step": `${motionCompositions.archive.step}ms`,
          "--tc-archive-duration": `${motionCompositions.archive.duration}ms`,
          "--tc-archive-gap": `${motionCompositions.archive.gap}px`,
          "--tc-archive-distance": `${motionCompositions.archive.distance}px`,
          "--tc-archive-start-scale": motionCompositions.archive.startScale,
          "--tc-card-start-scale": motionCompositions.card.startScale,
          "--tc-location-duration": `${motionCompositions.location.duration}ms`,
          "--tc-location-delay": `${motionCompositions.location.delay}ms`,
          "--tc-location-ring-delay": `${motionCompositions.location.ringDelay}ms`,
          "--tc-location-distance": `${motionCompositions.location.distance}px`,
          "--tc-location-plane-scale": motionCompositions.location.planeScale,
          ...Object.fromEntries(
            Object.entries(entrancePresets).flatMap(([name, preset]) => [
              [`--tc-entrance-${name}-duration`, `${preset.duration}ms`],
              [`--tc-entrance-${name}-distance`, `${preset.distance}px`],
            ])
          ),
        },
        "button:focus-visible, a:focus-visible, input:focus-visible, select:focus-visible, [tabindex]:focus-visible":
          { outline: "3px solid var(--mui-palette-primary-main)", outlineOffset: 3 },
        "::selection": {
          background: "var(--mui-palette-primary-main)",
          color: "var(--mui-palette-primary-contrastText)",
        },
      },
    },
  },
});
