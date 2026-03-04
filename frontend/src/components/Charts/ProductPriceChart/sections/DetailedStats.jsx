// src/components/Charts/ProductPriceChart/sections/DetailedStats.jsx
import React from "react";
import { Grid, Card, CardContent, Typography, Box, Divider } from "@mui/material";
import dayjs from "dayjs";
import { formatCurrency } from "../utils/format";

export default function DetailedStats({ stats }) {
  if (!stats) return null;

  const cheapestVariant = stats?.variantStats?.[0] ?? null;
  const mostExpensiveVariant =
    stats?.variantStats?.length ? stats.variantStats[stats.variantStats.length - 1] : null;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card elevation={3} sx={{ height: "100%" }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary">
              Billigste registrering
            </Typography>
            <Typography variant="h4" color="success.main">
              {formatCurrency(stats.cheapestRecord?.pricePerUnit)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>{stats.cheapestRecord?.shopName}</strong> ({stats.cheapestRecord?.brandName})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.cheapestRecord?.date ? dayjs(stats.cheapestRecord.date).format("DD. MMM YYYY") : "—"}
              {stats.cheapestRecord?.hasDiscount && " (Tilbud)"}
              {stats.cheapestRecord?.variantName ? ` — ${stats.cheapestRecord.variantName}` : ""}
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
              {formatCurrency(stats.mostExpensiveRecord?.pricePerUnit)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>{stats.mostExpensiveRecord?.shopName}</strong> ({stats.mostExpensiveRecord?.brandName})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.mostExpensiveRecord?.date ? dayjs(stats.mostExpensiveRecord.date).format("DD. MMM YYYY") : "—"}
              {stats.mostExpensiveRecord?.variantName ? ` — ${stats.mostExpensiveRecord.variantName}` : ""}
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
            <Box sx={{ mt: 1, maxHeight: 140, overflow: "auto", pr: 1 }}>
              {stats.shopStats.map((shop) => (
                <Box key={shop.name} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
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
            <Box sx={{ mt: 1, maxHeight: 140, overflow: "auto", pr: 1 }}>
              {stats.brandStats.map((brand) => (
                <Box key={brand.name} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2">{brand.name}</Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {formatCurrency(brand.avg)}
                  </Typography>
                </Box>
              ))}
            </Box>

            {!!stats.variantStats?.length && (
              <>
                <Divider sx={{ my: 2 }} />

                <Typography variant="overline" color="text.secondary">
                  Snittpris per variant
                </Typography>

                <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {cheapestVariant && (
                    <Typography variant="caption" color="text.secondary">
                      Billigst: <strong>{cheapestVariant.name}</strong> ({formatCurrency(cheapestVariant.avg)})
                    </Typography>
                  )}
                  {mostExpensiveVariant && (
                    <Typography variant="caption" color="text.secondary">
                      Dyrest: <strong>{mostExpensiveVariant.name}</strong> ({formatCurrency(mostExpensiveVariant.avg)})
                    </Typography>
                  )}
                </Box>

                <Box sx={{ mt: 1, maxHeight: 160, overflow: "auto", pr: 1 }}>
                  {stats.variantStats.map((v) => (
                    <Box key={v.name} sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <Typography variant="body2">
                        {v.name} <span style={{ opacity: 0.7 }}>({v.count})</span>
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {formatCurrency(v.avg)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}