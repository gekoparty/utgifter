import React from "react";
import { Paper, Typography } from "@mui/material";

export default function FormSection({ title, children, sx }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.75, sm: 2.25 },
        borderRadius: { xs: 2, sm: 3 },
        bgcolor: "rgba(255,255,255,0.035)",
        backgroundImage:
          "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))",
        border: "1px solid",
        borderColor: "rgba(255,255,255,0.12)",
        boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
        ...sx,
      }}
    >
      {title ? (
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 900, color: "text.primary" }}>
          {title}
        </Typography>
      ) : null}
      {children}
    </Paper>
  );
}
