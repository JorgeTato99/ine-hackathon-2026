"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useActiveChapter } from "@/hooks/use-active-chapter";
import { colors, motionTokens, radii } from "@/theme/tokens";

export type Chapter = { id: string; label: string };
export function ChapterNav({ chapters }: { chapters: readonly Chapter[] }) {
  const activeId = useActiveChapter(chapters);
  return (
    <Box
      component="nav"
      aria-label="En esta página"
      sx={{ position: { lg: "sticky" }, top: 24, alignSelf: "start", mb: { xs: 4, lg: 0 } }}
    >
      <Typography variant="overline" sx={{ display: "block", mb: 1.5, color: "text.secondary" }}>
        En esta página
      </Typography>
      <Box
        component="ol"
        sx={{
          listStyle: "none",
          p: 0,
          m: 0,
          display: "flex",
          gap: { xs: 1, lg: 0 },
          flexDirection: { xs: "row", lg: "column" },
          flexWrap: "wrap",
        }}
      >
        {chapters.map((chapter, index) => (
          <Box component="li" key={chapter.id} sx={{ minWidth: 0 }}>
            <Box
              component="a"
              className="tc-chapter-link"
              href={`#${chapter.id}`}
              aria-current={activeId === chapter.id ? "location" : undefined}
              sx={(theme) => ({
                position: "relative",
                display: "flex",
                gap: 1,
                py: 1,
                px: 1.5,
                my: 0.5,
                minHeight: 40,
                alignItems: "center",
                borderRadius: radii.control,
                fontSize: 13,
                fontWeight: 500,
                lineHeight: 1.5,
                textDecoration: "none",
                color: "text.secondary",
                borderBottom: 1,
                borderColor: "divider",
                transition: `color ${motionTokens.duration.feedback}ms ${motionTokens.easing.standard}, background-color ${motionTokens.duration.feedback}ms ${motionTokens.easing.standard}`,
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: 8,
                  bottom: 8,
                  width: "3px",
                  borderRadius: radii.pill,
                  bgcolor: "primary.main",
                  opacity: 0,
                  transform: "scaleY(.3)",
                  transition: `transform ${motionTokens.duration.enter}ms ${motionTokens.easing.standard}, opacity ${motionTokens.duration.feedback}ms ${motionTokens.easing.standard}`,
                },
                '&[aria-current="location"]': {
                  color: "primary.main",
                  bgcolor: colors.light.accentSoft,
                  "&::before": { opacity: 1, transform: "scaleY(1)" },
                  ...theme.applyStyles("dark", { bgcolor: colors.dark.accentSoft }),
                },
                "&:hover": { color: "primary.main" },
              })}
            >
              <Box
                component="span"
                aria-hidden="true"
                sx={{ color: "primary.main", fontVariantNumeric: "tabular-nums" }}
              >
                {String(index + 1).padStart(2, "0")}
              </Box>
              {chapter.label}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
