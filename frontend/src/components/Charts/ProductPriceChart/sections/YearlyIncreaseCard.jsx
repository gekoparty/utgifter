import React, { useMemo } from "react";
import { Box, Card, CardContent, Chip, Divider, Typography } from "@mui/material";
import { formatCurrency, fmtPct, changeChipColor } from "../utils/format";

const groupLatestRows = (rows, nameKey) => {
  const grouped = new Map();

  for (const row of rows ?? []) {
    const name = row?.[nameKey] || "Ukjent";
    if (!grouped.has(name)) grouped.set(name, []);
    grouped.get(name).push(row);
  }

  return [...grouped.entries()]
    .map(([name, groupRows]) => {
      const sorted = groupRows
        .slice()
        .sort((a, b) => Number(a.year) - Number(b.year));
      if (sorted.length < 2) return null;

      const first = sorted[0];
      const latest = sorted[sorted.length - 1];
      if (!Number.isFinite(latest?.sinceStartPct)) return null;

      return {
        name,
        firstYear: first.year,
        latestYear: latest.year,
        firstAvg: first.avgPricePerUnit,
        latestAvg: latest.avgPricePerUnit,
        purchases: latest.purchases ?? 0,
        yoyPct: latest.yoyPct,
        sinceStartPct: latest.sinceStartPct,
      };
    })
    .filter(Boolean)
    .sort((a, b) => b.sinceStartPct - a.sinceStartPct);
};

const ChangeRow = ({ label, item }) => {
  if (!item) return null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        gap: 1.5,
        alignItems: "center",
        py: 0.6,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={800} noWrap>
          {label || item.name}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.firstYear}-{item.latestYear} · {formatCurrency(item.firstAvg)} til{" "}
          {formatCurrency(item.latestAvg)}
        </Typography>
      </Box>
      <Chip
        size="small"
        color={changeChipColor(item.sinceStartPct)}
        label={fmtPct(item.sinceStartPct)}
        sx={{ fontWeight: 800, borderRadius: 2 }}
      />
    </Box>
  );
};

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

    const brands = groupLatestRows(yearly?.byBrand, "brandName");
    const variants = groupLatestRows(yearly?.byVariant, "variantName");

    return {
      total,
      topBrand: brands[0] ?? null,
      lowBrand: brands.length > 1 ? brands[brands.length - 1] : null,
      topVariant: variants[0] ?? null,
      lowVariant: variants.length > 1 ? variants[variants.length - 1] : null,
    };
  }, [yearly]);

  if (!summary.total) return null;

  return (
    <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
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

        <Divider sx={{ my: 1.25 }} />

        <ChangeRow label={`Merke: ${summary.topBrand?.name}`} item={summary.topBrand} />
        <ChangeRow label={`Variant: ${summary.topVariant?.name}`} item={summary.topVariant} />

        {(summary.lowBrand || summary.lowVariant) && <Divider sx={{ my: 1.25 }} />}

        <ChangeRow label={`Lavest merke: ${summary.lowBrand?.name}`} item={summary.lowBrand} />
        <ChangeRow label={`Lavest variant: ${summary.lowVariant?.name}`} item={summary.lowVariant} />
      </CardContent>
    </Card>
  );
}
