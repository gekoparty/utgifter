import React, { useMemo } from "react";
import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { formatCurrency, fmtPct, changeChipColor } from "../utils/format";

const sampleLabel = (confidence, purchases) => {
  if (confidence === "low") return `${purchases} kjøp · lite data`;
  if (confidence === "medium") return `${purchases} kjøp · begrenset data`;
  return `${purchases} kjøp`;
};

export default function YearlyIncreaseCard({ yearly, variantScope, variantBreakdown = [] }) {
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
  const showVariantBreakdown = variantScope?.isVariantComparison && variantBreakdown.length > 1;

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Prisøkning per år
            </Typography>
            {variantScope?.label ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                {variantScope.label}
              </Typography>
            ) : null}
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
          Samlet: {summary.total.firstYear}-{summary.total.latestYear} ·{" "}
          {formatCurrency(summary.total.firstAvg)} til {formatCurrency(summary.total.latestAvg)}
        </Typography>
        {variantScope?.detail ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
            {variantScope.detail}
          </Typography>
        ) : null}

        {showVariantBreakdown ? (
          <Stack spacing={0.75} sx={{ mt: 1.25 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={850}>
              Prisendring per variant
            </Typography>
            {variantBreakdown.slice(0, 4).map((row) => (
              <Box
                key={row.name}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) auto",
                  gap: 1,
                  alignItems: "center",
                  px: 1,
                  py: 0.75,
                  borderRadius: 1.5,
                  bgcolor: "action.selected",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={900} noWrap title={row.name}>
                    {row.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.firstYear}-{row.latestYear} · {formatCurrency(row.firstAvg)} til{" "}
                    {formatCurrency(row.latestAvg)}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={row.confidence === "low" ? "warning.main" : "text.secondary"}
                    sx={{ display: "block" }}
                  >
                    {sampleLabel(row.confidence, row.purchases)}
                  </Typography>
                </Box>
                <Chip
                  size="small"
                  color={changeChipColor(row.sinceStartPct)}
                  label={fmtPct(row.sinceStartPct)}
                  sx={{ fontWeight: 850, borderRadius: 2 }}
                />
              </Box>
            ))}
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}
