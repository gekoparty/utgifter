import React from "react";
import { Box, Paper, Stack, Typography } from "@mui/material";

const toneColor = (tone) => {
  if (tone === "success") return "success.main";
  if (tone === "error") return "error.main";
  if (tone === "warning") return "warning.main";
  return "inherit";
};

export default function KpiCard({
  label,
  value,
  subtext,
  icon,
  tone = "default",
  sx,
}) {
  const isPrimary = tone === "primary";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        minHeight: 78,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        bgcolor: isPrimary ? "primary.main" : "background.paper",
        color: isPrimary ? "primary.contrastText" : "text.primary",
        ...sx,
      }}
    >
      <Stack direction="row" justifyContent="space-between" spacing={1.5}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            sx={{
              color: isPrimary ? "inherit" : "text.secondary",
              opacity: isPrimary ? 0.86 : 1,
              lineHeight: 1.2,
            }}
          >
            {label}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 900,
              lineHeight: 1.15,
              color: isPrimary ? "inherit" : toneColor(tone),
              overflowWrap: "anywhere",
              mt: 0.25,
            }}
          >
            {value}
          </Typography>
          {subtext ? (
            <Typography
              variant="caption"
              color={isPrimary ? "inherit" : "text.secondary"}
              sx={{ display: "block", mt: 0.5, opacity: isPrimary ? 0.82 : 1 }}
              noWrap
            >
              {subtext}
            </Typography>
          ) : null}
        </Box>
        {icon ? (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: isPrimary ? "rgba(255,255,255,0.18)" : "primary.main",
              color: "primary.contrastText",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Stack>
    </Paper>
  );
}
