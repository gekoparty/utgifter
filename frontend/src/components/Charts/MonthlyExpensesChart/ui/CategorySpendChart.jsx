import React, { useMemo } from "react";
import { Box, Stack, Typography, useTheme } from "@mui/material";
import SegmentedControl from "../../../commons/Controls/SegmentedControl";
import useEChart from "../../hooks/useEChart";

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
  "#f97316",
  "#94a3b8",
];

const monthLabel = (year, month) => {
  const numericYear = Number(year);
  const numericMonth = Number(month);
  if (!numericYear || !numericMonth) return "Siste måned";

  return new Date(numericYear, numericMonth - 1, 1).toLocaleDateString("nb-NO", {
    month: "short",
    year: "numeric",
  });
};

const scopeLabel = (scope, year, month) => {
  if (scope === "all") return "Totalt";
  if (scope === "month") return monthLabel(year, month);
  return year ? `År ${year}` : "År";
};

const compactCategories = (categories) => {
  const rows = Array.isArray(categories)
    ? categories
        .map((row) => ({
          name: row?.name || "Ikke kategorisert",
          value: Number(row?.value || 0),
          count: Number(row?.count || 0),
        }))
        .filter((row) => row.value > 0)
    : [];

  if (rows.length <= 7) return rows;

  const visible = rows.slice(0, 6);
  const other = rows.slice(6).reduce(
    (acc, row) => ({
      name: "Annet",
      value: acc.value + row.value,
      count: acc.count + row.count,
    }),
    { name: "Annet", value: 0, count: 0 },
  );

  return other.value > 0 ? [...visible, other] : visible;
};

export default function CategorySpendChart({
  categories,
  scope = "year",
  onScopeChange,
  year,
  month,
}) {
  const theme = useTheme();
  const rows = useMemo(() => compactCategories(categories), [categories]);
  const total = rows.reduce((sum, row) => sum + row.value, 0);

  const option = useMemo(
    () => ({
      color: CHART_COLORS,
      tooltip: {
        trigger: "item",
        valueFormatter: (value) => NOK.format(value),
      },
      legend: {
        type: "scroll",
        bottom: 0,
        left: 0,
        right: 0,
        textStyle: { color: theme.palette.text.secondary },
      },
      series: [
        {
          name: "Kategori",
          type: "pie",
          radius: ["50%", "76%"],
          center: ["50%", "44%"],
          avoidLabelOverlap: true,
          minAngle: 4,
          itemStyle: {
            borderRadius: 5,
            borderColor: theme.palette.background.paper,
            borderWidth: 2,
          },
          label: {
            color: theme.palette.text.primary,
            formatter: "{b}\n{d}%",
            fontWeight: 700,
          },
          labelLine: {
            lineStyle: { color: theme.palette.divider },
          },
          data: rows,
        },
      ],
    }),
    [rows, theme],
  );

  const { elementRef: chartRef } = useEChart({
    option,
    enabled: rows.length > 0,
  });

  return (
    <Box
      sx={{
        height: "100%",
        minHeight: { xs: 320, md: 390 },
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
        p: { xs: 1, md: 1.25 },
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "flex-start" }}
        spacing={1}
        sx={{ mb: 0.75 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
            Utgifter per kategori
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {scopeLabel(scope, year, month)} ·{" "}
            {rows.length ? `${rows.length} kategorier` : "Ingen kategorier"}
          </Typography>
        </Box>
        <Stack spacing={0.75} alignItems={{ xs: "stretch", sm: "flex-end" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 950, whiteSpace: "nowrap" }}>
            {NOK.format(total)}
          </Typography>
          <SegmentedControl
            value={scope}
            onChange={onScopeChange}
            options={[
              { value: "month", label: "Måned" },
              { value: "year", label: "År" },
              { value: "all", label: "Totalt" },
            ]}
            sx={{
              "& .MuiToggleButton-root": {
                px: 0.9,
                py: 0.25,
                textTransform: "none",
                fontWeight: 800,
                fontSize: 12,
              },
            }}
          />
        </Stack>
      </Stack>

      {rows.length ? (
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
