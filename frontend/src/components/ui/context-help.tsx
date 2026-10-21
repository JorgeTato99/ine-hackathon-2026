"use client";

import { useId, useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { Icon } from "./icon";
import { helpTopics, type HelpTopic } from "@/content/reading-guide";

/** Vista breve al apuntar o enfocar; explicación completa con clic, Enter o tacto. */
export function ContextHelp({ topic }: { topic: HelpTopic }) {
  const id = useId();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [preview, setPreview] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const help = helpTopics[topic];
  const close = () => {
    setPreview(false);
    setDismissed(true);
    setAnchor(null);
  };
  return (
    <>
      <Tooltip
        title={help.summary}
        describeChild
        arrow
        open={preview && !anchor}
        onOpen={() => {
          if (!dismissed) setPreview(true);
        }}
        onClose={() => setPreview(false)}
        disableTouchListener
      >
        <IconButton
          size="small"
          aria-label={`Ayuda sobre ${help.label}`}
          aria-haspopup="dialog"
          aria-expanded={Boolean(anchor)}
          aria-controls={anchor ? id : undefined}
          onBlur={() => setDismissed(false)}
          onMouseLeave={() => {
            if (!anchor) setDismissed(false);
          }}
          onClick={(event) => {
            setPreview(false);
            setAnchor(event.currentTarget);
          }}
          sx={{ width: 32, height: 32, color: "primary.main", verticalAlign: "middle" }}
        >
          <Icon name="help" size={18} />
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
        slotProps={{
          paper: {
            id,
            role: "dialog",
            "aria-modal": true,
            "aria-labelledby": `${id}-title`,
            "aria-describedby": `${id}-detail`,
            sx: { width: 360, maxWidth: "calc(100vw - 32px)", p: 2, borderRadius: 2 },
          },
        }}
      >
        <Typography
          id={`${id}-title`}
          component="h3"
          variant="subtitle2"
          sx={{ mb: 1, textTransform: "none" }}
        >
          {help.label.charAt(0).toUpperCase() + help.label.slice(1)}
        </Typography>
        <Typography id={`${id}-detail`} variant="body2">
          {help.detail}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1.5 }}>
          <Button autoFocus onClick={close}>
            Cerrar ayuda
          </Button>
        </Box>
      </Popover>
    </>
  );
}
