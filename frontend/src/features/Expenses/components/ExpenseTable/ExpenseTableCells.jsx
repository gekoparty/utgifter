import React from "react";
import { Box, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { NOK } from "../../utils/expenseFormatters";

export const PriceBadge = React.memo(function PriceBadge({
  value,
  tone = "neutral",
}) {
  return (
    <Box
      sx={(theme) => {
        const colors = {
          success: theme.palette.success.main,
          warning: theme.palette.warning.main,
          error: theme.palette.error.main,
          neutral: theme.palette.text.secondary,
        };
        const color = colors[tone] || colors.neutral;

        return {
          alignItems: "center",
          backgroundColor: alpha(
            color,
            theme.palette.mode === "dark" ? 0.16 : 0.08,
          ),
          border: "1px solid",
          borderColor: alpha(
            color,
            theme.palette.mode === "dark" ? 0.34 : 0.22,
          ),
          borderRadius: 999,
          color: tone === "neutral" ? theme.palette.text.primary : color,
          display: "inline-flex",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 800,
          gap: 0.75,
          lineHeight: 1,
          minWidth: 92,
          justifyContent: "flex-end",
          px: 1,
          py: 0.55,
          whiteSpace: "nowrap",
          "&::before": {
            content: '""',
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: color,
            flex: "0 0 auto",
          },
        };
      }}
    >
      {NOK.format(typeof value === "number" ? value : 0)}
    </Box>
  );
});

export const TextCell = React.memo(function TextCell({ primary, secondary }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="span"
        sx={{
          display: "block",
          fontSize: "0.86rem",
          fontWeight: 750,
          lineHeight: 1.25,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {primary || "N/A"}
      </Typography>
      {secondary ? (
        <Typography
          component="span"
          color="text.secondary"
          sx={{
            display: "block",
            fontSize: "0.74rem",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {secondary}
        </Typography>
      ) : null}
    </Box>
  );
});

export const MutedCell = React.memo(function MutedCell({ value }) {
  return (
    <Typography
      component="span"
      color="text.secondary"
      sx={{ fontSize: "0.84rem", fontWeight: 650 }}
    >
      {value || "N/A"}
    </Typography>
  );
});

export const DateCell = React.memo(function DateCell({ value }) {
  return (
    <Typography
      component="span"
      sx={{
        fontSize: "0.84rem",
        px: 0.5,
        py: 0.25,
        borderRadius: 1,
        bgcolor: "action.hover",
        fontVariantNumeric: "tabular-nums",
        fontWeight: 700,
      }}
    >
      {value}
    </Typography>
  );
});
