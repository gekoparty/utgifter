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
      sx={(theme) => ({
        p: 1.6,
        borderRadius: 2,
        minHeight: 84,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        borderColor: isPrimary
          ? "transparent"
          : theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.12)"
            : "rgba(15,23,42,0.10)",
        bgcolor: isPrimary ? "primary.main" : "background.paper",
        backgroundImage: isPrimary
          ? "none"
          : theme.palette.mode === "dark"
            ? "linear-gradient(180deg, rgba(255,255,255,0.036), rgba(255,255,255,0.010))"
            : "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,250,252,0.78))",
        color: isPrimary ? "primary.contrastText" : "text.primary",
        boxShadow: isPrimary
          ? theme.palette.mode === "dark"
            ? "0 10px 24px rgba(79,140,255,0.16)"
            : "0 10px 22px rgba(36,87,214,0.12)"
          : "none",
        ...sx,
      })}
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
              sx={{
                display: "block",
                mt: 0.5,
                opacity: isPrimary ? 0.82 : 1,
                lineHeight: 1.25,
              }}
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
              borderRadius: 1.5,
              display: "grid",
              placeItems: "center",
              bgcolor: isPrimary ? "rgba(255,255,255,0.18)" : "primary.main",
              backgroundImage: "none",
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
