import React from "react";
import { Box, Stack, Chip } from "@mui/material";
import { currencyFormatter, pct } from "../utils/format";

export default function StatsStrip({ stats, doCompare }) {
  if (!stats) return null;

  return (
    <Box sx={{ mb: 2 }}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Chip label={`Årssum: ${currencyFormatter(stats.currentSum)}`} />
        {Number.isFinite(stats.avgPerActiveMonth) && (
          <Chip label={`Snitt/mnd: ${currencyFormatter(stats.avgPerActiveMonth)}`} variant="outlined" />
        )}
        {Number.isFinite(stats.medianPerMonth) && (
          <Chip label={`Median/mnd: ${currencyFormatter(stats.medianPerMonth)}`} variant="outlined" />
        )}

        {Number.isFinite(stats.momPct) && (
          <Chip
            label={`MoM (siste mnd): ${pct(stats.momPct)}`}
            color={stats.momPct > 0 ? "warning" : "success"}
          />
        )}

        {doCompare && Number.isFinite(stats.yoyTotalPct) && (
          <Chip
            label={`YoY (år): ${pct(stats.yoyTotalPct)}`}
            color={stats.yoyTotalPct > 0 ? "warning" : "success"}
          />
        )}

        {stats.maxMonth && (
          <Chip
            label={`Toppmnd: ${stats.maxMonth.month} (${currencyFormatter(stats.maxMonth.value)})`}
            color="primary"
            variant="outlined"
          />
        )}

        {stats.minMonth && (
          <Chip
            label={`Lavest: ${stats.minMonth.month} (${currencyFormatter(stats.minMonth.value)})`}
            variant="outlined"
          />
        )}

        {Number.isFinite(stats.volatilityPct) && (
          <Chip label={`Volatilitet: ${pct(stats.volatilityPct)}`} variant="outlined" />
        )}

        {Number.isFinite(stats.runRate) && (
          <Chip label={`Run-rate: ${currencyFormatter(stats.runRate)}`} variant="outlined" />
        )}

        {stats.bestQuarter && (
          <Chip label={`Beste kvartal: Q${stats.bestQuarter.q} (${currencyFormatter(stats.bestQuarter.total)})`} />
        )}

        {stats.worstQuarter && (
          <Chip
            label={`Svakeste kvartal: Q${stats.worstQuarter.q} (${currencyFormatter(stats.worstQuarter.total)})`}
            variant="outlined"
          />
        )}

        {Number.isFinite(stats.activeMonths) && (
          <Chip label={`Aktive mnd: ${stats.activeMonths}/12`} variant="outlined" />
        )}
      </Stack>
    </Box>
  );
}

