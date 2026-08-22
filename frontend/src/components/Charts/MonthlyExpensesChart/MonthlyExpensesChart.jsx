import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Typography, useTheme, Box } from "@mui/material";
import dayjs from "dayjs";

import { useAppPreferences } from "../../../store/Store";
import SectionCard from "../../commons/Layout/SectionCard";
import useEChart from "../hooks/useEChart";
import { useExpensesByMonthSummary } from "./hooks/useExpensesByMonth";
import { buildOption } from "./echarts/buildOption";

import HeaderControls from "./ui/headerControls";
import StatsStrip from "./ui/StatsStrip";
import CategorySpendChart from "./ui/CategorySpendChart";
import CategoryTrendChart from "./ui/CategoryTrendChart";
import SpendBreakdownPanel from "./ui/SpendBreakdownPanel";
import MonthlyInsightCards from "./ui/MonthlyInsightCards";
import StatsEmptyState from "./ui/StatsEmptyState";

export default function MonthlyExpensesChart({ onMonthClick }) {
  const theme = useTheme();
  const { preferences, setPreference } = useAppPreferences();

  const [comparePreviousYear, setComparePreviousYear] = useState(true);
  const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());
  const [categoryScope, setCategoryScope] = useState("year");
  const showExtraCharts = preferences.monthlyStatsExtraCharts === true;

  const setShowExtraCharts = useCallback(
    (value) => setPreference("monthlyStatsExtraCharts", Boolean(value)),
    [setPreference],
  );

  const { data, isLoading, error } = useExpensesByMonthSummary({
    year: selectedYear,
    compare: comparePreviousYear,
  });

  const years = data?.years ?? [];
  const year = data?.year ?? selectedYear;
  const compareYear = data?.compareYear ?? null;
  const months = data?.months ?? [];
  const categoryBreakdowns = data?.categoryBreakdowns ?? {};
  const categories = categoryBreakdowns?.[categoryScope] ?? data?.categories ?? [];
  const entityBreakdowns = data?.entityBreakdowns ?? { categories: categoryBreakdowns };
  const categoryMonthlyTrend = data?.categoryMonthlyTrend ?? [];
  const categoryMonth = data?.categoryMonth ?? null;
  const stats = data?.stats ?? null;
  const activeMonthCount = months.filter((month) => Number(month?.current || 0) > 0).length;

  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const previousYearKey = String(Number(year) - 1);
  const canComparePrev = years.includes(previousYearKey);
  const doCompare = comparePreviousYear && canComparePrev;
  const activeCompareYear = doCompare ? compareYear ?? previousYearKey : null;

  const option = useMemo(() => {
    return buildOption({
      theme,
      months,
      doCompare,
      selectedYear: year,
      compareYear: activeCompareYear,
    });
  }, [theme, months, doCompare, year, activeCompareYear]);

  const chartEvents = useMemo(
    () => ({
      click: (event) => {
        if (event?.componentType !== "series") return;
        if (typeof event?.dataIndex !== "number") return;

        const mm = String(event.dataIndex + 1).padStart(2, "0");
        const yyyyMm = `${year}-${mm}`;

        if (typeof onMonthClick === "function") {
          onMonthClick(yyyyMm);
        }
      },
    }),
    [onMonthClick, year],
  );

  const { elementRef: chartBoxRef } = useEChart({
    option,
    enabled: !isLoading && !error && years.length > 0,
    events: chartEvents,
  });

  if (isLoading) {
    return (
      <StatsEmptyState
        title="Laster statistikk"
        message="Henter månedsdata, kategorier og butikkfordeling fra serveren."
        loading
      />
    );
  }

  if (error) {
    return (
      <StatsEmptyState
        title="Kunne ikke laste statistikk"
        message="Serveren svarte ikke med statistikkdata. Prøv å oppdatere siden."
        error
      />
    );
  }

  if (!years.length) {
    return (
      <StatsEmptyState
        title="Ingen statistikk ennå"
        message="Når du registrerer utgifter, vises månedlige trender, kategorier og butikker her."
      />
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      <HeaderControls
        selectedYear={year}
        setSelectedYear={setSelectedYear}
        availableYears={years}
        comparePreviousYear={comparePreviousYear}
        setComparePreviousYear={setComparePreviousYear}
        canComparePrev={canComparePrev}
        doCompare={doCompare}
        previousYearKey={previousYearKey}
        showExtraCharts={showExtraCharts}
        setShowExtraCharts={setShowExtraCharts}
        hideTitle
      />

      <StatsStrip stats={stats} doCompare={doCompare} />

      {activeMonthCount < 3 ? (
        <SectionCard
          title="Lite datagrunnlag"
          subtitle="Statistikk blir tryggere når samme type kjøp finnes over flere måneder."
          contentSx={{ py: 1.25 }}
        >
          <Typography variant="body2" color="text.secondary">
            Akkurat nå har valgt år {activeMonthCount} måned(er) med registrerte utgifter. Diagrammene vises, men trender og årstakt bør leses forsiktig.
          </Typography>
        </SectionCard>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(0, 1.55fr) minmax(320px, 0.45fr)",
          },
          gap: 1.5,
          alignItems: "stretch",
        }}
      >
        <SectionCard
          title="Månedlig utvikling"
          subtitle={
            doCompare
              ? `${year} mot ${activeCompareYear}`
              : `Utgifter per måned i ${year}`
          }
          contentSx={{ height: "100%" }}
        >
          <Box
            ref={chartBoxRef}
            sx={{
              height: { xs: 320, md: 420 },
              minWidth: 0,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              overflow: "hidden",
              bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
              p: { xs: 0.5, md: 1 },
            }}
          />
        </SectionCard>

        <SpendBreakdownPanel
          breakdowns={entityBreakdowns}
          scope={categoryScope}
          onScopeChange={setCategoryScope}
          year={year}
          month={categoryMonth}
        />
      </Box>

      <MonthlyInsightCards stats={stats} doCompare={doCompare} />

      {showExtraCharts ? (
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(320px, 0.45fr) minmax(0, 1.55fr)",
            },
          }}
        >
          <CategorySpendChart
            categories={categories}
            scope={categoryScope}
            onScopeChange={setCategoryScope}
            year={year}
            month={categoryMonth}
          />
          <CategoryTrendChart rows={categoryMonthlyTrend} year={year} />
        </Box>
      ) : null}
    </Box>
  );
}
