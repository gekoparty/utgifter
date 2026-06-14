import React, { memo, useMemo } from "react";
import { Box, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { ChevronRight } from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { monthLabel } from "../utils/recurringFormatters";

function ForecastMonthCard({ month, tab, maxRef, onOpenMonth, formatCurrency }) {
  const theme = useTheme();
  const isPaidView = tab === 1;
  const primaryValue = isPaidView ? Number(month.paidTotal ?? 0) : Number(month.expectedMax ?? 0);
  const secondaryValue = Number(month.expectedMin ?? 0);
  const itemsCount = month.itemsCount ?? month.items?.length ?? 0;

  const pct = useMemo(() => {
    const safeMax = Math.max(maxRef || 1, 1);
    return Math.min(100, (primaryValue / safeMax) * 100);
  }, [primaryValue, maxRef]);

  const handleOpen = () => onOpenMonth(month.key);

  return (
    <Box
      component="button"
      type="button"
      onClick={handleOpen}
      sx={{
        width: "100%",
        height: "100%",
        p: 1.75,
        textAlign: "left",
        color: "text.primary",
        font: "inherit",
        cursor: "pointer",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.74 : 1),
        backgroundImage:
          theme.palette.mode === "dark"
            ? "linear-gradient(135deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))"
            : "none",
        boxShadow: "none",
        transition: theme.transitions.create(["border-color", "background-color", "transform"], {
          duration: theme.transitions.duration.short,
        }),
        "&:hover": {
          borderColor: "primary.main",
          bgcolor: "action.hover",
          transform: "translateY(-1px)",
        },
        "&:focus-visible": {
          outline: "none",
          boxShadow: `0 0 0 3px ${alpha(theme.palette.primary.main, 0.35)}`,
        },
      }}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", fontWeight: 900, textTransform: "uppercase" }}
            >
              {isPaidView ? "Betalt" : "Forventet"}
            </Typography>
            <Typography fontWeight={950} sx={{ fontSize: 18, lineHeight: 1.25 }}>
              {monthLabel(month.date)}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={`${itemsCount} stk`}
            variant="outlined"
            sx={{ flexShrink: 0, fontWeight: 900 }}
          />
        </Stack>

        <Box>
          <Typography
            fontWeight={950}
            sx={{
              fontSize: { xs: 24, sm: 25 },
              lineHeight: 1.12,
              overflowWrap: "anywhere",
            }}
          >
            {formatCurrency(primaryValue)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
            {isPaidView
              ? `${itemsCount} faste kostnader denne måneden`
              : `Minimum ${formatCurrency(secondaryValue)}`}
          </Typography>
        </Box>

        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 6,
            borderRadius: 999,
            bgcolor: "action.selected",
            "& .MuiLinearProgress-bar": {
              borderRadius: 999,
            },
          }}
        />

        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Typography variant="caption" color="text.secondary">
            Åpne måned
          </Typography>
          <ChevronRight fontSize="small" color="primary" />
        </Stack>
      </Stack>
    </Box>
  );
}

export default memo(ForecastMonthCard);
