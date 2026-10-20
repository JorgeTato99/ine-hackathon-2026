"use client";

import Box, { type BoxProps } from "@mui/material/Box";
import { useEntranceScope } from "@/hooks/use-entrance-scope";

export function EntranceScope({ children, sx }: Pick<BoxProps, "children" | "sx">) {
  const root = useEntranceScope();
  return (
    <Box ref={root} sx={sx}>
      {children}
    </Box>
  );
}
