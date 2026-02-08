import React, { memo, useMemo } from "react";
import { Box, Stack, Typography, Tooltip } from "@mui/material";
import { monthLabel } from "../utils/recurringFormatters";

/**
 * Range-bar chart for upcoming months.
 * - Expected mode: shows [expectedMin..expectedMax] as a bar
 * - Paid mode: shows a bar from 0..paidTotal
 * - Also supports showing a paid marker on expected mode if you want later
 *
 * Props:
 *  - forecast: array of months
 *  - tab: 0 = expected, 1 = paid (same as your current usage)
 *  - onOpenMonth: fn(key)
 *  - formatCurrency: fn(number) => formatted string
 */
function ForecastRangeChart({ forecast, tab, onOpenMonth, formatCurrency }) {
  const { maxX } = useMemo(() => {
    const vals = forecast.map((m) => (tab === 1 ? m.paidTotal ?? 0 : m.expectedMax ?? 0));
    const max = Math.max(...vals, 1);
    return { maxX: max };
  }, [forecast, tab]);

  // Layout constants
  const labelColW = 72; // month label column width
  const valueColW = 110; // right side value column width
  const rowH = 44;

  const toPct = (v) => {
    const safe = Math.max(maxX || 1, 1);
    return Math.max(0, Math.min(100, (Number(v || 0) / safe) * 100));
  };

  return (
    <Box sx={{ width: "100%" }}>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          {tab === 1 ? "Betalt per måned" : "Forventet intervall per måned"}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.85 }}>
          Skala: opptil {formatCurrency(maxX)}
        </Typography>
      </Stack>

      {/* Rows */}
      <Box sx={{ display: "grid", gap: 1 }}>
        {forecast.map((m) => {
          const isPaidTab = tab === 1;

          const min = Number(m.expectedMin ?? 0);
          const max = Number(m.expectedMax ?? 0);
          const paid = Number(m.paidTotal ?? 0);

          const leftPct = isPaidTab ? 0 : toPct(min);
          const rightPct = isPaidTab ? toPct(paid) : toPct(max);
          const widthPct = Math.max(0, rightPct - leftPct);

          const primaryValue = isPaidTab ? paid : max;
          const secondaryValue = isPaidTab ? null : min;

          const tooltip = isPaidTab
            ? `${monthLabel(m.date)} • Betalt: ${formatCurrency(paid)}`
            : `${monthLabel(m.date)} • ${formatCurrency(min)} – ${formatCurrency(max)}`;

          return (
            <Tooltip key={m.key} title={tooltip} placement="top" arrow>
              <Box
                onClick={() => onOpenMonth(m.key)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onOpenMonth(m.key);
                }}
                sx={{
                  display: "grid",
                  gridTemplateColumns: `${labelColW}px 1fr ${valueColW}px`,
                  alignItems: "center",
                  gap: 1.5,
                  height: rowH,
                  px: 1,
                  borderRadius: 2,
                  cursor: "pointer",
                  border: "1px solid rgba(255,255,255,0.07)",
                  bgcolor: "rgba(255,255,255,0.02)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
                  outline: "none",
                  "&:focus-visible": {
                    boxShadow: "0 0 0 3px rgba(255,255,255,0.18)",
                  },
                }}
              >
                {/* Month label */}
                <Typography fontWeight={900} noWrap sx={{ fontSize: 13 }}>
                  {monthLabel(m.date)}
                </Typography>

                {/* Bar area */}
                <Box
                  sx={{
                    position: "relative",
                    height: 10,
                    borderRadius: 999,
                    bgcolor: "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  {/* Range/Paid bar */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      top: 0,
                      bottom: 0,
                      borderRadius: 999,
                      bgcolor: "primary.main",
                      opacity: 0.85,
                    }}
                  />

                  {/* Marker for paid (optional in expected mode) */}
                  {!isPaidTab && paid > 0 && (
                    <Box
                      sx={{
                        position: "absolute",
                        left: `${toPct(paid)}%`,
                        top: "50%",
                        width: 10,
                        height: 10,
                        transform: "translate(-50%, -50%)",
                        borderRadius: "50%",
                        bgcolor: "success.main",
                        boxShadow: "0 0 0 2px rgba(0,0,0,0.35)",
                      }}
                    />
                  )}
                </Box>

                {/* Value column */}
                <Stack spacing={0} alignItems="flex-end" sx={{ minWidth: 0 }}>
                  <Typography fontWeight={950} noWrap>
                    {formatCurrency(primaryValue)}
                  </Typography>
                  {secondaryValue !== null && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ opacity: 0.85 }}>
                      fra {formatCurrency(secondaryValue)}
                    </Typography>
                  )}
                </Stack>
              </Box>
            </Tooltip>
          );
        })}
      </Box>
    </Box>
  );
}

export default memo(ForecastRangeChart);
