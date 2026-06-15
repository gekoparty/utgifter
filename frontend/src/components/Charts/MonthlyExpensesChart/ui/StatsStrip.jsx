import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { currencyFormatter, pct } from "../utils/format";

export default function StatsStrip({ stats, doCompare }) {
  if (!stats) return null;

  const metrics = [
    { label: "Årssum", value: currencyFormatter(stats.currentSum), tone: "primary" },
    Number.isFinite(stats.avgPerActiveMonth)
      ? { label: "Snitt per måned", value: currencyFormatter(stats.avgPerActiveMonth) }
      : null,
    Number.isFinite(stats.medianPerMonth)
      ? { label: "Median per måned", value: currencyFormatter(stats.medianPerMonth) }
      : null,
    Number.isFinite(stats.momPct)
      ? {
          label: "Siste måned",
          value: pct(stats.momPct),
          tone: stats.momPct > 0 ? "warning" : "success",
        }
      : null,
    doCompare && Number.isFinite(stats.yoyTotalPct)
      ? {
          label: "Mot fjoråret",
          value: pct(stats.yoyTotalPct),
          tone: stats.yoyTotalPct > 0 ? "warning" : "success",
        }
      : null,
    stats.maxMonth
      ? {
          label: "Høyeste måned",
          value: `${stats.maxMonth.month} · ${currencyFormatter(stats.maxMonth.value)}`,
        }
      : null,
    stats.minMonth
      ? {
          label: "Laveste måned",
          value: `${stats.minMonth.month} · ${currencyFormatter(stats.minMonth.value)}`,
        }
      : null,
    Number.isFinite(stats.runRate)
      ? { label: "Årstakt", value: currencyFormatter(stats.runRate) }
      : null,
  ].filter(Boolean);

  return (
    <Box
      sx={{
        mb: 2.5,
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
      }}
    >
      {metrics.map((metric) => (
        <Paper
          key={metric.label}
          variant="outlined"
          sx={{
            p: 1.5,
            borderRadius: 2,
            minHeight: 78,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            bgcolor: metric.tone === "primary" ? "primary.main" : "background.paper",
            color: metric.tone === "primary" ? "primary.contrastText" : "text.primary",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: metric.tone === "primary" ? "inherit" : "text.secondary",
              opacity: metric.tone === "primary" ? 0.85 : 1,
              lineHeight: 1.2,
            }}
          >
            {metric.label}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 900,
              lineHeight: 1.15,
              color:
                metric.tone === "success"
                  ? "success.main"
                  : metric.tone === "warning"
                    ? "warning.main"
                    : "inherit",
              overflowWrap: "anywhere",
            }}
          >
            {metric.value}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
