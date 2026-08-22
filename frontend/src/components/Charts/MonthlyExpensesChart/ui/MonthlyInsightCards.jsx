import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import CalendarViewMonthRoundedIcon from "@mui/icons-material/CalendarViewMonthRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import SectionCard from "../../../commons/Layout/SectionCard";
import { currencyFormatter, pct } from "../utils/format";

const InsightLine = ({ label, value, tone = "default" }) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={900}
      color={
        tone === "success"
          ? "success.main"
          : tone === "warning"
            ? "warning.main"
            : "text.primary"
      }
      textAlign="right"
    >
      {value}
    </Typography>
  </Stack>
);

export default function MonthlyInsightCards({ stats, doCompare }) {
  if (!stats) return null;

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "1fr",
          md: "repeat(3, minmax(0, 1fr))",
        },
      }}
    >
      <SectionCard
        title="Trend"
        subtitle="Endring i siste aktive måneder"
        icon={<TrendingUpRoundedIcon fontSize="small" />}
      >
        <Stack spacing={1}>
          <InsightLine
            label="Siste måned"
            value={pct(stats.momPct)}
            tone={stats.momPct > 0 ? "warning" : "success"}
          />
          {doCompare ? (
            <InsightLine
              label="Mot fjoråret"
              value={pct(stats.yoyTotalPct)}
              tone={stats.yoyTotalPct > 0 ? "warning" : "success"}
            />
          ) : null}
          <InsightLine
            label="Variasjon"
            value={pct(stats.volatilityPct)}
          />
        </Stack>
      </SectionCard>

      <SectionCard
        title="Måneder"
        subtitle={`${stats.activeMonths ?? 0} måneder med registrerte kjøp`}
        icon={<CalendarViewMonthRoundedIcon fontSize="small" />}
      >
        <Stack spacing={1}>
          <InsightLine
            label="Høyeste"
            value={
              stats.maxMonth
                ? `${stats.maxMonth.month} · ${currencyFormatter(stats.maxMonth.value)}`
                : "-"
            }
          />
          <InsightLine
            label="Laveste"
            value={
              stats.minMonth
                ? `${stats.minMonth.month} · ${currencyFormatter(stats.minMonth.value)}`
                : "-"
            }
          />
          <InsightLine label="Årstakt" value={currencyFormatter(stats.runRate)} />
        </Stack>
      </SectionCard>

      <SectionCard
        title="Kvartaler"
        subtitle="Summering basert på valgt år"
        icon={<ShowChartRoundedIcon fontSize="small" />}
      >
        <Stack spacing={1}>
          <InsightLine
            label="Høyeste kvartal"
            value={
              stats.bestQuarter
                ? `Q${stats.bestQuarter.q} · ${currencyFormatter(stats.bestQuarter.total)}`
                : "-"
            }
          />
          <InsightLine
            label="Laveste kvartal"
            value={
              stats.worstQuarter
                ? `Q${stats.worstQuarter.q} · ${currencyFormatter(stats.worstQuarter.total)}`
                : "-"
            }
          />
          <Typography variant="caption" color="text.secondary">
            Nullmåneder kan gjøre kvartaler misvisende hvis året ikke er ferdig registrert.
          </Typography>
        </Stack>
      </SectionCard>
    </Box>
  );
}
