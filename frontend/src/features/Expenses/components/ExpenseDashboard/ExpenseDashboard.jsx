import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, LinearProgress, Stack, Typography, useTheme } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import StorefrontIcon from "@mui/icons-material/Storefront";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildApiUrl, requestJson } from "../../../../api/httpClient";
import KpiCard from "../../../../components/commons/DataDisplay/KpiCard";
import BreakdownList from "../../../../components/commons/DataDisplay/BreakdownList";
import SectionCard from "../../../../components/commons/Layout/SectionCard";
import SegmentedControl from "../../../../components/commons/Controls/SegmentedControl";

const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 2,
});

const kpiSx = {
  height: "100%",
};

const PERIOD_OPTIONS = [
  { value: "month", label: "Denne måneden" },
  { value: "quarter", label: "Siste 3 mnd" },
  { value: "year", label: "I år" },
  { value: "all", label: "Alt" },
];

const fetchExpenseDashboard = async (period) => {
  const url = buildApiUrl("/api/stats/expense-dashboard");
  url.searchParams.set("period", period);
  return requestJson(url);
};

const formatMonthKey = (key) => {
  const [year, month] = String(key).split("-").map(Number);
  if (!year || !month) return key;
  return new Date(year, month - 1, 1).toLocaleDateString("nb-NO", {
    month: "short",
    year: "2-digit",
  });
};

const buildDashboardSeries = (summary) => {
  const timeline = Array.isArray(summary?.timeline) ? summary.timeline : [];
  return timeline.map((item) => {
    const key = String(item.key || "");
    const isMonth = /^\d{4}-\d{2}$/.test(key);
    const date = isMonth
      ? formatMonthKey(key)
      : new Date(`${key}T00:00:00`).toLocaleDateString("nb-NO", {
          day: "2-digit",
          month: "short",
        });

    return { key, date, value: Number(item.value || 0) };
  });
};

const topShare = (rows, total) => {
  const first = rows?.[0];
  if (!first || !total) return null;
  return {
    name: first.name,
    value: Number(first.value || 0),
    pct: (Number(first.value || 0) / total) * 100,
  };
};

function UsageBreakdownCard({ categories, shops, brands, locations, total }) {
  const [breakdown, setBreakdown] = useState("categories");
  const breakdowns = {
    categories: {
      icon: <CategoryOutlinedIcon fontSize="small" />,
      title: "Kategori",
      rows: categories,
    },
    shops: {
      icon: <StorefrontIcon fontSize="small" />,
      title: "Butikk",
      rows: shops,
    },
    brands: {
      icon: <LocalOfferOutlinedIcon fontSize="small" />,
      title: "Merke",
      rows: brands,
    },
    locations: {
      icon: <PlaceOutlinedIcon fontSize="small" />,
      title: "Sted",
      rows: locations,
    },
  };
  const activeBreakdown = breakdowns[breakdown] ?? breakdowns.categories;

  return (
    <SectionCard
      title="Hvor brukes pengene"
      action={
        <SegmentedControl
          value={breakdown}
          onChange={setBreakdown}
          options={[
            { value: "categories", label: "Kategori" },
            { value: "shops", label: "Butikk" },
            { value: "brands", label: "Merke" },
            { value: "locations", label: "Sted" },
          ]}
          sx={{
            "& .MuiToggleButton-root": {
              px: 1,
              py: 0.35,
              textTransform: "none",
              fontWeight: 800,
              fontSize: 12,
            },
          }}
        />
      }
      subtitle="Fordelt på kategori, butikk, merke og sted."
    >
      <BreakdownList
        icon={activeBreakdown.icon}
        title={activeBreakdown.title}
        rows={activeBreakdown.rows}
        total={total}
        maxRows={7}
        formatValue={(value) => NOK.format(value)}
      />
    </SectionCard>
  );
}

function ActionableInsights({ total, average, count, categories, shops, brands }) {
  const topCategory = topShare(categories, total);
  const topShop = topShare(shops, total);
  const topBrand = topShare(brands, total);

  const rows = [
    topCategory
      ? {
          label: "Største kategori",
          value: topCategory.name,
          helper: `${NOK.format(topCategory.value)} · ${topCategory.pct.toFixed(0)}% av perioden`,
        }
      : null,
    topShop
      ? {
          label: "Mest brukt butikk",
          value: topShop.name,
          helper: `${NOK.format(topShop.value)} · ${topShop.pct.toFixed(0)}% av perioden`,
        }
      : null,
    topBrand
      ? {
          label: "Mest brukt merke",
          value: topBrand.name,
          helper: `${NOK.format(topBrand.value)} · ${topBrand.pct.toFixed(0)}% av perioden`,
        }
      : null,
    {
      label: "Typisk kjøp",
      value: NOK.format(average),
      helper: `${count || 0} transaksjoner i valgt periode`,
    },
  ].filter(Boolean);

  return (
    <SectionCard
      title="Innsikt"
      subtitle="Raske signaler som kan hjelpe deg å rydde i forbruket."
    >
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {rows.map((row) => (
          <Box
            key={`${row.label}-${row.value}`}
            sx={{
              p: 1.25,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.default",
              minWidth: 0,
            }}
          >
            <Typography variant="caption" color="text.secondary" fontWeight={850}>
              {row.label}
            </Typography>
            <Typography variant="body2" fontWeight={950} noWrap>
              {row.value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.helper}
            </Typography>
          </Box>
        ))}
      </Box>
    </SectionCard>
  );
}

export default function ExpenseDashboard() {
  const theme = useTheme();
  const [period, setPeriod] = useState("month");

  const { data: summary, isFetching } = useQuery({
    queryKey: ["expenses", "dashboard", period],
    queryFn: () => fetchExpenseDashboard(period),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  });

  const stats = summary?.totals ?? { total: 0, average: 0, count: 0 };
  const highest = summary?.highest ?? { value: 0, name: "Ingen" };
  const shopData = summary?.shops ?? [];
  const categoryData = summary?.categories ?? [];
  const brandData = summary?.brands ?? [];
  const locationData = summary?.locations ?? [];
  const timeData = useMemo(
    () => buildDashboardSeries(summary),
    [summary],
  );

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
      }}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={1}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={950}>
            Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Oversikt og fordeling basert på valgt periode.
          </Typography>
        </Box>
        <SegmentedControl
          value={period}
          onChange={setPeriod}
          options={PERIOD_OPTIONS}
          ariaLabel="Dashboardperiode"
          sx={{
            "& .MuiToggleButton-root": {
              px: 1,
              py: 0.35,
              textTransform: "none",
              fontWeight: 800,
            },
          }}
        />
      </Stack>

      {isFetching ? <LinearProgress /> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 1.5,
        }}
      >
        <KpiCard
          label="Totale utgifter"
          value={NOK.format(stats.total)}
          subtext="Valgt periode"
          icon={<ReceiptLongIcon fontSize="small" />}
          tone="primary"
          sx={kpiSx}
        />

        <KpiCard
          label="Gjennomsnitt"
          value={NOK.format(stats.average)}
          subtext="Per utgift"
          icon={<TrendingUpIcon fontSize="small" />}
          sx={kpiSx}
        />

        <KpiCard
          label="Antall transaksjoner"
          value={stats.count}
          subtext="I valgt periode"
          icon={<ShoppingCartIcon fontSize="small" />}
          sx={kpiSx}
        />

        <KpiCard
          label="Høyeste utgift"
          value={NOK.format(highest.value)}
          subtext={highest.name}
          icon={<StorefrontIcon fontSize="small" />}
          sx={kpiSx}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "1fr 1fr",
          },
          gap: 1.5,
        }}
      >
        <UsageBreakdownCard
          categories={categoryData}
          shops={shopData}
          brands={brandData}
          locations={locationData}
          total={stats.total}
        />

        <SectionCard
          title="Utgifter over tid"
          subtitle="Daglig eller månedlig utvikling i valgt periode."
        >
          {timeData.length ? (
            <Box sx={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient
                      id="expenseGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor={theme.palette.primary.main}
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="95%"
                        stopColor={theme.palette.primary.main}
                        stopOpacity={0.04}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                  <XAxis dataKey="date" fontSize={11} />
                  <YAxis
                    fontSize={11}
                    width={54}
                    tickFormatter={(value) => `${value} kr`}
                  />
                  <Tooltip formatter={(value) => NOK.format(value)} />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={theme.palette.primary.main}
                    fill="url(#expenseGradient)"
                    strokeWidth={2.5}
                    dot={{ r: 2.5 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                Ingen utgifter i valgt periode.
              </Typography>
            </Box>
          )}
        </SectionCard>
      </Box>

      <ActionableInsights
        total={stats.total}
        average={stats.average}
        count={stats.count}
        categories={categoryData}
        shops={shopData}
        brands={brandData}
      />
    </Box>
  );
}
