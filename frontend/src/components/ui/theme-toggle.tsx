"use client";

import IconButton from "@mui/material/IconButton";
import { useColorScheme } from "@mui/material/styles";
import { Icon } from "./icon";

export function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  const isDark = mode === "dark";
  const label = isDark ? "Activar tema claro" : "Activar tema oscuro";

  return (
    <IconButton
      aria-label={label}
      title={label}
      disabled={!mode}
      onClick={() => setMode(isDark ? "light" : "dark")}
    >
      <Icon name={isDark ? "sun" : "moon"} />
    </IconButton>
  );
}
