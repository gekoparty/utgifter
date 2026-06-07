import React, { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import { Paper, Typography, useTheme, Box, CircularProgress } from "@mui/material";
import dayjs from "dayjs";

import { useExpensesByMonthSummary } from "./hooks/useExpensesByMonth";
import { buildOption } from "./echarts/buildOption";

import HeaderControls from "./ui/headerControls";
import StatsStrip from "./ui/StatsStrip";

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

  const onEvents = useMemo(() => {
    return {
      click: (event) => {
        if (event?.componentType !== "series") return;
        if (typeof event?.dataIndex !== "number") return;

        const mm = String(event.dataIndex + 1).padStart(2, "0");
        const yyyyMm = `${year}-${mm}`;

        if (typeof onMonthClick === "function") {
          onMonthClick(yyyyMm);
        }
      },
    };
  }, [onMonthClick, year]);

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
      >
        <ReactECharts
          option={option}
          onEvents={onEvents}
          style={{ height: "100%", width: "100%" }}
          notMerge
          lazyUpdate
        />
      </Box>
    </Paper>
  );
}
