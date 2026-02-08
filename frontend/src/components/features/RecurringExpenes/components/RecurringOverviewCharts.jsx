// src/components/features/RecurringExpenes/components/RecurringOverviewCharts.jsx
import React, { useMemo, useId } from "react";
import PropTypes from "prop-types";
import { Box, Card, CardContent, Typography, Divider } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";

import {
  RECURRING_TYPES,
  TYPE_META_BY_KEY,
  normalizeRecurringType,
} from "../../../../screens/RecurringExpenses/utils/recurringTypes"; // ensure this path is correct

const monthLabel = (d) =>
  new Date(d).toLocaleDateString("nb-NO", { month: "short", year: "2-digit" });

const formatCurrency = (val) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(
    Number(val || 0),
  );

// Better NOK compact formatter (native Intl)
const compactFmt = new Intl.NumberFormat("nb-NO", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 0,
});
const compactNok = (v) => compactFmt.format(Number(v || 0));

export default function RecurringOverviewCharts({
  forecast,
  monthsForTypeSplit = 3,
}) {
  const mui = useTheme();
  const reactId = useId(); // unique per mount (React 18/19)
  const clipPathId = `expected-band-clip-${reactId}`;

  // ---------- Nivo theme derived from MUI ----------
  const nivoTheme = useMemo(() => {
    const text = mui.palette.text.primary;
    const text2 = mui.palette.text.secondary;

    const grid = alpha(
      mui.palette.common.white,
      mui.palette.mode === "dark" ? 0.12 : 0.18,
    );
    const axis = alpha(
      mui.palette.common.white,
      mui.palette.mode === "dark" ? 0.22 : 0.18,
    );

    return {
      textColor: text,
      fontSize: 12,
      axis: {
        domain: { line: { stroke: axis, strokeWidth: 1 } },
        ticks: {
          line: { stroke: axis, strokeWidth: 1 },
          text: { fill: text2 },
        },
        legend: { text: { fill: text2 } },
      },
      grid: { line: { stroke: grid, strokeWidth: 1 } },
      legends: { text: { fill: text2 } },
      tooltip: {
        container: {
          background: mui.palette.background.paper,
          color: text,
          borderRadius: 12,
          boxShadow:
            mui.palette.mode === "dark"
              ? "0 12px 24px rgba(0,0,0,0.45)"
              : "0 12px 24px rgba(0,0,0,0.18)",
          border: `1px solid ${alpha(
            mui.palette.common.white,
            mui.palette.mode === "dark" ? 0.12 : 0.12,
          )}`,
        },
      },
    };
  }, [mui]);

  // ---------- Palette ----------
  const expectedColor = useMemo(
    () =>
      mui.palette.mode === "dark"
        ? mui.palette.info.light
        : mui.palette.info.main,
    [mui],
  );

  const paidColor = useMemo(
    () =>
      mui.palette.mode === "dark"
        ? mui.palette.success.light
        : mui.palette.success.main,
    [mui],
  );

  const bandFill = useMemo(
    () => alpha(expectedColor, mui.palette.mode === "dark" ? 0.18 : 0.16),
    [expectedColor, mui],
  );

  const barColor = useMemo(
    () =>
      mui.palette.mode === "dark"
        ? mui.palette.warning.light
        : mui.palette.warning.main,
    [mui],
  );

  // ---------- Line chart data ----------
  const bandPoints = useMemo(() => {
    return (forecast ?? []).map((m) => ({
      x: monthLabel(m.date),
      min: Number(m.expectedMin ?? 0),
      max: Number(m.expectedMax ?? 0),
    }));
  }, [forecast]);

  const lineData = useMemo(() => {
    const points = (forecast ?? []).map((m) => ({
      x: monthLabel(m.date),
      expectedMax: Number(m.expectedMax ?? 0),
      paid: Number(m.paidTotal ?? 0),
    }));

    return [
      {
        id: "Forventet (maks)",
        color: expectedColor,
        data: points.map((p) => ({ x: p.x, y: p.expectedMax })),
      },
      {
        id: "Betalt",
        color: paidColor,
        data: points.map((p) => ({ x: p.x, y: p.paid })),
      },
    ];
  }, [forecast, expectedColor, paidColor]);

  // Band layer between expected min/max
  const ExpectedBandLayer = ({ xScale, yScale, innerHeight, innerWidth }) => {
    if (!bandPoints?.length) return null;

    const top = bandPoints
      .map((p, i) => {
        const x = xScale(p.x);
        const y = yScale(p.max);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    const bottom = bandPoints
      .slice()
      .reverse()
      .map((p) => {
        const x = xScale(p.x);
        const y = yScale(p.min);
        return `L ${x} ${y}`;
      })
      .join(" ");

    const d = `${top} ${bottom} Z`;

    return (
      <g>
        <defs>
          <clipPath id={clipPathId}>
            <rect x="0" y="0" width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>
        <path
          d={d}
          clipPath={`url(#${clipPathId})`}
          fill={bandFill}
          stroke="none"
        />
      </g>
    );
  };

  // Overlay dashed paid line ON TOP of normal lines (so we keep the "lines" layer)
  const DashedPaidLineLayer = ({ series }) => {
    const paid = series.find((s) => s.id === "Betalt");
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

  // ---------- Bar chart data ----------
  const typeBars = useMemo(() => {
    const slice = (forecast ?? []).slice(0, Math.max(1, monthsForTypeSplit));
    const sums = new Map();

    for (const m of slice) {
      for (const it of m.items ?? []) {
        const normalized = normalizeRecurringType(it.type);
        const v = Number(it.expected?.max ?? it.expected?.fixed ?? 0);
        sums.set(normalized, (sums.get(normalized) ?? 0) + v);
      }
    }

    const rows = RECURRING_TYPES.map((t) => ({
      type: TYPE_META_BY_KEY[t.key]?.label ?? t.key,
      amount: Number(sums.get(t.key) ?? 0),
    })).filter((r) => r.amount > 0);

    return rows.length ? rows : [{ type: "—", amount: 0 }];
  }, [forecast, monthsForTypeSplit]);

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        alignItems: "stretch",
      }}
    >
      {/* Line */}
      <Card>
        <CardContent sx={{ pb: 1 }}>
          <Typography fontWeight={900} variant="h6">
            Forventet vs betalt (12 mnd)
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Forventet intervall (min–maks) + registrert betalt per måned.
          </Typography>
          <Divider sx={{ my: 1.5, opacity: 0.4 }} />
        </CardContent>

        <Box sx={{ height: 260, px: 1, pb: 1 }}>
          <ResponsiveLine
            theme={nivoTheme}
            data={lineData}
            colors={(d) => d.color}
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
              ExpectedBandLayer, // behind
              "lines", // ✅ required
              DashedPaidLineLayer, // dashed overlay
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
                data: ["Forventet (maks)", "Betalt"].map((id) => ({
                  id,
                  label: id,
                  color: id === "Betalt" ? paidColor : expectedColor,
                })),
              },
            ]}
          />
        </Box>
      </Card>

      {/* Bars */}
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
    </Box>
  );
}

RecurringOverviewCharts.propTypes = {
  forecast: PropTypes.array,
  monthsForTypeSplit: PropTypes.number,
};
