import React from "react";
import { Paper, Stack } from "@mui/material";

export default function PageToolbar({
  children,
  actions,
  align = "center",
  justify = "space-between",
  spacing = 1,
  sx,
  contentSx,
}) {
  if (!children && !actions) return null;

  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        p: 0.75,
        borderRadius: 2,
        boxShadow: "none",
        bgcolor: "background.paper",
        borderColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.12)"
            : "rgba(15,23,42,0.10)",
        ...sx,
      })}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={spacing}
        alignItems={{ xs: "stretch", md: align }}
        justifyContent={justify}
        sx={contentSx}
      >
        {children}
        {actions}
      </Stack>
    </Paper>
  );
}
