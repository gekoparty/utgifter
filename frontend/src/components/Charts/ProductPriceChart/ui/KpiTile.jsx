import React from "react";
import { Paper, Typography } from "@mui/material";

export default function KpiTile({ label, value, color = "default" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        gap: 0.25,
        minHeight: 62,
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 800,
          lineHeight: 1.15,
          ...(color === "success" && { color: "success.main" }),
          ...(color === "error" && { color: "error.main" }),
          ...(color === "warning" && { color: "warning.main" }),
          ...(color === "primary" && { color: "primary.main" }),
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
