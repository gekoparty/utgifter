import React from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Stack,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
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

const priceTone = ({ value, min, max, theme }) => {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return {
      bgcolor: "background.default",
      borderColor: "divider",
      color: "text.secondary",
    };
  }

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const baseColor = ratio < 0.34 ? theme.palette.success.main : ratio < 0.67 ? theme.palette.warning.main : theme.palette.error.main;

  return {
    bgcolor: alpha(baseColor, theme.palette.mode === "dark" ? 0.18 : 0.12),
    borderColor: alpha(baseColor, 0.42),
    color: "text.primary",
  };
};

const recencyLabel = (date) => {
  if (!date || !dayjs(date).isValid()) return "Ukjent dato";
  const days = dayjs().diff(dayjs(date), "day");
  if (days <= 31) return "nylig";
  if (days <= 180) return `${Math.max(1, Math.round(days / 30))} mnd siden`;
  if (days <= 365) return `${Math.max(1, Math.round(days / 30))} mnd siden`;
  return `${Math.max(1, Math.round(days / 365))} år siden`;
};

const isStalePrice = (date) => {
  if (!date || !dayjs(date).isValid()) return true;
  return dayjs().diff(dayjs(date), "day") > 365;
};

const VariantShopMatrix = ({ matrix }) => {
  const theme = useTheme();
  if (!matrix?.rows?.length || !matrix?.shops?.length) return null;

  return (
    <Card variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={1}
          sx={{ mb: 1.5 }}
        >
          <Box>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Butikk x variant
            </Typography>
            <Typography variant="h6" fontWeight={950} sx={{ lineHeight: 1.15 }}>
              Siste pris per butikk og variant
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Chip size="small" label={`${matrix.totalVariantCount} varianter`} variant="outlined" />
            <Chip size="small" label={`${matrix.totalShopCount} butikker`} variant="outlined" />
          </Stack>
        </Stack>

        <Box
          sx={{
            overflowX: "auto",
            pb: 0.5,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `minmax(170px, 220px) repeat(${matrix.shops.length}, minmax(126px, 1fr))`,
              gap: 0.75,
              minWidth: 220 + matrix.shops.length * 132,
            }}
          >
            <Box />
            {matrix.shops.map((shopName) => (
              <Typography
                key={shopName}
                variant="caption"
                color="text.secondary"
                sx={{ fontWeight: 900, px: 0.75, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
                title={shopName}
              >
                {shopName}
              </Typography>
            ))}

            {matrix.rows.map((row) => (
              <React.Fragment key={row.variantName}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: "background.default",
                    border: 1,
                    borderColor: "divider",
                    minWidth: 0,
                  }}
                >
                  <Typography fontWeight={950} noWrap title={row.variantName}>
                    {row.variantName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.count} kjøp
                  </Typography>
                </Box>

                {row.cells.map((cell) => {
                  const stale = isStalePrice(cell.date);
                  const bestTarget = row.bestRecentCell || row.bestCell;
                  const isBest =
                    bestTarget?.shopName === cell.shopName &&
                    Number.isFinite(row.bestRecentCell ? cell.latest : cell.avg);
                  const tone = priceTone({
                    value: cell.latest,
                    min: matrix.minPrice,
                    max: matrix.maxPrice,
                    theme,
                  });

                  return (
                    <Box
                      key={`${row.variantName}-${cell.shopName}`}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        border: 1,
                        minHeight: 64,
                        ...tone,
                        opacity: stale ? 0.62 : 1,
                        outline: isBest ? `2px solid ${theme.palette.success.main}` : "none",
                        outlineOffset: -2,
                      }}
                    >
                      {Number.isFinite(cell.latest) ? (
                        <>
                          <Typography fontWeight={950} sx={{ lineHeight: 1.1 }}>
                            {formatCurrency(cell.latest)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {recencyLabel(cell.date)}
                            {isBest ? (row.bestRecentCell ? " · billigst nå" : " · billigst historisk") : ""}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Snitt {formatCurrency(cell.avg)} · {cell.count} kjøp
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Ingen kjøp
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </React.Fragment>
            ))}
          </Box>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
          Viser siste registrerte pris i hver butikk. Priser eldre enn 12 måneder tones ned, så gamle kjøp ikke ser ut som dagens beste pris.
        </Typography>
      </CardContent>
    </Card>
  );
};

const BestVariantList = ({ rows }) => {
  const bestRows = (rows || []).filter((row) => row.bestRecentCell || row.bestCell).slice(0, 8);
  if (!bestRows.length) return null;

  return (
    <Card variant="outlined" sx={{ mt: 2, borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
          Rask oversikt
        </Typography>
        <Typography variant="h6" fontWeight={950} sx={{ lineHeight: 1.15, mb: 1.25 }}>
          Billigste butikk per variant
        </Typography>

        <Box sx={{ display: "grid", gap: 0.75 }}>
          {bestRows.map((row) => {
            const best = row.bestRecentCell || row.bestCell;
            const historicalOnly = !row.bestRecentCell;
            return (
            <Box
              key={row.variantName}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
                gap: 1,
                alignItems: "center",
                p: 1,
                borderRadius: 1.5,
                bgcolor: "background.default",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={900} noWrap title={row.variantName}>
                  {row.variantName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {best.shopName} · {recencyLabel(best.date)}
                  {historicalOnly ? " · bare historisk" : ""}
                </Typography>
              </Box>
              <Typography fontWeight={950} color="success.main" sx={{ whiteSpace: "nowrap" }}>
                {formatCurrency(best.latest ?? best.avg)}
              </Typography>
            </Box>
          );
          })}
        </Box>
      </CardContent>
    </Card>
  );
};

export default function DetailedStats({ stats }) {
  if (!stats) return null;

  const cheapestVariant = stats?.variantStats?.[0] ?? null;
  const mostExpensiveVariant =
    stats?.variantStats?.length ? stats.variantStats[stats.variantStats.length - 1] : null;

  return (
    <>
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
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

      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
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

      <Grid size={{ xs: 12, md: 4 }}>
        <Card variant="outlined" sx={{ height: "100%", borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
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

            {!!stats.locationStats?.length && (
              <>
                <Divider sx={{ my: 1.75 }} />
                <Typography variant="subtitle2">Per sted</Typography>
                <StatList rows={stats.locationStats} />
              </>
            )}

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

    <VariantShopMatrix matrix={stats.variantShopMatrix} />
    <BestVariantList rows={stats.variantShopMatrix?.rows} />
    </>
  );
}
