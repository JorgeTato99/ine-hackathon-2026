"use client";

import { useRef, useState, type ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { Icon } from "@/components/ui/icon";
import { explorerLayout } from "@/theme/tokens";

/** Minimizar conserva siempre el título y el acceso para recuperar el contenido. */
export function MapPanelHeader({
  title,
  subtitle,
  name,
  expanded,
  onToggle,
  contentId,
  titleId,
  heading = "h2",
  dense = false,
  leading,
  trailing,
}: {
  title: string;
  subtitle?: string;
  name: string;
  expanded: boolean;
  onToggle: () => void;
  contentId: string;
  titleId?: string;
  heading?: "h1" | "h2";
  dense?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}) {
  const [hintOpen, setHintOpen] = useState(false);
  const hintSuppressed = useRef(false);
  const action = `${expanded ? "Minimizar" : "Ampliar"} ${name}`;
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: dense ? 0 : 0.5,
        px: dense ? 0.25 : 1,
        py: 0.5,
        flexShrink: 0,
        minHeight: dense ? explorerLayout.compactPanelHeader : explorerLayout.panelHeader,
        borderBottom: expanded ? 1 : 0,
        borderColor: "divider",
        bgcolor: "action.hover",
      }}
    >
      {leading}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          id={titleId}
          component={heading}
          sx={{
            fontSize: dense ? 11 : 14,
            fontWeight: 700,
            lineHeight: 1.3,
            letterSpacing: ".01em",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", fontSize: 11, lineHeight: 1.25 }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
      {trailing}
      <Tooltip
        title={action}
        open={hintOpen}
        onOpen={() => {
          if (!hintSuppressed.current) setHintOpen(true);
        }}
        onClose={() => setHintOpen(false)}
        disableInteractive={!hintOpen}
      >
        <IconButton
          size="small"
          aria-label={action}
          aria-expanded={expanded}
          aria-controls={contentId}
          onClick={() => {
            // El panel puede ocupar el lugar del tooltip al reducirse; no debe bloquear el próximo clic.
            hintSuppressed.current = true;
            setHintOpen(false);
            onToggle();
          }}
          onMouseLeave={() => {
            hintSuppressed.current = false;
          }}
          onBlur={() => {
            hintSuppressed.current = false;
            setHintOpen(false);
          }}
          sx={{ width: dense ? 28 : 32, height: dense ? 28 : 32 }}
        >
          <Icon name={expanded ? "minus" : "plus"} size={dense ? 14 : 18} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
