import React from "react";
import { Paper, Typography } from "@mui/material";

export default function KpiTile({ label, value, color = "default" }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 0,
        border: 0,
        boxShadow: "none",
        backgroundImage: "none",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 0.35,
        minHeight: 62,
        bgcolor: "transparent",
        color: "text.primary",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          opacity: color === "primary" ? 0.86 : 1,
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>

      <Typography
        variant="h6"
        sx={{
          fontWeight: 800,
          lineHeight: 1.15,
          overflowWrap: "anywhere",
          ...(color === "success" && { color: "success.main" }),
          ...(color === "error" && { color: "error.main" }),
          ...(color === "warning" && { color: "warning.main" }),
          ...(color === "primary" && { color: "inherit" }),
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
