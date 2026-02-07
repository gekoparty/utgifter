// src/components/features/RecurringExpenes/components/RecurringOverviewCharts.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Card, CardContent, Typography, Divider } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";

const monthLabel = (d) =>
  new Date(d).toLocaleDateString("nb-NO", { month: "short", year: "2-digit" });

const formatCurrency = (val) =>
  new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" }).format(
    Number(val || 0),
  );

const TYPE_LABEL = {
  MORTGAGE: "Lån",
  HOUSING: "Lån",
  UTILITY: "Strøm/kommunikasjon",
  INSURANCE: "Forsikring",
  SUBSCRIPTION: "Abonnement",
};

const TYPE_ORDER = ["MORTGAGE", "UTILITY", "INSURANCE", "SUBSCRIPTION"];

const compactNok = (v) => {
  const n = Number(v || 0);
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return `${Math.round(n)}`;
};

export default function RecurringOverviewCharts({
  forecast,
  monthsForTypeSplit = 3,
}) {
  const mui = useTheme();

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

  // Palette
  const expectedColor = useMemo(() => {
    return mui.palette.mode === "dark"
      ? mui.palette.info.light
      : mui.palette.info.main;
  }, [mui]);

  const paidColor = useMemo(() => {
    return mui.palette.mode === "dark"
      ? mui.palette.success.light
      : mui.palette.success.main;
  }, [mui]);

  const bandFill = useMemo(() => {
    // translucent band fill
    return alpha(expectedColor, mui.palette.mode === "dark" ? 0.18 : 0.16);
  }, [expectedColor, mui]);

  const barColor = useMemo(() => {
    return mui.palette.mode === "dark"
      ? mui.palette.warning.light
      : mui.palette.warning.main;
  }, [mui]);

  // ---------- Line chart data (range band + expected line + paid line) ----------
  const lineData = useMemo(() => {
    const points = (forecast ?? []).map((m) => ({
      x: monthLabel(m.date),
      expectedMin: Number(m.expectedMin ?? 0),
      expectedMax: Number(m.expectedMax ?? 0),
      expectedMaxLine: Number(m.expectedMax ?? 0),
      paid: Number(m.paidTotal ?? 0),
    }));

    // Nivo "area band" technique:
    // - a "range" series with y = max, and area baseline uses y0 = min via `areaBaselineValue` isn't supported per-point,
    //   so we instead render TWO hidden series (min/max) and a custom layer that fills between them.
    //
    // Easiest reliable approach: custom layer that draws the band between two series.
    //
    // We'll provide:
    // - expectedMin (hidden points)
    // - expectedMax (hidden points)
    // - expectedMaxLine (visible line)
    // - paid (visible dashed)
    return [
      {
        id: "__ExpectedMin",
        data: points.map((p) => ({ x: p.x, y: p.expectedMin })),
      },
      {
        id: "__ExpectedMax",
        data: points.map((p) => ({ x: p.x, y: p.expectedMax })),
      },
      {
        id: "Forventet (maks)",
        color: expectedColor,
        data: points.map((p) => ({ x: p.x, y: p.expectedMaxLine })),
      },
      {
        id: "Betalt",
        color: paidColor,
        data: points.map((p) => ({ x: p.x, y: p.paid })),
      },
    ];
  }, [forecast, expectedColor, paidColor]);

  // Custom band layer: fill between __ExpectedMin and __ExpectedMax
  const ExpectedBandLayer = (props) => {
    const { series, xScale, yScale, innerHeight, innerWidth } = props;

    const minSerie = series.find((s) => s.id === "__ExpectedMin");
    const maxSerie = series.find((s) => s.id === "__ExpectedMax");
    if (!minSerie || !maxSerie) return null;

    const minPts = minSerie.data;
    const maxPts = maxSerie.data;
    if (!minPts?.length || !maxPts?.length) return null;

    // Build SVG path:
    // go along max left->right, then min right->left, close.
    const top = maxPts
      .map((p, i) => {
        const x = xScale(p.data.x);
        const y = yScale(p.data.y);
        return `${i === 0 ? "M" : "L"} ${x} ${y}`;
      })
      .join(" ");

    const bottom = minPts
      .slice()
      .reverse()
      .map((p) => {
        const x = xScale(p.data.x);
        const y = yScale(p.data.y);
        return `L ${x} ${y}`;
      })
      .join(" ");

    const d = `${top} ${bottom} Z`;

    // Clip to chart area
    return (
      <g>
        <defs>
          <clipPath id="expected-band-clip">
            <rect x="0" y="0" width={innerWidth} height={innerHeight} />
          </clipPath>
        </defs>
        <path
          d={d}
          clipPath="url(#expected-band-clip)"
          fill={bandFill}
          stroke="none"
        />
      </g>
    );
  };

  // ---------- Bar chart data ----------
  const typeBars = useMemo(() => {
    const slice = (forecast ?? []).slice(0, Math.max(1, monthsForTypeSplit));
    const sums = new Map();

    for (const m of slice) {
      for (const it of m.items ?? []) {
        const t = String(it.type || "").toUpperCase();
        const normalized = t === "HOUSING" ? "MORTGAGE" : t;
        const v = Number(it.expected?.max ?? it.expected?.fixed ?? 0);
        sums.set(normalized, (sums.get(normalized) ?? 0) + v);
      }
    }

    const rows = TYPE_ORDER.map((t) => ({
      type: TYPE_LABEL[t] ?? t,
      amount: Number(sums.get(t) ?? 0),
    })).filter((r) => r.amount > 0);

    return rows.length ? rows : [{ type: "—", amount: 0 }];
  }, [forecast, monthsForTypeSplit]);

  // Filter out hidden series from legends & points
  const visibleSeriesForLegend = ["Forventet (maks)", "Betalt"];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
        alignItems: "stretch",
      }}
    >
      {/* Line: Expected band + expected line + paid line */}
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
            margin={{ top: 10, right: 18, bottom: 44, left: 64 }}
            xScale={{ type: "point" }}
            yScale={{ type: "linear", min: 0, max: "auto", stacked: false }}
            curve="monotoneX"
            enableArea={false}
            axisBottom={{
              tickRotation: -25,
              tickPadding: 8,
            }}
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
            // Hide points/lines for min/max helper series
            enablePoints={(s) =>
              s?.id !== "__ExpectedMin" && s?.id !== "__ExpectedMax"
            }
            lineWidth={(s) =>
              s?.id === "Forventet (maks)" ? 3 : s?.id === "Betalt" ? 3 : 0
            }
            // Paid dashed
            lineStyle={(s) =>
              s?.id === "Betalt" ? { strokeDasharray: "8 6" } : undefined
            }
            // Custom layers: grid -> axes -> band -> lines -> points -> mesh -> legends
            layers={[
              "grid",
              "markers",
              "axes",
              ExpectedBandLayer,
              "lines",
              "points",
              "mesh",
              "legends",
            ]}
            tooltip={({ point }) => {
              // ignore hidden helper series
              if (
                point.serieId === "__ExpectedMin" ||
                point.serieId === "__ExpectedMax"
              )
                return null;

              return (
                <Box sx={{ px: 1.25, py: 0.75 }}>
                  <Typography fontWeight={900} variant="caption">
                    {point.serieId}
                  </Typography>
                  <Typography variant="body2">
                    {point.data.xFormatted}:{" "}
                    <strong>{formatCurrency(point.data.yFormatted)}</strong>
                  </Typography>
                </Box>
              );
            }}
            legends={[
              {
                anchor: "bottom",
                direction: "row",
                translateY: 44,
                itemWidth: 150,
                itemHeight: 18,
                itemsSpacing: 14,
                symbolSize: 10,
                symbolShape: "circle",
                data: visibleSeriesForLegend.map((id) => ({
                  id,
                  label: id,
                  color: id === "Betalt" ? paidColor : expectedColor,
                })),
              },
            ]}
          />
        </Box>
      </Card>

      {/* Bars: Type split next N months */}
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
            margin={{ top: 10, right: 18, bottom: 40, left: 160 }}
            padding={0.28}
            colors={barColor}
            borderRadius={6}
            valueScale={{ type: "linear" }}
            indexScale={{ type: "band", round: true }}
            enableGridY={false}
            enableLabel={false}
            axisBottom={{
              format: compactNok,
              legend: "NOK",
              legendOffset: 32,
              legendPosition: "middle",
            }}
            axisLeft={{
              tickSize: 0,
              tickPadding: 10,
            }}
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
