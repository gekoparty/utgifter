import React from "react";
import { Typography } from "@mui/material";

export default function FieldLabel({ children, sx }) {
  return (
    <Typography
      variant="caption"
      sx={{
        display: "block",
        mb: 0.75,
        fontWeight: 800,
        color: "text.secondary",
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}
