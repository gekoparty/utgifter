import React, { useId, useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Card, CardContent, Divider, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsiveLine } from "@nivo/line";

import {
  RECURRING_TYPES,
  TYPE_META_BY_KEY,
  normalizeRecurringType,
} from "../utils/recurringTypes";

const monthLabel = (date) =>
  new Date(date).toLocaleDateString("nb-NO", { month: "short", year: "2-digit" });

const formatCurrency = (value) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(
    Number(value || 0),
  );

const compactFmt = new Intl.NumberFormat("nb-NO", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 0,
});

const compactNok = (value) => compactFmt.format(Number(value || 0));

export default function RecurringOverviewCharts({
  forecast,
  monthsForTypeSplit = 3,
  showTypeSplit = true,
  showExpectedCosts = true,
  showPaidCosts = true,
  showActualIncome = false,
  showExpectedIncome = false,
  title = "Forventet vs betalt",
  subtitle = "Forventet intervall (min-maks) + registrert betalt per måned.",
}) {
  const mui = useTheme();
  const reactId = useId();
  const clipPathId = `expected-band-clip-${reactId}`;

  const nivoTheme = useMemo(() => {
    const grid = alpha(
      mui.palette.common.white,
      mui.palette.mode === "dark" ? 0.12 : 0.18,
    );
    const axis = alpha(
      mui.palette.common.white,
      mui.palette.mode === "dark" ? 0.22 : 0.18,
    );

    return {
      textColor: mui.palette.text.primary,
      fontSize: 12,
      axis: {
        domain: { line: { stroke: axis, strokeWidth: 1 } },
        ticks: {
          line: { stroke: axis, strokeWidth: 1 },
          text: { fill: mui.palette.text.secondary },
        },
        legend: { text: { fill: mui.palette.text.secondary } },
      },
      grid: { line: { stroke: grid, strokeWidth: 1 } },
      legends: { text: { fill: mui.palette.text.secondary } },
      tooltip: {
        container: {
          background: mui.palette.background.paper,
          color: mui.palette.text.primary,
          borderRadius: 12,
          boxShadow:
            mui.palette.mode === "dark"
              ? "0 12px 24px rgba(0,0,0,0.45)"
              : "0 12px 24px rgba(0,0,0,0.18)",
          border: `1px solid ${alpha(mui.palette.common.white, 0.12)}`,
        },
      },
    };
  }, [mui]);

  const expectedColor =
    mui.palette.mode === "dark" ? mui.palette.info.light : mui.palette.info.main;
  const paidColor =
    mui.palette.mode === "dark" ? mui.palette.success.light : mui.palette.success.main;
  const actualIncomeColor =
    mui.palette.mode === "dark" ? "#fbbf24" : "#d97706";
  const expectedIncomeColor =
    mui.palette.mode === "dark" ? "#f59e0b" : "#92400e";
  const bandFill = alpha(expectedColor, mui.palette.mode === "dark" ? 0.18 : 0.16);
  const barColor =
    mui.palette.mode === "dark" ? mui.palette.warning.light : mui.palette.warning.main;

  const bandPoints = useMemo(
    () =>
      (forecast ?? []).map((month) => ({
        x: monthLabel(month.date),
        min: Number(month.expectedMin ?? 0),
        max: Number(month.expectedMax ?? 0),
      })),
    [forecast],
  );

  const lineData = useMemo(
    () =>
      [
        showExpectedCosts
          ? {
              id: "Faste kostnader",
              color: expectedColor,
              data: (forecast ?? []).map((month) => ({
                x: monthLabel(month.date),
                y: Number(month.expectedMax ?? 0),
              })),
            }
          : null,
        showPaidCosts
          ? {
              id: "Betalt",
              color: paidColor,
              data: (forecast ?? []).map((month) => ({
                x: monthLabel(month.date),
                y: Number(month.paidTotal ?? 0),
              })),
            }
          : null,
        showActualIncome
          ? {
              id: "Inntekt",
              color: actualIncomeColor,
              data: (forecast ?? []).map((month) => ({
                x: monthLabel(month.date),
                y: Number(month.incomeActual ?? 0),
              })),
            }
          : null,
        showExpectedIncome
          ? {
              id: "Forventet inntekt",
              color: expectedIncomeColor,
              data: (forecast ?? []).map((month) => ({
                x: monthLabel(month.date),
                y: Number(month.incomeExpected ?? 0),
              })),
            }
          : null,
      ].filter(Boolean),
    [
      actualIncomeColor,
      expectedColor,
      expectedIncomeColor,
      forecast,
      paidColor,
      showActualIncome,
      showExpectedCosts,
      showExpectedIncome,
      showPaidCosts,
    ],
  );

  const ExpectedBandLayer = ({ xScale, yScale, innerHeight, innerWidth }) => {
    if (!showExpectedCosts || !bandPoints.length) return null;
    if (!Number.isFinite(innerWidth) || innerWidth <= 0) return null;
    if (!Number.isFinite(innerHeight) || innerHeight <= 0) return null;

    const topCoords = bandPoints.map((point) => ({
      x: xScale(point.x),
      y: yScale(point.max),
    }));
    const bottomCoords = [...bandPoints].reverse().map((point) => ({
      x: xScale(point.x),
      y: yScale(point.min),
    }));
    const coords = [...topCoords, ...bottomCoords];

    if (coords.some((coord) => !Number.isFinite(coord.x) || !Number.isFinite(coord.y))) {
      return null;
    }

    const top = topCoords
      .map((coord, index) => `${index === 0 ? "M" : "L"} ${coord.x} ${coord.y}`)
      .join(" ");
    const bottom = bottomCoords.map((coord) => `L ${coord.x} ${coord.y}`).join(" ");

    return (
      <g>
        <defs>
          <clipPath id={clipPathId}>
            <rect x="0" y="0" width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>
        <path
          d={`${top} ${bottom} Z`}
          clipPath={`url(#${clipPathId})`}
          fill={bandFill}
          stroke="none"
        />
      </g>
    );
  };

  const DashedPaidLineLayer = ({ series }) => {
    if (!showPaidCosts) return null;
    const paid = series.find((item) => item.id === "Betalt");
    if (!paid?.path) return null;

    return (
      <path
        d={paid.path}
        fill="none"
        stroke={paid.color}
        strokeWidth={3}
        strokeDasharray="8 6"
      />
    );
  };

  const typeBars = useMemo(() => {
    const slice = (forecast ?? []).slice(0, Math.max(1, monthsForTypeSplit));
    const sums = new Map();

    for (const month of slice) {
      for (const item of month.items ?? []) {
        const normalized = normalizeRecurringType(item.type);
        const value = Number(item.expected?.max ?? item.expected?.fixed ?? 0);
        sums.set(normalized, (sums.get(normalized) ?? 0) + value);
      }
    }

    const rows = RECURRING_TYPES.map((type) => ({
      type: TYPE_META_BY_KEY[type.key]?.label ?? type.key,
      amount: Number(sums.get(type.key) ?? 0),
    })).filter((row) => row.amount > 0);

    return rows.length ? rows : [{ type: "-", amount: 0 }];
  }, [forecast, monthsForTypeSplit]);

  const hasLines = lineData.length > 0;

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: showTypeSplit ? { xs: "1fr", lg: "2fr 1fr" } : "1fr",
        alignItems: "stretch",
      }}
    >
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Typography fontWeight={900} variant="h6">
            {title} ({forecast?.length ?? 0} mnd)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
          <Divider sx={{ my: 1.5, opacity: 0.4 }} />
        </CardContent>

        <Box sx={{ height: showTypeSplit ? 260 : 310, px: 1, pb: 1 }}>
          {hasLines ? (
            <ResponsiveLine
              theme={nivoTheme}
              data={lineData}
              colors={(line) => line.color}
              margin={{ top: 10, right: 18, bottom: 56, left: 64 }}
              xScale={{ type: "point" }}
              yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
              curve="monotoneX"
              axisBottom={{ tickRotation: -25, tickPadding: 8 }}
              axisLeft={{
                format: compactNok,
                legend: "NOK",
                legendOffset: -52,
                legendPosition: "middle",
              }}
              gridYValues={6}
              pointSize={7}
              pointBorderWidth={2}
              pointBorderColor={{ from: "serieColor" }}
              pointColor={mui.palette.background.paper}
              useMesh
              enablePoints
              lineWidth={3}
              layers={[
                "grid",
                "markers",
                "axes",
                ExpectedBandLayer,
                "lines",
                DashedPaidLineLayer,
                "points",
                "mesh",
                "legends",
              ]}
              tooltip={({ point }) => (
                <Box sx={{ px: 1.25, py: 0.75 }}>
                  <Typography fontWeight={900} variant="caption">
                    {point.serieId}
                  </Typography>
                  <Typography variant="body2">
                    {point.data.xFormatted}:{" "}
                    <strong>{formatCurrency(point.data.yFormatted)}</strong>
                  </Typography>
                </Box>
              )}
              legends={[
                {
                  anchor: "bottom",
                  direction: "row",
                  translateY: 52,
                  itemWidth: 150,
                  itemHeight: 18,
                  itemsSpacing: 14,
                  symbolSize: 10,
                  symbolShape: "circle",
                  data: lineData.map((line) => ({
                    id: line.id,
                    label: line.id,
                    color: line.color,
                  })),
                },
              ]}
            />
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                color: "text.secondary",
              }}
            >
              <Typography variant="body2">Velg minst en linje å vise.</Typography>
            </Box>
          )}
        </Box>
      </Card>

      {showTypeSplit ? (
        <Card>
          <CardContent sx={{ pb: 1 }}>
            <Typography fontWeight={900} variant="h6">
              Fordeling (neste {monthsForTypeSplit} mnd)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Summerer forventet maks per type i perioden.
            </Typography>
            <Divider sx={{ my: 1.5, opacity: 0.4 }} />
          </CardContent>

          <Box sx={{ height: 260, px: 1, pb: 1 }}>
            <ResponsiveBar
              theme={nivoTheme}
              data={typeBars}
              keys={["amount"]}
              indexBy="type"
              layout="horizontal"
              margin={{ top: 10, right: 18, bottom: 56, left: 160 }}
              padding={0.28}
              colors={barColor}
              borderRadius={6}
              valueScale={{ type: "linear" }}
              indexScale={{ type: "band", round: true }}
              enableGridY={false}
              enableLabel={false}
              axisBottom={{
                format: compactNok,
                tickValues: 5,
                tickRotation: -20,
                tickPadding: 6,
                legend: "NOK",
                legendOffset: 42,
                legendPosition: "middle",
              }}
              axisLeft={{ tickSize: 0, tickPadding: 10 }}
              tooltip={({ indexValue, value }) => (
                <Box sx={{ px: 1.25, py: 0.75 }}>
                  <Typography fontWeight={900} variant="caption">
                    {indexValue}
                  </Typography>
                  <Typography variant="body2">
                    <strong>{formatCurrency(value)}</strong>
                  </Typography>
                </Box>
              )}
            />
          </Box>
        </Card>
      ) : null}
    </Box>
  );
}

RecurringOverviewCharts.propTypes = {
  forecast: PropTypes.array,
  monthsForTypeSplit: PropTypes.number,
  showTypeSplit: PropTypes.bool,
  showExpectedCosts: PropTypes.bool,
  showPaidCosts: PropTypes.bool,
  showActualIncome: PropTypes.bool,
  showExpectedIncome: PropTypes.bool,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};
