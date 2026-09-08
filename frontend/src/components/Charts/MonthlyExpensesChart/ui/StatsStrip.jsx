import React from "react";
import { Box } from "@mui/material";
import KpiCard from "../../../commons/DataDisplay/KpiCard";
import { currencyFormatter, pct } from "../utils/format";
import { useTranslation } from "../../../../i18n/useTranslation";

export default function StatsStrip({ stats, doCompare }) {
  const { t } = useTranslation();
  if (!stats) return null;

  const activeMonths = stats.activeMonths ?? 0;
  const monthWord = activeMonths === 1 ? t("statsActiveMonthSingular") : t("statsActiveMonthPlural");
  const currentSumLabel = doCompare ? "Årssum hittil" : "Årssum";

  const metrics = [
    {
      label: currentSumLabel,
      value: currencyFormatter(stats.currentSum),
      subtext: `${t("statsActualPurchases")} i ${activeMonths} aktive ${monthWord}`,
      tone: "primary",
    },
    Number.isFinite(stats.incomeSum)
      ? {
          label: "Inntekt",
          value: currencyFormatter(stats.incomeSum),
          subtext: t("statsActualIncome"),
          tone: "success",
        }
      : null,
    Number.isFinite(stats.expectedIncomeSum) && stats.expectedIncomeSum > 0
      ? {
          label: "Planlagt inntekt",
          value: currencyFormatter(stats.expectedIncomeSum),
          subtext: t("statsPlannedIncome"),
        }
      : null,
    Number.isFinite(stats.netSum)
      ? {
          label: "Igjen",
          value: currencyFormatter(stats.netSum),
          subtext: t("statsRemaining"),
          tone: stats.netSum >= 0 ? "success" : "warning",
        }
      : null,
    Number.isFinite(stats.savingsRate)
      ? {
          label: "Sparerate",
          value: pct(stats.savingsRate),
          subtext: t("statsSavingsRate"),
          tone: stats.savingsRate >= 0 ? "success" : "warning",
        }
      : null,
    Number.isFinite(stats.avgPerActiveMonth)
      ? {
          label: "Snitt per måned",
          value: currencyFormatter(stats.avgPerActiveMonth),
          subtext: t("statsAverage"),
        }
      : null,
    Number.isFinite(stats.medianPerMonth)
      ? {
          label: "Typisk måned",
          value: currencyFormatter(stats.medianPerMonth),
          subtext: t("statsTypical"),
        }
      : null,
    Number.isFinite(stats.momPct)
      ? {
          label: "Siste aktive måned",
          value: pct(stats.momPct),
          subtext: stats.momPct > 0 ? t("statsMoreThanBefore") : t("statsLessThanBefore"),
          tone: stats.momPct > 0 ? "warning" : "success",
        }
      : null,
    doCompare && Number.isFinite(stats.yoyTotalPct)
      ? {
          label: "Mot fjoråret",
          value: pct(stats.yoyTotalPct),
          subtext: stats.yoyTotalPct > 0 ? t("statsHigherThanLastYear") : t("statsLowerThanLastYear"),
          tone: stats.yoyTotalPct > 0 ? "warning" : "success",
        }
      : null,
    stats.maxMonth
      ? {
          label: "Høyeste måned",
          value: `${stats.maxMonth.month} · ${currencyFormatter(stats.maxMonth.value)}`,
          subtext: t("statsHighestMonth"),
        }
      : null,
    stats.minMonth
      ? {
          label: "Laveste måned",
          value: `${stats.minMonth.month} · ${currencyFormatter(stats.minMonth.value)}`,
          subtext: t("statsLowestMonth"),
        }
      : null,
    Number.isFinite(stats.runRate)
      ? {
          label: "Årstakt",
          value: currencyFormatter(stats.runRate),
          subtext: t("statsRunRate"),
        }
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
          xl: "repeat(4, minmax(0, 1fr))",
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
