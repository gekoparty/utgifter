import React, { useMemo } from "react";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { formatCurrency, fmtPct, changeChipColor } from "../utils/format";

export default function YearlyIncreaseCard({ yearly }) {
  const summary = useMemo(() => {
    const overall = yearly?.overall ?? [];
    const first = overall[0] ?? null;
    const latest = overall[overall.length - 1] ?? null;

    const total =
      first && latest && Number.isFinite(latest.sinceStartPct)
        ? {
            name: "Totalt",
            firstYear: first.year,
            latestYear: latest.year,
            firstAvg: first.avgPricePerUnit,
            latestAvg: latest.avgPricePerUnit,
            purchases: latest.purchases ?? 0,
            yoyPct: latest.yoyPct,
            sinceStartPct: latest.sinceStartPct,
          }
        : null;

    return { total };
  }, [yearly]);

  if (!summary.total) return null;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Prisøkning per år
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 900, lineHeight: 1.05 }}>
              {fmtPct(summary.total.sinceStartPct)}
            </Typography>
          </Box>
          <Chip
            size="small"
            color={changeChipColor(summary.total.yoyPct)}
            label={`Siste år ${fmtPct(summary.total.yoyPct)}`}
            sx={{ alignSelf: "flex-start", fontWeight: 800, borderRadius: 2 }}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          {summary.total.firstYear}-{summary.total.latestYear} ·{" "}
          {formatCurrency(summary.total.firstAvg)} til {formatCurrency(summary.total.latestAvg)}
        </Typography>
      </CardContent>
    </Card>
  );
}
