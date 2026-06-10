import React, { useEffect, useMemo, useRef, useState } from "react";
import { Paper, Typography, useTheme, Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";

import { echarts } from "../echartsCore";
import { useExpensesByMonthSummary } from "./hooks/useExpensesByMonth";
import { buildOption } from "./echarts/buildOption";

import HeaderControls from "./ui/headerControls";
import StatsStrip from "./ui/StatsStrip";

export default function MonthlyExpensesChart({ onMonthClick }) {
  const theme = useTheme();
  const chartInstanceRef = useRef(null);
  const chartBoxRef = useRef(null);

  const [comparePreviousYear, setComparePreviousYear] = useState(true);
  const [selectedYear, setSelectedYear] = useState(dayjs().year().toString());

  const { data, isLoading, error } = useExpensesByMonthSummary({
    year: selectedYear,
    compare: comparePreviousYear,
  });

  const years = data?.years ?? [];
  const year = data?.year ?? selectedYear;
  const compareYear = data?.compareYear ?? null;
  const months = data?.months ?? [];
  const stats = data?.stats ?? null;

  useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const canComparePrev = !!compareYear;
  const doCompare = comparePreviousYear && canComparePrev;

  const option = useMemo(() => {
    return buildOption({
      theme,
      months,
      doCompare,
      selectedYear: year,
      compareYear,
    });
  }, [theme, months, doCompare, year, compareYear]);

  useEffect(() => {
    const element = chartBoxRef.current;
    if (!element || isLoading || error || !years.length) return undefined;

    const chart = echarts.getInstanceByDom(element) ?? echarts.init(element);
    chartInstanceRef.current = chart;

    return () => {
      chartInstanceRef.current = null;
      if (!chart.isDisposed()) chart.dispose();
    };
  }, [error, isLoading, years.length]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) return;

    chart.setOption(option, { notMerge: true, lazyUpdate: true });

    requestAnimationFrame(() => {
      if (!chart.isDisposed()) chart.resize();
    });
  }, [option]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart || chart.isDisposed()) return undefined;

    const handleClick = (event) => {
      if (event?.componentType !== "series") return;
      if (typeof event?.dataIndex !== "number") return;

      const mm = String(event.dataIndex + 1).padStart(2, "0");
      const yyyyMm = `${year}-${mm}`;

      if (typeof onMonthClick === "function") {
        onMonthClick(yyyyMm);
      }
    };

    chart.on("click", handleClick);

    return () => {
      if (!chart.isDisposed()) chart.off("click", handleClick);
    };
  }, [onMonthClick, year]);

  useEffect(() => {
    const element = chartBoxRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      const chart = chartInstanceRef.current;
      if (!chart || chart.isDisposed?.()) return;
      chart.resize();
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
        previousYearKey={compareYear ?? String(Number(year) - 1)}
      />

      <StatsStrip stats={stats} doCompare={doCompare} />

      <Box
        ref={chartBoxRef}
        sx={{
          height: { xs: 320, md: 390 },
          minWidth: 0,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
          bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
          p: { xs: 0.5, md: 1 },
        }}
      />
    </Paper>
  );
}
