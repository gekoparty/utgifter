import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ResponsiveLine } from "@nivo/line";
import {
  Paper,
  Typography,
  useTheme,
  Box,
  FormControlLabel,
  Switch,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  Stack,
} from "@mui/material";
import dayjs from "dayjs";
import _ from "lodash";

const formatCurrency = (val) =>
  new Intl.NumberFormat("no-NO", { style: "currency", currency: "NOK" }).format(val);

const fmt1 = (n) => (Number.isFinite(n) ? n.toFixed(1) : "—");
const fmtPct = (n) => (Number.isFinite(n) ? `${n >= 0 ? "+" : ""}${n.toFixed(1)}%` : "—");

export default function ProductPriceChart({ productId }) {
  const theme = useTheme();
  const [includeDiscounts, setIncludeDiscounts] = useState(true);

  const { data, isLoading, error } = useQuery({
    queryKey: ["stats", "productInsights", productId, includeDiscounts],
    queryFn: async () => {
      const r = await fetch(
        `/api/stats/product-insights?productId=${productId}&includeDiscounts=${includeDiscounts}`
      );
      if (!r.ok) throw new Error("Network response was not ok");
      return r.json();
    },
    enabled: !!productId,
    staleTime: 60_000,
  });

  const rawHistory = data?.history ?? [];

  // Chart data (group by shop)
  const nivoData = useMemo(() => {
    const groupedByShop = _.groupBy(rawHistory, "shopName");
    return Object.entries(groupedByShop).map(([shopName, records]) => ({
      id: shopName,
      data: records.map((d) => ({
        x: dayjs(d.date).format("YYYY-MM-DD"),
        y: d.pricePerUnit,
        hasDiscount: d.hasDiscount,
        brand: d.brandName,
      })),
    }));
  }, [rawHistory]);

  // Basic stats from history (cheapest/most expensive + averages)
  const stats = useMemo(() => {
    if (!rawHistory?.length) return null;

    const cheapestRecord = _.minBy(rawHistory, "pricePerUnit");
    const mostExpensiveRecord = _.maxBy(rawHistory, "pricePerUnit");

    const shopGroups = _.groupBy(rawHistory, "shopName");
    const shopStats = Object.entries(shopGroups)
      .map(([shop, items]) => ({
        name: shop,
        avg: _.meanBy(items, "pricePerUnit"),
        count: items.length,
      }))
      .sort((a, b) => a.avg - b.avg);

    const brandGroups = _.groupBy(rawHistory, "brandName");
    const brandStats = Object.entries(brandGroups)
      .map(([brand, items]) => ({
        name: brand,
        avg: _.meanBy(items, "pricePerUnit"),
        count: items.length,
      }))
      .sort((a, b) => a.avg - b.avg);

    return {
      cheapestRecord,
      mostExpensiveRecord,
      shopStats,
      brandStats,
    };
  }, [rawHistory]);

  const productNameStr = data?.product?.name || rawHistory?.[0]?.productName || "Product";
  const measurementUnit = data?.product?.measurementUnit || rawHistory?.[0]?.measurementUnit || "unit";

  const nivoTheme = useMemo(
    () => ({
      textColor: theme.palette.text.primary,
      fontSize: 11,
      axis: {
        domain: { line: { stroke: theme.palette.divider, strokeWidth: 1 } },
        legend: { text: { fontSize: 12, fill: theme.palette.text.primary } },
        ticks: {
          line: { stroke: theme.palette.divider, strokeWidth: 1 },
          text: { fontSize: 11, fill: theme.palette.text.secondary },
        },
      },
      grid: {
        line: {
          stroke: theme.palette.divider,
          strokeWidth: 1,
          strokeDasharray: "4 4",
        },
      },
      tooltip: {
        container: {
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
        },
      },
      crosshair: {
        line: {
          stroke: theme.palette.text.secondary,
          strokeWidth: 1,
          strokeOpacity: 0.5,
        },
      },
    }),
    [theme.palette]
  );

  if (!productId) return <Typography>Select a product above.</Typography>;
  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error loading history</Typography>;

  const freq = data?.frequency;
  const trend = data?.trend;
  const discount = data?.discount;
  const monthlySpend = data?.monthlySpend ?? [];
  const top = data?.top;

  return (
    <Box>
      {/* CHART */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5">{productNameStr} — Prisutvikling</Typography>
          <FormControlLabel
            control={
              <Switch checked={includeDiscounts} onChange={(e) => setIncludeDiscounts(e.target.checked)} />
            }
            label="Inkluder tilbudspriser"
          />
        </Box>

        <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
          <Chip label={`${freq?.totalPurchases ?? 0} kjøp`} variant="outlined" />
          <Chip label={`${fmt1(freq?.perMonth)} / mnd`} />
          <Chip label={`${fmt1(freq?.perYear)} / år`} />
          {freq?.nextPurchaseDate && (
            <Chip
              color="primary"
              label={`Neste kjøp (est.): ${dayjs(freq.nextPurchaseDate).format("DD. MMM YYYY")}`}
            />
          )}

          {/* % change */}
          <Chip
            color={Number.isFinite(trend?.lastVsPrevPct) ? (trend.lastVsPrevPct >= 0 ? "warning" : "success") : "default"}
            label={`Sist vs forrige: ${fmtPct(trend?.lastVsPrevPct)}`}
          />
          <Chip
            color={Number.isFinite(trend?.lastVsFirstPct) ? (trend.lastVsFirstPct >= 0 ? "warning" : "success") : "default"}
            label={`Sist vs første: ${fmtPct(trend?.lastVsFirstPct)}`}
          />

          {/* Discount savings */}
          {discount && (
            <Chip
              color={discount.totalSavings > 0 ? "success" : "default"}
              label={`Spart: ${formatCurrency(discount.totalSavings)} (${fmtPct(discount.savingsRate)})`}
            />
          )}
        </Stack>

        <div style={{ height: 400 }}>
          <ResponsiveLine
            data={nivoData}
            theme={nivoTheme}
            xScale={{ type: "time", format: "%Y-%m-%d", precision: "day" }}
            yScale={{ type: "linear", min: "auto", max: "auto", stacked: false }}
            margin={{ top: 20, right: 110, bottom: 50, left: 60 }}
            axisBottom={{
              format: "%b %d",
              tickValues: "every month",
              legend: "Dato",
              legendOffset: 36,
              legendPosition: "middle",
            }}
            axisLeft={{
              legend: `Kr per ${measurementUnit}`,
              legendOffset: -40,
              legendPosition: "middle",
            }}
            useMesh
            enableSlices="x"
            pointSize={8}
            pointBorderWidth={2}
            pointColor={{ theme: "background" }}
            pointBorderColor={{ from: "serieColor" }}
            tooltip={({ point }) => (
              <div
                style={{
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  padding: "9px",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: "4px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                }}
              >
                <strong>{point.serieId}</strong>
                <br />
                {dayjs(point.data.x).format("DD. MMM YYYY")}
                <br />
                <Typography variant="body2" component="span" fontWeight="bold">
                  {Number(point.data.y).toFixed(2)} kr
                </Typography>{" "}
                per {measurementUnit}
                <br />
                <Typography variant="caption" color="text.secondary">
                  Brand: {point.data.brand}
                </Typography>
                {point.data.hasDiscount && (
                  <Chip
                    label="Tilbud!"
                    color="success"
                    size="small"
                    sx={{ ml: 1, height: 20, fontSize: "0.6rem" }}
                  />
                )}
              </div>
            )}
            legends={[
              {
                anchor: "bottom-right",
                direction: "column",
                justify: false,
                translateX: 100,
                translateY: 0,
                itemsSpacing: 0,
                itemDirection: "left-to-right",
                itemWidth: 90,
                itemHeight: 20,
                itemOpacity: 0.75,
                symbolSize: 12,
                symbolShape: "circle",
                itemTextColor: theme.palette.text.primary,
              },
            ]}
          />
        </div>
      </Paper>

      {/* COMPACT LIST: TOTAL SPEND PER MONTH + TOP INSIGHTS */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Total spend per måned
              </Typography>

              <Box sx={{ mt: 1 }}>
                {(monthlySpend?.length ? monthlySpend : []).slice(-12).map((m) => (
                  <Box
                    key={m.month}
                    sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mb: 0.75 }}
                  >
                    <Typography variant="body2">{m.month}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {formatCurrency(m.totalSpend)}
                    </Typography>
                  </Box>
                ))}

                {!monthlySpend?.length && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Ingen månedlige data tilgjengelig.
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {top?.shopMostOften && (
                  <Chip label={`Mest kjøpt: ${top.shopMostOften.name} (${top.shopMostOften.purchases})`} />
                )}
                {top?.shopCheapestAvg && (
                  <Chip
                    variant="outlined"
                    label={`Billigst snitt: ${top.shopCheapestAvg.name} (${top.shopCheapestAvg.avgPricePerUnit.toFixed(
                      2
                    )} kr/enhet)`}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3} sx={{ height: "100%" }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">
                Prognose & tilbud
              </Typography>

              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Sist kjøpt:</strong>{" "}
                {freq?.lastPurchaseDate ? dayjs(freq.lastPurchaseDate).format("DD. MMM YYYY") : "—"}
              </Typography>

              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>Median intervall:</strong>{" "}
                {Number.isFinite(freq?.medianGapDays) ? `${Math.round(freq.medianGapDays)} dager` : "—"}
              </Typography>

              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>Neste kjøp (est.):</strong>{" "}
                {freq?.nextPurchaseDate ? dayjs(freq.nextPurchaseDate).format("DD. MMM YYYY") : "—"}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="body2">
                <strong>Rabattkjøp:</strong> {discount?.discountedPurchases ?? 0}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>Spart totalt:</strong> {formatCurrency(discount?.totalSavings ?? 0)}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                <strong>Sparerate:</strong> {fmtPct(discount?.savingsRate)}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {top?.brandMostOften && (
                  <Chip label={`Vanligste merke: ${top.brandMostOften.name} (${top.brandMostOften.purchases})`} />
                )}
                {top?.brandCheapestAvg && (
                  <Chip
                    variant="outlined"
                    label={`Billigst merke: ${top.brandCheapestAvg.name} (${top.brandCheapestAvg.avgPricePerUnit.toFixed(
                      2
                    )} kr/enhet)`}
                  />
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* EXISTING STATS SECTION (cheapest/most expensive + averages) */}
      {stats && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Billigste registrering
                </Typography>
                <Typography variant="h4" color="success.main">
                  {formatCurrency(stats.cheapestRecord.pricePerUnit)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>{stats.cheapestRecord.shopName}</strong> ({stats.cheapestRecord.brandName})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(stats.cheapestRecord.date).format("DD. MMM YYYY")}
                  {stats.cheapestRecord.hasDiscount && " (Tilbud)"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Dyreste registrering
                </Typography>
                <Typography variant="h4" color="error.main">
                  {formatCurrency(stats.mostExpensiveRecord.pricePerUnit)}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  <strong>{stats.mostExpensiveRecord.shopName}</strong> ({stats.mostExpensiveRecord.brandName})
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(stats.mostExpensiveRecord.date).format("DD. MMM YYYY")}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={3} sx={{ height: "100%" }}>
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  Snittpris per butikk
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {stats.shopStats.map((shop) => (
                    <Box
                      key={shop.name}
                      sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
                    >
                      <Typography variant="body2">{shop.name}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(shop.avg)}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="overline" color="text.secondary">
                  Snittpris per merke
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {stats.brandStats.map((brand) => (
                    <Box
                      key={brand.name}
                      sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
                    >
                      <Typography variant="body2">{brand.name}</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(brand.avg)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
