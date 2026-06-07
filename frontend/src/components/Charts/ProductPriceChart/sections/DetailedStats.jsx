import React from "react";
import { Grid, Card, CardContent, Typography, Box, Divider } from "@mui/material";
import dayjs from "dayjs";
import { formatCurrency } from "../utils/format";

const StatList = ({ rows }) => (
  <Box sx={{ mt: 1, maxHeight: 150, overflow: "auto", pr: 1, display: "grid", gap: 0.5 }}>
    {rows.map((row) => (
      <Box
        key={row.name}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          py: 0.45,
        }}
      >
        <Typography variant="body2" sx={{ minWidth: 0 }}>
          {row.name}{" "}
          {row.count != null && (
            <Typography component="span" variant="caption" color="text.secondary">
              ({row.count})
            </Typography>
          )}
        </Typography>
        <Typography variant="body2" fontWeight={800} sx={{ whiteSpace: "nowrap" }}>
          {formatCurrency(row.avg)}
        </Typography>
      </Box>
    ))}
  </Box>
);

export default function DetailedStats({ stats }) {
  if (!stats) return null;

  const cheapestVariant = stats?.variantStats?.[0] ?? null;
  const mostExpensiveVariant =
    stats?.variantStats?.length ? stats.variantStats[stats.variantStats.length - 1] : null;

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Billigste registrering
            </Typography>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 900, mt: 0.5 }}>
              {formatCurrency(stats.cheapestRecord?.pricePerUnit)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>{stats.cheapestRecord?.shopName}</strong> ({stats.cheapestRecord?.brandName})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.cheapestRecord?.date ? dayjs(stats.cheapestRecord.date).format("DD. MMM YYYY") : "—"}
              {stats.cheapestRecord?.hasDiscount && " (Tilbud)"}
              {stats.cheapestRecord?.variantName ? ` · ${stats.cheapestRecord.variantName}` : ""}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Dyreste registrering
            </Typography>
            <Typography variant="h4" color="error.main" sx={{ fontWeight: 900, mt: 0.5 }}>
              {formatCurrency(stats.mostExpensiveRecord?.pricePerUnit)}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>{stats.mostExpensiveRecord?.shopName}</strong> ({stats.mostExpensiveRecord?.brandName})
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.mostExpensiveRecord?.date ? dayjs(stats.mostExpensiveRecord.date).format("DD. MMM YYYY") : "—"}
              {stats.mostExpensiveRecord?.variantName ? ` · ${stats.mostExpensiveRecord.variantName}` : ""}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
          <CardContent>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Snittpriser
            </Typography>

            <Typography variant="subtitle2" sx={{ mt: 1.25 }}>
              Per butikk
            </Typography>
            <StatList rows={stats.shopStats} />

            <Divider sx={{ my: 1.75 }} />

            <Typography variant="subtitle2">Per merke</Typography>
            <StatList rows={stats.brandStats} />

            {!!stats.variantStats?.length && (
              <>
                <Divider sx={{ my: 1.75 }} />

                <Typography variant="subtitle2">Per variant</Typography>

                <Box sx={{ mt: 0.75, display: "grid", gap: 0.5 }}>
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

                <StatList rows={stats.variantStats} />
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
