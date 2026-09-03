import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import { formatCurrency } from "../utils/format";

const StatList = ({ rows }) => (
  <Box sx={{ mt: 0.8, maxHeight: 110, overflow: "auto", pr: 1, display: "grid", gap: 0.35 }}>
    {rows.map((row) => (
      <Box
        key={row.name}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          py: 0.35,
        }}
      >
            <Typography variant="caption" sx={{ minWidth: 0 }} noWrap title={row.name}>
          {row.name}{" "}
          {row.count != null && (
            <Typography component="span" variant="caption" color="text.secondary">
              ({row.count})
            </Typography>
          )}
        </Typography>
        <Typography variant="caption" fontWeight={850} sx={{ whiteSpace: "nowrap" }}>
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
    <Card variant="outlined" sx={{ mt: 1.5, borderRadius: 2 }}>
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
            maxHeight: { xs: 460, xl: 560 },
            overflow: "auto",
            pb: 0.5,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1.5,
          }}
        >
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `minmax(160px, 200px) repeat(${matrix.shops.length}, minmax(118px, 150px))`,
              gap: 0,
              minWidth: 200 + matrix.shops.length * 122,
            }}
          >
            <Box
              sx={{
                position: "sticky",
                left: 0,
                top: 0,
                zIndex: 4,
                bgcolor: "background.paper",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            />
            {matrix.shops.map((shopName) => (
              <Typography
                key={shopName}
                variant="caption"
                color="text.secondary"
                sx={{
                  position: "sticky",
                  top: 0,
                  zIndex: 3,
                  fontWeight: 900,
                  px: 1,
                  py: 0.8,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  bgcolor: "background.paper",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
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
                    bgcolor: "background.default",
                    borderRight: 1,
                    borderBottom: 1,
                    borderColor: "divider",
                    minWidth: 0,
                    minHeight: 72,
                    position: "sticky",
                    left: 0,
                    zIndex: 2,
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
                        borderRight: "1px solid",
                        borderBottom: "1px solid",
                        borderColor: "divider",
                        minHeight: 72,
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
    <Card variant="outlined" sx={{ mt: 1.5, borderRadius: 2 }}>
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
  const RecordCard = ({ label, record, tone }) => (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
          {label}
        </Typography>
        <Typography
          variant="h4"
          color={tone === "cheap" ? "success.main" : "error.main"}
          sx={{ fontWeight: 900, mt: 0.5, lineHeight: 1.05 }}
        >
          {formatCurrency(record?.pricePerUnit)}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1 }} noWrap title={`${record?.shopName || ""} (${record?.brandName || ""})`}>
          <strong>{record?.shopName}</strong> ({record?.brandName})
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
          {record?.date ? dayjs(record.date).format("DD. MMM YYYY") : "—"}
          {record?.hasDiscount && " (Tilbud)"}
          {record?.variantName ? ` · ${record.variantName}` : ""}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <>
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        alignItems: "start",
      }}
    >
      <RecordCard label="Billigste registrering" record={stats.cheapestRecord} tone="cheap" />
      <RecordCard label="Dyreste registrering" record={stats.mostExpensiveRecord} tone="expensive" />

      <Box sx={{ gridColumn: "1 / -1" }}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
            <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 0 }}>
              Snittpriser
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                mt: 1.25,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  xl: "repeat(4, minmax(0, 1fr))",
                },
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">Per butikk</Typography>
                <StatList rows={stats.shopStats} />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">Per merke</Typography>
                <StatList rows={stats.brandStats} />
              </Box>

              {!!stats.locationStats?.length && (
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2">Per sted</Typography>
                  <StatList rows={stats.locationStats} />
                </Box>
              )}

              {!!stats.variantStats?.length && (
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2">Per variant</Typography>
                  <Box sx={{ mt: 0.5, display: "grid", gap: 0.25 }}>
                    {cheapestVariant && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Billigst: <strong>{cheapestVariant.name}</strong> ({formatCurrency(cheapestVariant.avg)})
                      </Typography>
                    )}
                    {mostExpensiveVariant && (
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Dyrest: <strong>{mostExpensiveVariant.name}</strong> ({formatCurrency(mostExpensiveVariant.avg)})
                      </Typography>
                    )}
                  </Box>
                  <StatList rows={stats.variantStats} />
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>

    <BestVariantList rows={stats.variantShopMatrix?.rows} />
    <VariantShopMatrix matrix={stats.variantShopMatrix} />
    </>
  );
}
