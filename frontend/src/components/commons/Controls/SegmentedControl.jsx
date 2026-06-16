import React from "react";
import { ToggleButton, ToggleButtonGroup } from "@mui/material";

export default function SegmentedControl({
  value,
  onChange,
  options = [],
  size = "small",
  ariaLabel,
  fullWidth = false,
  buttonSx,
  sx,
}) {
  return (
    <ToggleButtonGroup
      exclusive
      size={size}
      value={value}
      onChange={(_, nextValue) => {
        if (nextValue != null) onChange?.(nextValue);
      }}
      aria-label={ariaLabel}
      sx={(theme) => ({
        width: fullWidth ? "100%" : undefined,
        "& .MuiToggleButton-root": {
          flex: fullWidth ? 1 : undefined,
          px: 1.25,
          py: 0.35,
          textTransform: "none",
          fontWeight: 800,
          ...(typeof buttonSx === "function" ? buttonSx(theme) : buttonSx),
        },
        ...(typeof sx === "function" ? sx(theme) : sx),
      })}
    >
      {options.map((option) => (
        <ToggleButton key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
