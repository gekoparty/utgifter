// src/components/Charts/ProductPriceChart/ProductPriceChart.jsx
import React, { useMemo, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import { Paper, Typography, useTheme, Box, Chip, Grid } from "@mui/material";
import dayjs from "dayjs";
import _ from "lodash";

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
  const [yearlyBreakdown, setYearlyBreakdown] = useState("overall"); // overall | shop | variant | shopVariant
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
  const top = data?.top ?? {};

  const productNameStr = data?.product?.name || history?.[0]?.productName || "Product";
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

    const shopGroups = _.groupBy(history, "shopName");
    const shopStats = Object.entries(shopGroups)
      .map(([shop, items]) => ({
        name: shop,
        avg: _.meanBy(items.filter((i) => Number.isFinite(i.pricePerUnit)), "pricePerUnit"),
        count: items.length,
      }))
      .filter((s) => Number.isFinite(s.avg))
      .sort((a, b) => a.avg - b.avg);

    const brandGroups = _.groupBy(history, "brandName");
    const brandStats = Object.entries(brandGroups)
      .map(([brand, items]) => ({
        name: brand,
        avg: _.meanBy(items.filter((i) => Number.isFinite(i.pricePerUnit)), "pricePerUnit"),
        count: items.length,
      }))
      .filter((b) => Number.isFinite(b.avg))
      .sort((a, b) => a.avg - b.avg);

    const variantGroups = _.groupBy(history, (h) => h.variantName || "Standard");
    const variantStats = Object.entries(variantGroups)
      .map(([name, items]) => ({
        name,
        avg: _.meanBy(items.filter((i) => Number.isFinite(i.pricePerUnit)), "pricePerUnit"),
        count: items.length,
      }))
      .filter((v) => Number.isFinite(v.avg))
      .sort((a, b) => a.avg - b.avg);

    return { cheapestRecord, mostExpensiveRecord, shopStats, brandStats, variantStats };
  }, [history]);

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
        ? { label: "Neste kjøp (est.)", value: dayjs(freq.nextPurchaseDate).format("DD. MMM YYYY"), color: "primary" }
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
        label: "3 mnd spend",
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

  if (!productId) return <Typography>Select a product above.</Typography>;
  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error loading history</Typography>;

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <HeaderControls
          productNameStr={productNameStr}
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

        {/* KPI grid */}
        <Box sx={{ mb: 2 }}>
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

        {/* Chart */}
        <div style={{ height: 420 }}>
          <ReactECharts option={option} style={{ height: "100%", width: "100%" }} notMerge={true} lazyUpdate={true} onEvents={onEvents} />
        </div>

        {(mode === "shops" || mode === "yearly") && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            Tips: Hold musepekeren over legend for å fremheve én serie. Klikk legend for å skjule/vis serie.
          </Typography>
        )}
      </Paper>

      {/* Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <MonthlySpendCard monthlySpend={monthlySpend} top={top} />
        </Grid>
        <Grid item xs={12} md={6}>
          <ForecastCard freq={freq} discount={discount} top={top} />
        </Grid>
      </Grid>

      <DetailedStats stats={stats} />
    </Box>
  );
}