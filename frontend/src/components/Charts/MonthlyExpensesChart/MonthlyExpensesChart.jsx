import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Paper, Typography, useTheme, Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";

import { useExpensesByMonthSummary } from "./hooks/useExpensesByMonth";
import { buildOption } from "./echarts/buildOption";

import HeaderControls from "./ui/headerControls"
import StatsStrip from "./ui/StatsStrip";

/**
 * Optional: pass onMonthClick={(yyyyMm) => ...}
 * Example: onMonthClick("2025-03")
 */
export default function MonthlyExpensesChart({ onMonthClick }) {
  const theme = useTheme();

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

  // ✅ Drilldown click handler
  const onEvents = useMemo(() => {
    return {
      click: (e) => {
        // Only react to bar clicks
        if (e?.componentType !== "series") return;
        if (typeof e?.dataIndex !== "number") return;

        const monthIndex = e.dataIndex; // 0..11
        const mm = String(monthIndex + 1).padStart(2, "0");
        const yyyyMm = `${year}-${mm}`;

        // default action: log
        console.log("MonthlyExpensesChart drilldown:", yyyyMm);

        // optional callback
        if (typeof onMonthClick === "function") {
          onMonthClick(yyyyMm);
        }
      },
    };
  }, [onMonthClick, year]);

  if (isLoading) {
    return (
      <Box p={3} sx={{ textAlign: "center" }}>
        <CircularProgress />
        <Typography>Laster data for sammenligning...</Typography>
      </Box>
    );
  }

  if (error) return <Typography color="error" p={3}>Error loading stats</Typography>;

  if (!years.length) {
    return (
      <Box p={3}>
        <Typography color="text.secondary">No data available.</Typography>
      </Box>
    );
  }

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 4,
        borderRadius: 2,
        background: `linear-gradient(to bottom right, ${theme.palette.background.paper}, ${theme.palette.background.default})`,
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

      <Box sx={{ height: 350 }}>
        <ReactECharts
          option={option}
          onEvents={onEvents}   // ✅ attach here
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
        />
      </Box>
    </Paper>
  );
}
