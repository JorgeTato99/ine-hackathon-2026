"use client";

import Box from "@mui/material/Box";

export function LocationGuide() {
  return (
    <Box
      component="svg"
      data-motion="location"
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 240 150"
      sx={{
        display: "block",
        width: "100%",
        maxWidth: 220,
        mx: "auto",
        color: "primary.main",
        overflow: "visible",
      }}
    >
      <g className="tc-location-plane">
        <path
          d="m27 78 72-23 114 41-72 27Z"
          fill="currentColor"
          fillOpacity=".04"
          stroke="currentColor"
          strokeOpacity=".16"
        />
        <path
          d="m27 65 72-23 114 41-72 27Z"
          fill="currentColor"
          fillOpacity=".08"
          stroke="currentColor"
          strokeOpacity=".35"
        />
        <path
          d="m62 54 113 42m-77-54 43 68m-79-9 77-44"
          stroke="currentColor"
          strokeOpacity=".18"
          fill="none"
        />
      </g>
      <ellipse
        className="tc-location-ring"
        cx="122"
        cy="78"
        rx="27"
        ry="10"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".4"
        strokeDasharray="3 4"
      />
      <g className="tc-location-pin">
        <path
          d="M122 26a17 17 0 0 0-17 17c0 14 17 33 17 33s17-19 17-33a17 17 0 0 0-17-17Z"
          fill="var(--mui-palette-background-paper, white)"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="122" cy="43" r="5" fill="currentColor" />
      </g>
    </Box>
  );
}
