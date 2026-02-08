import React, { memo, useMemo } from "react";
import { Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { monthLabel } from "../utils/recurringFormatters";

function ForecastMonthCard({ month, tab, maxRef, onOpenMonth, formatCurrency }) {
  const mainVal = tab === 1 ? month.paidTotal : month.expectedMax;

  const pct = useMemo(() => {
    const safeMax = Math.max(maxRef || 1, 1);
    return Math.min(100, ((Number(mainVal || 0)) / safeMax) * 100);
  }, [mainVal, maxRef]);

  const itemsCount = month.itemsCount ?? month.items?.length ?? 0;

  return (
    <Card
      onClick={() => onOpenMonth(month.key)}
      sx={{
        cursor: "pointer",
        boxShadow: "none",
        border: "1px solid rgba(255,255,255,0.08)",
        height: "100%",
        "&:hover": { boxShadow: "0 10px 18px rgba(0,0,0,0.25)" },
      }}
    >
      <CardContent>
        <Stack spacing={1.25}>
          {/* Header */}
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
            <Typography fontWeight={950} noWrap sx={{ minWidth: 0 }}>
              {monthLabel(month.date)}
            </Typography>

            <Chip
              size="small"
              label={`${itemsCount} stk`}
              sx={{
                flexShrink: 0,
                fontWeight: 800,
                opacity: 0.9,
                bgcolor: "rgba(255,255,255,0.08)",
              }}
            />
          </Stack>

          {/* Label */}
          <Typography
            variant="overline"
            color="text.secondary"
            sx={{ lineHeight: 1.1, letterSpacing: 0.6 }}
          >
            {tab === 1 ? "Betalt total" : "Forventet intervall"}
          </Typography>

          {/* Value */}
          {tab === 1 ? (
            <Typography variant="h5" fontWeight={950} noWrap sx={{ lineHeight: 1.1 }}>
              {formatCurrency(month.paidTotal ?? 0)}
            </Typography>
          ) : (
            <Stack spacing={0.25}>
              <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 1.1 }}>
                {formatCurrency(month.expectedMax ?? 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.1 }}>
                fra {formatCurrency(month.expectedMin ?? 0)}
              </Typography>
            </Stack>
          )}

          <LinearProgress
            sx={{ mt: 0.5, height: 8, borderRadius: 999, opacity: 0.9 }}
            variant="determinate"
            value={pct}
          />

          <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.75 }}>
            Trykk for detaljer
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default memo(ForecastMonthCard);
