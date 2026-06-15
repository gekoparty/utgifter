import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Paper, Typography, useTheme, Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";

import { useAppPreferences } from "../../../store/Store";
import {
  echarts,
  isChartDisposed,
  safeDisposeChart,
  safeOffChart,
  safeOnChart,
  safeResizeChart,
  safeSetChartOption,
} from "../echartsCore";
import { useExpensesByMonthSummary } from "./hooks/useExpensesByMonth";
import { buildOption } from "./echarts/buildOption";

import HeaderControls from "./ui/headerControls";
import StatsStrip from "./ui/StatsStrip";
import CategorySpendChart from "./ui/CategorySpendChart";
import CategoryTrendChart from "./ui/CategoryTrendChart";

export default function MonthlyExpensesChart({ onMonthClick }) {
  const theme = useTheme();
  const { preferences, setPreference } = useAppPreferences();
  const chartInstanceRef = useRef(null);
  const chartBoxRef = useRef(null);

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
  const categoryMonthlyTrend = data?.categoryMonthlyTrend ?? [];
  const categoryMonth = data?.categoryMonth ?? null;
  const stats = data?.stats ?? null;

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

  useEffect(() => {
    const element = chartBoxRef.current;
    if (!element || isLoading || error || !years.length) return undefined;

    const chart = echarts.getInstanceByDom(element) ?? echarts.init(element);
    chartInstanceRef.current = chart;

    return () => {
      chartInstanceRef.current = null;
      safeDisposeChart(chart);
    };
  }, [error, isLoading, years.length]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (isChartDisposed(chart)) return;

    safeSetChartOption(chart, option, { notMerge: true, lazyUpdate: true });

    requestAnimationFrame(() => {
      safeResizeChart(chart);
    });
  }, [option]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (isChartDisposed(chart)) return undefined;

    const handleClick = (event) => {
      if (event?.componentType !== "series") return;
      if (typeof event?.dataIndex !== "number") return;

      const mm = String(event.dataIndex + 1).padStart(2, "0");
      const yyyyMm = `${year}-${mm}`;

      if (typeof onMonthClick === "function") {
        onMonthClick(yyyyMm);
      }
    };

    safeOnChart(chart, "click", handleClick);

    return () => {
      safeOffChart(chart, "click", handleClick);
    };
  }, [onMonthClick, year]);

  useEffect(() => {
    const element = chartBoxRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      const chart = chartInstanceRef.current;
      safeResizeChart(chart);
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  if (isLoading) {
    return (
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 2, textAlign: "center" }}>
        <CircularProgress />
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          Laster statistikk...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography color="error">Kunne ikke laste statistikk.</Typography>
      </Paper>
    );
  }

  if (!years.length) {
    return (
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Typography color="text.secondary">Ingen data tilgjengelig.</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        bgcolor: "background.paper",
      }}
    >
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
      />

      <StatsStrip stats={stats} doCompare={doCompare} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: showExtraCharts
            ? {
                xs: "1fr",
                lg: "minmax(0, 1.45fr) minmax(300px, 0.55fr)",
              }
            : "1fr",
          gap: 1.5,
        }}
      >
        <Box
          ref={chartBoxRef}
          sx={{
            height: { xs: 320, md: showExtraCharts ? 390 : 430 },
            minWidth: 0,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
            p: { xs: 0.5, md: 1 },
          }}
        />

        {showExtraCharts ? (
          <CategorySpendChart
            categories={categories}
            scope={categoryScope}
            onScopeChange={setCategoryScope}
            year={year}
            month={categoryMonth}
          />
        ) : null}
      </Box>

      {showExtraCharts ? (
        <Box sx={{ mt: 1.5 }}>
          <CategoryTrendChart rows={categoryMonthlyTrend} year={year} />
        </Box>
      ) : null}
    </Paper>
  );
}
