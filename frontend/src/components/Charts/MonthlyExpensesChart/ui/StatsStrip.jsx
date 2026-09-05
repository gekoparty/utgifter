import React from "react";
import { Box } from "@mui/material";
import KpiCard from "../../../commons/DataDisplay/KpiCard";
import { currencyFormatter, pct } from "../utils/format";

export default function StatsStrip({ stats, doCompare }) {
  if (!stats) return null;

  const metrics = [
    {
      label: "Årssum",
      value: currencyFormatter(stats.currentSum),
      subtext: "Dette er faktisk registrerte kjøp",
      tone: "primary",
    },
    Number.isFinite(stats.incomeSum)
      ? {
          label: "Inntekt",
          value: currencyFormatter(stats.incomeSum),
          subtext: "Dette er faktisk registrert inntekt",
          tone: "success",
        }
      : null,
    Number.isFinite(stats.expectedIncomeSum) && stats.expectedIncomeSum > 0
      ? {
          label: "Planlagt inntekt",
          value: currencyFormatter(stats.expectedIncomeSum),
          subtext: "Dette er forventet fremover",
        }
      : null,
    Number.isFinite(stats.netSum)
      ? {
          label: "Igjen",
          value: currencyFormatter(stats.netSum),
          tone: stats.netSum >= 0 ? "success" : "warning",
        }
      : null,
    Number.isFinite(stats.savingsRate)
      ? {
          label: "Sparerate",
          value: pct(stats.savingsRate),
          tone: stats.savingsRate >= 0 ? "success" : "warning",
        }
      : null,
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
      ? { label: "Årstakt", value: currencyFormatter(stats.runRate), subtext: "Estimert fra aktive måneder" }
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
          xl: "repeat(5, minmax(0, 1fr))",
        },
      }}
    >
      {metrics.map((metric) => (
        <KpiCard
          key={metric.label}
          label={metric.label}
          value={metric.value}
          subtext={metric.subtext}
          tone={metric.tone}
        />
      ))}
    </Box>
  );
}
