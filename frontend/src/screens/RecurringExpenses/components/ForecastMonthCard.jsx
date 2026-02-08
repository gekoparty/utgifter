import React, { memo, useMemo } from "react";
import { Card, CardContent, Chip, LinearProgress, Stack, Typography } from "@mui/material";
import { monthLabel } from "../utils/recurringFormatters";

function ForecastMonthCard({ month, tab, maxRef, onOpenMonth, formatCurrency }) {
  const mainVal = tab === 1 ? month.paidTotal : month.expectedMax;

  const pct = useMemo(() => {
    const safeMax = Math.max(maxRef || 1, 1);
    return Math.min(100, ((mainVal || 0) / safeMax) * 100);
  }, [mainVal, maxRef]);

  return (
    <Card
      onClick={() => onOpenMonth(month.key)}
      sx={{
        cursor: "pointer",
        boxShadow: "none",
        border: "1px solid rgba(255,255,255,0.08)",
        "&:hover": { boxShadow: "0 10px 18px rgba(0,0,0,0.25)" },
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography fontWeight={900} noWrap sx={{ minWidth: 0, flex: 1 }}>
            {monthLabel(month.date)}
          </Typography>
          <Chip
            size="small"
            label={`${month.itemsCount ?? month.items?.length ?? 0} stk`}
            sx={{ flexShrink: 0 }}
          />
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {tab === 1 ? "Betalt total" : "Forventet intervall"}
        </Typography>

        {tab === 1 ? (
          <Typography variant="h6" fontWeight={900} noWrap>
            {formatCurrency(month.paidTotal ?? 0)}
          </Typography>
        ) : (
          <Typography variant="h6" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
            {formatCurrency(month.expectedMin)} – {formatCurrency(month.expectedMax)}
          </Typography>
        )}

        <LinearProgress
          sx={{ mt: 1.5, height: 8, borderRadius: 999 }}
          variant="determinate"
          value={pct}
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          Trykk for detaljer
        </Typography>
      </CardContent>
    </Card>
  );
}

export default memo(ForecastMonthCard);