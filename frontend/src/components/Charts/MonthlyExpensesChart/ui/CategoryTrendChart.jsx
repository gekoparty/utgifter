import React, { useEffect, useMemo, useRef } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import {
  echarts,
  isChartDisposed,
  safeDisposeChart,
  safeResizeChart,
  safeSetChartOption,
} from "../../echartsCore";

const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 0,
});

const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const compactNOK = (value) =>
  new Intl.NumberFormat("nb-NO", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(value ?? 0);

const prepareSeries = (rows = []) => {
  const totalsByCategory = new Map();

  rows.forEach((row) => {
    const name = row?.name || "Ikke kategorisert";
    totalsByCategory.set(
      name,
      (totalsByCategory.get(name) || 0) + Number(row?.value || 0),
    );
  });

  const topNames = [...totalsByCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name]) => name);

  const hasOther = [...totalsByCategory.keys()].some(
    (name) => !topNames.includes(name),
  );
  const names = hasOther ? [...topNames, "Annet"] : topNames;

  const valuesByName = Object.fromEntries(
    names.map((name) => [name, Array.from({ length: 12 }, () => 0)]),
  );

  rows.forEach((row) => {
    const rawName = row?.name || "Ikke kategorisert";
    const name = topNames.includes(rawName) ? rawName : "Annet";
    const monthIndex = Number(row?.month || 0) - 1;
    if (!valuesByName[name] || monthIndex < 0 || monthIndex > 11) return;
    valuesByName[name][monthIndex] += Number(row?.value || 0);
  });

  return names.map((name, index) => ({
    name,
    type: "bar",
    stack: "categories",
    barMaxWidth: 28,
    itemStyle: {
      color: CHART_COLORS[index % CHART_COLORS.length],
      borderRadius: index === names.length - 1 ? [5, 5, 0, 0] : 0,
    },
    emphasis: { focus: "series" },
    data: valuesByName[name],
  }));
};

export default function CategoryTrendChart({ rows = [], year }) {
  const theme = useTheme();
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const series = useMemo(() => prepareSeries(rows), [rows]);
  const hasData = series.some((serie) =>
    serie.data.some((value) => Number(value || 0) > 0),
  );

  const option = useMemo(
    () => ({
      backgroundColor: "transparent",
      animation: false,
      color: CHART_COLORS,
      grid: { left: 64, right: 16, top: 42, bottom: 34 },
      legend: {
        type: "scroll",
        top: 0,
        left: 0,
        right: 0,
        textStyle: { color: theme.palette.text.secondary },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "shadow" },
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        textStyle: { color: theme.palette.text.primary },
        valueFormatter: (value) => NOK.format(value),
      },
      xAxis: {
        type: "category",
        data: MONTH_LABELS,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: theme.palette.divider } },
        axisLabel: { color: theme.palette.text.secondary },
      },
      yAxis: {
        type: "value",
        axisLabel: {
          color: theme.palette.text.secondary,
          formatter: (value) => compactNOK(value),
        },
        splitLine: { lineStyle: { color: theme.palette.divider, type: "dashed" } },
      },
      series,
    }),
    [series, theme],
  );

  useEffect(() => {
    const element = chartRef.current;
    if (!element || !hasData) return undefined;

    const chart = echarts.getInstanceByDom(element) ?? echarts.init(element);
    chartInstanceRef.current = chart;

    return () => {
      chartInstanceRef.current = null;
      safeDisposeChart(chart);
    };
  }, [hasData]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (isChartDisposed(chart)) return;
    safeSetChartOption(chart, option, { notMerge: true, lazyUpdate: true });
    requestAnimationFrame(() => {
      safeResizeChart(chart);
    });
  }, [option]);

  useEffect(() => {
    const element = chartRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver(() => {
      const chart = chartInstanceRef.current;
      safeResizeChart(chart);
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Box
      sx={{
        minHeight: 330,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
        p: { xs: 1.25, md: 1.5 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ mb: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
          Kategorier gjennom året
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Topplisten per måned i {year}
        </Typography>
      </Box>

      {hasData ? (
        <Box ref={chartRef} sx={{ flex: 1, minHeight: 260 }} />
      ) : (
        <Box sx={{ flex: 1, display: "grid", placeItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            Ingen data å vise
          </Typography>
        </Box>
      )}
    </Box>
  );
}
