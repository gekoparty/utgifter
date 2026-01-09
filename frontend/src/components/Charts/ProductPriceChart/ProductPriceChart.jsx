import React, { useMemo, useState, useCallback } from "react";
import ReactECharts from "echarts-for-react";
import {
  Paper,
  Typography,
  useTheme,
  Box,
  Chip,
  Stack,
  Grid,
} from "@mui/material";
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

  const [mode, setMode] = useState("overview"); // "overview" | "shops" | "distribution"
  const [includeDiscounts, setIncludeDiscounts] = useState(true);

  const [topN, setTopN] = useState(5);
  const [visibleShops, setVisibleShops] = useState([]);
  const [hiddenSeries, setHiddenSeries] = useState(() => new Set());
  const [highlightSeries, setHighlightSeries] = useState(null);

  const [overviewBucket, setOverviewBucket] = useState("week"); // "week" | "month"
  const [showAllKpis, setShowAllKpis] = useState(false);

  const { data, isLoading, error } = useProductInsights(productId, includeDiscounts);

  const history = data?.history ?? [];
  const monthlySpend = data?.monthlySpend ?? [];
  const freq = data?.frequency ?? {};
  const trend = data?.trend ?? {};
  const threeMonth = trend?.threeMonth ?? {};
  const discount = data?.discount ?? {};
  const top = data?.top ?? {};

  const productNameStr = data?.product?.name || history?.[0]?.productName || "Product";
  const measurementUnit = data?.product?.measurementUnit || history?.[0]?.measurementUnit || "unit";

  const { shops, overviewBuckets, shopSeriesData, distributionBuckets } = usePreparedSeries({
    history,
    mode,
    topN,
    visibleShops,
    overviewBucket,
  });

  const stats = useMemo(() => {
    if (!history?.length) return null;

    const cheapestRecord = _.minBy(history.filter((h) => Number.isFinite(h.pricePerUnit)), "pricePerUnit");
    const mostExpensiveRecord = _.maxBy(history.filter((h) => Number.isFinite(h.pricePerUnit)), "pricePerUnit");

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

    return { cheapestRecord, mostExpensiveRecord, shopStats, brandStats };
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
    return [
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
  }, [threeMonth, discount]);

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
          setMode={setMode}
          includeDiscounts={includeDiscounts}
          setIncludeDiscounts={setIncludeDiscounts}
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
        />

        {/* Chart */}
        <div style={{ height: 420 }}>
          <ReactECharts
            option={option}
            style={{ height: "100%", width: "100%" }}
            notMerge={true}
            lazyUpdate={true}
            onEvents={onEvents}
          />
        </div>

        {mode === "shops" && (
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
