// src/components/Charts/ProductPriceChart/ProductPriceChart.jsx
import React, { useMemo, useState, useCallback } from "react";
import { Paper, Typography, useTheme, Box, Chip, Grid } from "@mui/material";
import dayjs from "dayjs";
import _ from "lodash";

import useEChart from "../hooks/useEChart";
import { useProductInsights } from "./hooks/useProductInsights";
import { usePreparedSeries } from "./hooks/usePreparedSeries";
import { buildOption } from "./echarts/buildOption";
import { useEChartEvents } from "./echarts/useEChartEvents";

import KpiTile from "./ui/KpiTile";
import HeaderControls from "./ui/HeaderControls";
import ModeControls from "./ui/ModeControls";

import MonthlySpendCard from "./sections/MonthlySpendCard";
import ForecastCard from "./sections/ForecastCard";
import DetailedStats from "./sections/DetailedStats";
import YearlyIncreaseCard from "./sections/YearlyIncreaseCard";
import UsageSummaryCard from "./sections/UsageSummaryCard";

import { formatCurrency, fmtPct, fmt1, changeChipColor } from "./utils/format";

export default function ProductPriceChart({ productId }) {
  const theme = useTheme();

  const [mode, setMode] = useState("overview"); // "overview" | "shops" | "distribution" | "yearly"
  const [includeDiscounts, setIncludeDiscounts] = useState(true);

  // shops mode controls
  const [topN, setTopN] = useState(5);
  const [visibleShops, setVisibleShops] = useState([]);

  // shared legend state
  const [hiddenSeries, setHiddenSeries] = useState(() => new Set());
  const [highlightSeries, setHighlightSeries] = useState(null);

  const [overviewBucket, setOverviewBucket] = useState("week"); // "week" | "month"
  const [showAllKpis, setShowAllKpis] = useState(false);

  // variant filtering
  const [selectedVariantIds, setSelectedVariantIds] = useState([]); // [] => all

  // ✅ yearly mode controls
  const [yearlyBreakdown, setYearlyBreakdown] = useState("overall"); // overall | brand | shop | variant | shopVariant
  const [yearlyTopN, setYearlyTopN] = useState(5);
  const [visibleYearSeries, setVisibleYearSeries] = useState([]);

  const { data, isLoading, error } = useProductInsights(productId, includeDiscounts, selectedVariantIds);

  const history = data?.history ?? [];
  const monthlySpend = data?.monthlySpend ?? [];
  const yearly = data?.yearly ?? null;

  const freq = data?.frequency ?? {};
  const trend = data?.trend ?? {};
  const threeMonth = trend?.threeMonth ?? {};
  const discount = data?.discount ?? {};
  const productNameStr = data?.product?.name || history?.[0]?.productName || "Product";
  const productCategory = data?.product?.category || history?.[0]?.productCategory || "";
  const measurementUnit = data?.product?.measurementUnit || history?.[0]?.measurementUnit || "unit";

  // available variants for selector (prefer variantStats if present)
  const availableVariants = useMemo(() => {
    if (Array.isArray(data?.variantStats) && data.variantStats.length) {
      return data.variantStats
        .map((v) => ({ id: String(v.variantId ?? "").trim(), name: String(v.variantName ?? "Standard") }))
        .filter((v) => v.id); // only true variant IDs
    }
    const map = new Map();
    for (const h of history) {
      const id = String(h?.variantId ?? "").trim();
      const name = String(h?.variantName ?? "Standard");
      if (id) map.set(id, name);
    }
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [data?.variantStats, history]);

  const {
    shops,
    overviewBuckets,
    shopSeriesData,
    distributionBuckets,
    yearlySeriesCatalog,
    yearlySeriesData,
  } = usePreparedSeries({
    history,
    mode,
    topN,
    visibleShops,
    overviewBucket,

    yearlyBreakdown,
    yearlyData: yearly,
    yearlyTopN,
    visibleYearSeries,
  });

  // yearly overall latest row for KPI
  const latestYearRow = useMemo(() => {
    const arr = yearly?.overall ?? [];
    return arr.length ? arr[arr.length - 1] : null;
  }, [yearly]);

  const stats = useMemo(() => {
    if (!history?.length) return null;

    const finite = history.filter((h) => Number.isFinite(h.pricePerUnit));
    const cheapestRecord = _.minBy(finite, "pricePerUnit");
    const mostExpensiveRecord = _.maxBy(finite, "pricePerUnit");

    const normalizeAggregateStats = (rows, nameKey = "name") =>
      (Array.isArray(rows) ? rows : [])
        .map((row) => ({
          name: row?.[nameKey] ?? row?.variantName ?? "Ukjent",
          avg: Number(row?.avgPricePerUnit),
          count: Number(row?.purchases ?? 0),
        }))
        .filter((row) => Number.isFinite(row.avg))
        .sort((a, b) => a.avg - b.avg);

    const shopStats = normalizeAggregateStats(data?.shopStats);
    const brandStats = normalizeAggregateStats(data?.brandStats);
    const locationStats = normalizeAggregateStats(data?.locationStats);
    const variantStats = normalizeAggregateStats(data?.variantStats, "variantName");

    return { cheapestRecord, mostExpensiveRecord, shopStats, brandStats, locationStats, variantStats };
  }, [data?.brandStats, data?.locationStats, data?.shopStats, data?.variantStats, history]);

  const usageSummary = useMemo(
    () => ({
      category: productCategory,
      top: data?.top ?? {},
    }),
    [data?.top, productCategory],
  );

  const stopScrollBubble = useCallback((e) => {
    const el = e.currentTarget;
    if (el.scrollHeight <= el.clientHeight) return;

    const atTop = el.scrollTop <= 0;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
    const scrollingDown = e.deltaY > 0;
    const canScroll = (scrollingDown && !atBottom) || (!scrollingDown && !atTop);

    if (canScroll) {
      e.stopPropagation();
      e.preventDefault?.();
    }
  }, []);

  const kpisPrimary = useMemo(() => {
    return [
      { label: "Kjøp", value: `${freq.totalPurchases ?? 0}` },
      { label: "Per mnd", value: fmt1(freq.perMonth) },
      { label: "Per år", value: fmt1(freq.perYear) },
      freq.nextPurchaseDate
        ? { label: "Neste kjøp", value: dayjs(freq.nextPurchaseDate).format("DD. MMM YYYY"), color: "primary" }
        : null,
      { label: "Sist vs forrige", value: fmtPct(trend.lastVsPrevPct), color: changeChipColor(trend.lastVsPrevPct) },
      { label: "Sist vs første", value: fmtPct(trend.lastVsFirstPct), color: changeChipColor(trend.lastVsFirstPct) },
    ].filter(Boolean);
  }, [freq, trend]);

  const kpisSecondary = useMemo(() => {
    const base = [
      {
        label: "3 mnd pris",
        value: fmtPct(threeMonth?.pctChangePricePerUnit),
        color: changeChipColor(threeMonth?.pctChangePricePerUnit),
      },
      {
        label: "3 mnd forbruk",
        value: fmtPct(threeMonth?.pctChangeSpend),
        color: changeChipColor(threeMonth?.pctChangeSpend),
      },
      {
        label: "Spart",
        value: `${formatCurrency(discount.totalSavings ?? 0)} (${fmtPct(discount.savingsRate)})`,
        color: (discount.totalSavings ?? 0) > 0 ? "success" : "default",
      },
    ];

    // ✅ yearly overall change KPIs
    if (latestYearRow) {
      base.push({
        label: `År ${latestYearRow.year} YoY`,
        value: fmtPct(latestYearRow.yoyPct),
        color: changeChipColor(latestYearRow.yoyPct),
      });
      base.push({
        label: "År siden start",
        value: fmtPct(latestYearRow.sinceStartPct),
        color: changeChipColor(latestYearRow.sinceStartPct),
      });
    }

    return base;
  }, [threeMonth, discount, latestYearRow]);

  const option = useMemo(() => {
    return buildOption({
      mode,
      theme,
      measurementUnit,
      overviewBuckets,
      shopSeriesData,
      distributionBuckets,
      hiddenSeries,
      highlightSeries,

      yearlySeriesData,
    });
  }, [
    mode,
    theme,
    measurementUnit,
    overviewBuckets,
    shopSeriesData,
    distributionBuckets,
    hiddenSeries,
    highlightSeries,
    yearlySeriesData,
  ]);

  const onEvents = useEChartEvents({ mode, setHiddenSeries, setHighlightSeries });

  const { elementRef: chartBoxRef } = useEChart({
    option,
    enabled: Boolean(productId) && !isLoading && !error,
    events: onEvents,
  });

  if (!productId) return <Typography>Velg et produkt over.</Typography>;
  if (isLoading) return <Typography>Laster prishistorikk...</Typography>;
  if (error) return <Typography color="error">Kunne ikke laste prishistorikk.</Typography>;

  const chartHeight = { xs: 300, md: 340, lg: 360 };

  return (
    <Box>
      <Paper variant="outlined" sx={{ p: { xs: 1.5, md: 2 }, mb: 1.5, borderRadius: 2 }}>
        <HeaderControls
          productNameStr={productNameStr}
          productCategory={productCategory}
          mode={mode}
          setMode={(v) => {
            setMode(v);
            setHiddenSeries(new Set());
            setHighlightSeries(null);
          }}
          includeDiscounts={includeDiscounts}
          setIncludeDiscounts={setIncludeDiscounts}
          variants={availableVariants}
          selectedVariantIds={selectedVariantIds}
          setSelectedVariantIds={setSelectedVariantIds}
        />

        <Box sx={{ mb: 1.5 }}>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
                md: "repeat(6, minmax(0, 1fr))",
              },
            }}
          >
            {kpisPrimary.map((k) => (
              <KpiTile key={k.label} label={k.label} value={k.value} color={k.color} />
            ))}

            {(showAllKpis ? kpisSecondary : []).map((k) => (
              <KpiTile key={k.label} label={k.label} value={k.value} color={k.color} />
            ))}
          </Box>

          {kpisSecondary.length > 0 && (
            <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
              <Chip
                clickable
                variant="outlined"
                label={showAllKpis ? "Vis færre" : `Vis flere (${kpisSecondary.length})`}
                onClick={() => setShowAllKpis((v) => !v)}
                sx={{ borderRadius: 2 }}
              />
            </Box>
          )}
        </Box>

        <ModeControls
          mode={mode}
          overviewBucket={overviewBucket}
          setOverviewBucket={setOverviewBucket}
          topN={topN}
          setTopN={setTopN}
          shops={shops}
          visibleShops={visibleShops}
          setVisibleShops={setVisibleShops}
          hiddenSeries={hiddenSeries}
          setHiddenSeries={setHiddenSeries}
          stopScrollBubble={stopScrollBubble}
          yearlyBreakdown={yearlyBreakdown}
          setYearlyBreakdown={(v) => {
            setYearlyBreakdown(v);
            setVisibleYearSeries([]);
            setHiddenSeries(new Set());
            setHighlightSeries(null);
          }}
          yearlyTopN={yearlyTopN}
          setYearlyTopN={setYearlyTopN}
          yearlySeriesCatalog={yearlySeriesCatalog}
          visibleYearSeries={visibleYearSeries}
          setVisibleYearSeries={setVisibleYearSeries}
        />

        <Grid container spacing={2} alignItems="flex-start">
          <Grid size={{ xs: 12, lg: 8 }}>
            <Box
              ref={chartBoxRef}
              sx={{
                height: chartHeight,
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                bgcolor: theme.palette.mode === "dark" ? "background.default" : "grey.50",
                p: { xs: 0.5, md: 1 },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Box
              sx={{
                display: "grid",
                gap: 1.25,
                alignContent: "start",
              }}
            >
              <UsageSummaryCard usage={usageSummary} />
              <YearlyIncreaseCard yearly={yearly} />
              <MonthlySpendCard monthlySpend={monthlySpend} />
              <ForecastCard freq={freq} discount={discount} />
            </Box>
          </Grid>
        </Grid>

        {(mode === "shops" || mode === "yearly") && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Tips: Hold musepekeren over forklaringen for å fremheve én serie. Klikk for å skjule eller vise serien.
          </Typography>
        )}
      </Paper>

      <DetailedStats stats={stats} />
    </Box>
  );
}
