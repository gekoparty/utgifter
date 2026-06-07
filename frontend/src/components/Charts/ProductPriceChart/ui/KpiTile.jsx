import React from "react";
import { Paper, Typography } from "@mui/material";

export default function KpiTile({ label, value, color = "default" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 0.35,
        minHeight: 76,
        bgcolor: color === "primary" ? "primary.main" : "background.paper",
        color: color === "primary" ? "primary.contrastText" : "text.primary",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: color === "primary" ? "inherit" : "text.secondary",
          opacity: color === "primary" ? 0.86 : 1,
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 800,
          lineHeight: 1.15,
          overflowWrap: "anywhere",
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
