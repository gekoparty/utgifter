import React from "react";
import { Chip } from "@mui/material";

const colorByTone = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  neutral: "default",
};

export default function DecisionLabel({
  label,
  tone = "neutral",
  size = "small",
  sx,
}) {
  if (!label) return null;

  return (
    <Chip
      size={size}
      label={label}
      color={colorByTone[tone] || "default"}
      variant={tone === "neutral" ? "outlined" : "filled"}
      sx={{
        borderRadius: 1.5,
        fontWeight: 850,
        height: size === "small" ? 24 : undefined,
        maxWidth: "100%",
        "& .MuiChip-label": {
          overflow: "hidden",
          textOverflow: "ellipsis",
        },
        ...sx,
      }}
    />
  );
}
