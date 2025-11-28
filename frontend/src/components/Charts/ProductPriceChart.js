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
  Chip
} from "@mui/material";
import dayjs from "dayjs";
import _ from "lodash";

// Helper to format currency
const formatCurrency = (val) => 
  new Intl.NumberFormat('no-NO', { style: 'currency', currency: 'NOK' }).format(val);

export default function ProductPriceChart({ productId }) {
  const theme = useTheme();
  // State for the toggle
  const [includeDiscounts, setIncludeDiscounts] = useState(true);

  const { data: rawData, isLoading, error } = useQuery({
    queryKey: ["stats", "priceHistory", productId],
    queryFn: () =>
      fetch(`/api/stats/price-per-unit-history?productId=${productId}`).then(
        (r) => {
          if (!r.ok) throw new Error("Network response was not ok");
          return r.json();
        }
      ),
    enabled: !!productId,
  });

  // 1. FILTER DATA based on toggle
  const filteredData = useMemo(() => {
    if (!rawData) return [];
    if (includeDiscounts) return rawData;
    // If toggle is off, filter out items that have hasDiscount = true
    return rawData.filter(item => !item.hasDiscount);
  }, [rawData, includeDiscounts]);

  // 2. CALCULATE STATISTICS
  const stats = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    // A. Cheapest Entry (Single Purchase)
    const cheapestRecord = _.minBy(filteredData, 'pricePerUnit');
    const mostExpensiveRecord = _.maxBy(filteredData, 'pricePerUnit');

    // B. Average per Shop
    const shopGroups = _.groupBy(filteredData, 'shopName');
    const shopStats = Object.entries(shopGroups).map(([shop, items]) => ({
      name: shop,
      avg: _.meanBy(items, 'pricePerUnit'),
      count: items.length
    })).sort((a, b) => a.avg - b.avg); // Sort cheapest to expensive

    // C. Average per Brand
    const brandGroups = _.groupBy(filteredData, 'brandName');
    const brandStats = Object.entries(brandGroups).map(([brand, items]) => ({
      name: brand,
      avg: _.meanBy(items, 'pricePerUnit'),
      count: items.length
    })).sort((a, b) => a.avg - b.avg);

    return {
      cheapestRecord,
      mostExpensiveRecord,
      cheapestShop: shopStats[0],
      mostExpensiveShop: shopStats[shopStats.length - 1],
      cheapestBrand: brandStats[0],
      shopStats,
      brandStats
    };
  }, [filteredData]);

  // 3. PREPARE CHART DATA
  const nivoData = useMemo(() => {
    const groupedByShop = _.groupBy(filteredData, 'shopName');
    return Object.entries(groupedByShop).map(([shopName, records]) => ({
      id: shopName,
      data: records.map((d) => ({
        x: dayjs(d.date).format("YYYY-MM-DD"),
        y: d.pricePerUnit,
        // Pass extra data for the tooltip
        hasDiscount: d.hasDiscount,
        brand: d.brandName
      })),
    }));
  }, [filteredData]);

  // --- NIVO THEME SETUP (Same as before) ---
  const nivoTheme = {
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
    grid: { line: { stroke: theme.palette.divider, strokeWidth: 1, strokeDasharray: "4 4" } },
    tooltip: { container: { background: theme.palette.background.paper, color: theme.palette.text.primary } },
    crosshair: { line: { stroke: theme.palette.text.secondary, strokeWidth: 1, strokeOpacity: 0.5 } },
  };

  if (!productId) return <Typography>Select a product above.</Typography>;
  if (isLoading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error loading history</Typography>;

  const productNameStr = rawData?.[0]?.productName || "Product";
  const measurementUnit = rawData?.[0]?.measurementUnit || "unit";

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5">
            {productNameStr} — Prisutvikling
          </Typography>
          <FormControlLabel
            control={
              <Switch 
                checked={includeDiscounts} 
                onChange={(e) => setIncludeDiscounts(e.target.checked)} 
              />
            }
            label="Inkluder tilbudspriser"
          />
        </Box>

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
            useMesh={true}
            enableSlices="x"
            pointSize={8}
            pointBorderWidth={2}
            pointColor={{ theme: 'background' }}
            pointBorderColor={{ from: 'serieColor' }}
            // Custom Symbol for discounts?
            // You can use 'layers' prop in Nivo for advanced conditional symbols, 
            // but pointLabel is simpler for now.
            
            tooltip={({ point }) => (
              <div
                style={{
                  background: theme.palette.background.paper,
                  color: theme.palette.text.primary,
                  padding: "9px",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: "4px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                }}
              >
                <strong>{point.serieId}</strong>
                <br />
                {dayjs(point.data.x).format("DD. MMM YYYY")}
                <br />
                <Typography variant="body2" component="span" fontWeight="bold">
                  {Number(point.data.y).toFixed(2)} kr
                </Typography>
                {' '}per {measurementUnit}
                <br />
                <Typography variant="caption" color="text.secondary">
                  Brand: {point.data.brand}
                </Typography>
                {point.data.hasDiscount && (
                   <Chip label="Tilbud!" color="success" size="small" sx={{ ml: 1, height: 20, fontSize: '0.6rem' }} />
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
                itemWidth: 80,
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

      {/* STATISTICS SECTION */}
      {stats && (
        <Grid container spacing={3}>
            {/* 1. Cheapest Record Card */}
            <Grid item xs={12} md={4}>
                <Card elevation={3} sx={{ height: '100%' }}>
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

            {/* 2. Most Expensive Record Card */}
            <Grid item xs={12} md={4}>
                <Card elevation={3} sx={{ height: '100%' }}>
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

            {/* 3. Averages List */}
            <Grid item xs={12} md={4}>
                <Card elevation={3} sx={{ height: '100%' }}>
                    <CardContent>
                        <Typography variant="overline" color="text.secondary">
                            Snittpris per butikk
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            {stats.shopStats.map((shop) => (
                                <Box key={shop.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
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
                                <Box key={brand.name} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
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