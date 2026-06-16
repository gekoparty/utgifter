import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Box, LinearProgress, useTheme } from "@mui/material";
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

const dashboardPanelSx = {
  bgcolor: "rgba(30, 41, 59, 0.62)",
  borderColor: "rgba(148, 163, 184, 0.18)",
};

const kpiSx = {
  bgcolor: "rgba(30, 41, 59, 0.72)",
  borderColor: "rgba(148, 163, 184, 0.18)",
  height: "100%",
};

const startOfDay = (date) => {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
};

const fetchExpenseDashboard = async (period) => {
  const url = buildApiUrl("/api/stats/expense-dashboard");
  url.searchParams.set("period", period);
  return requestJson(url);
};

const toLocalDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const buildDashboardSeries = (summary, period) => {
  const days = period === "week" ? 7 : 30;
  const today = startOfDay(new Date());
  const values = new Map(
    (summary?.timeline ?? []).map((item) => [item.key, Number(item.value || 0)]),
  );

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (days - 1 - index));

    const key = toLocalDateKey(date);
    const label = date.toLocaleDateString("nb-NO", {
      day: "2-digit",
      month: "short",
    });

    return { key, date: label, value: values.get(key) || 0 };
  });
};

function UsageBreakdownCard({ categories, shops, brands, locations, total }) {
  return (
    <SectionCard
      title="Hvor brukes pengene"
      subtitle="Fordelt på kategori, butikk, merke og sted."
      sx={dashboardPanelSx}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1.5,
        }}
      >
        <BreakdownList
          icon={<CategoryOutlinedIcon fontSize="small" />}
          title="Kategori"
          rows={categories}
          total={total}
          formatValue={(value) => NOK.format(value)}
        />
        <BreakdownList
          icon={<StorefrontIcon fontSize="small" />}
          title="Butikk"
          rows={shops}
          total={total}
          formatValue={(value) => NOK.format(value)}
        />
        <BreakdownList
          icon={<LocalOfferOutlinedIcon fontSize="small" />}
          title="Merke"
          rows={brands}
          total={total}
          formatValue={(value) => NOK.format(value)}
        />
        <BreakdownList
          icon={<PlaceOutlinedIcon fontSize="small" />}
          title="Sted"
          rows={locations}
          total={total}
          formatValue={(value) => NOK.format(value)}
        />
      </Box>
    </SectionCard>
  );
}

export default function ExpenseDashboard() {
  const theme = useTheme();
  const [period, setPeriod] = useState("week");

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
    () => buildDashboardSeries(summary, period),
    [summary, period],
  );

  return (
    <Box
      sx={{
        borderRadius: 4,
        p: 2,
        bgcolor: "rgba(15, 23, 42, 0.78)",
        border: "1px solid rgba(148, 163, 184, 0.16)",
      }}
    >
      {isFetching ? <LinearProgress sx={{ mb: 1.5 }} /> : null}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 1.5,
          mb: 1.5,
        }}
      >
        <KpiCard
          label="Totale utgifter"
          value={NOK.format(stats.total)}
          subtext="Alle registrerte rader"
          icon={<ReceiptLongIcon fontSize="small" />}
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
          subtext="Totalt i databasen"
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
          action={
            <SegmentedControl
              value={period}
              onChange={setPeriod}
              options={[
                { value: "week", label: "Uke" },
                { value: "month", label: "Måned" },
              ]}
              sx={{
                "& .MuiToggleButton-root": {
                  px: 1.25,
                  py: 0.35,
                  textTransform: "none",
                  fontWeight: 700,
                },
              }}
            />
          }
          sx={dashboardPanelSx}
        >
          <Box sx={{ height: 180 }}>
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

                <CartesianGrid strokeDasharray="3 3" opacity={0.14} />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis
                  fontSize={11}
                  width={46}
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
        </SectionCard>
      </Box>
    </Box>
  );
}
