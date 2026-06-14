import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Card,
  CardContent,
  LinearProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
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

const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 2,
});

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

function StatCard({ label, value, subtext, icon }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: "rgba(30, 41, 59, 0.72)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
        <Stack direction="row" justifyContent="space-between" spacing={1.5}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                mt: 0.5,
              }}
            >
              {value}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mt: 0.75,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtext}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              bgcolor: "primary.main",
              color: "primary.contrastText",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, action, children }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: "rgba(30, 41, 59, 0.62)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>
            {title}
          </Typography>
          {action}
        </Stack>

        <Box sx={{ height: 180 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function BreakdownRows({ rows = [], total = 0 }) {
  const maxValue = Math.max(...rows.map((row) => Number(row.value || 0)), 1);

  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Ingen data å vise
      </Typography>
    );
  }

  return (
    <Stack spacing={0.7}>
      {rows.slice(0, 4).map((row) => {
        const value = Number(row.value || 0);
        const pct = total > 0 ? (value / total) * 100 : 0;

        return (
          <Box key={row.name}>
            <Stack direction="row" justifyContent="space-between" spacing={1.5}>
              <Typography variant="body2" fontWeight={800} noWrap>
                {row.name}
              </Typography>
              <Typography variant="body2" fontWeight={900} sx={{ whiteSpace: "nowrap" }}>
                {NOK.format(value)}
              </Typography>
            </Stack>
            <Stack direction="row" justifyContent="space-between" spacing={1.5}>
              <Typography variant="caption" color="text.secondary">
                {row.count ?? 0} kjøp
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {pct.toFixed(0)}%
              </Typography>
            </Stack>
            <Box
              sx={{
                mt: 0.35,
                height: 5,
                borderRadius: 999,
                bgcolor: "action.selected",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  width: `${Math.max(4, (value / maxValue) * 100)}%`,
                  height: "100%",
                  borderRadius: "inherit",
                  bgcolor: "primary.main",
                }}
              />
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
}

function BreakdownColumn({ icon, title, rows, total }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.9 }}>
        <Box sx={{ color: "primary.main", display: "grid", placeItems: "center" }}>
          {icon}
        </Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 950 }}>
          {title}
        </Typography>
      </Stack>
      <BreakdownRows rows={rows} total={total} />
    </Box>
  );
}

function UsageBreakdownCard({ categories, shops, brands, locations, total }) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: "rgba(30, 41, 59, 0.62)",
        border: "1px solid rgba(148, 163, 184, 0.18)",
        height: "100%",
      }}
    >
      <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 900, mb: 0.25 }}>
          Hvor brukes pengene
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Fordelt på kategori, butikk, merke og sted.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: 1.5,
            mt: 1.5,
          }}
        >
          <BreakdownColumn
            icon={<CategoryOutlinedIcon fontSize="small" />}
            title="Kategori"
            rows={categories}
            total={total}
          />
          <BreakdownColumn
            icon={<StorefrontIcon fontSize="small" />}
            title="Butikk"
            rows={shops}
            total={total}
          />
          <BreakdownColumn
            icon={<LocalOfferOutlinedIcon fontSize="small" />}
            title="Merke"
            rows={brands}
            total={total}
          />
          <BreakdownColumn
            icon={<PlaceOutlinedIcon fontSize="small" />}
            title="Sted"
            rows={locations}
            total={total}
          />
        </Box>
      </CardContent>
    </Card>
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
        <StatCard
          label="Totale utgifter"
          value={NOK.format(stats.total)}
          subtext="Alle registrerte rader"
          icon={<ReceiptLongIcon fontSize="small" />}
        />

        <StatCard
          label="Gjennomsnitt"
          value={NOK.format(stats.average)}
          subtext="Per utgift"
          icon={<TrendingUpIcon fontSize="small" />}
        />

        <StatCard
          label="Antall transaksjoner"
          value={stats.count}
          subtext="Totalt i databasen"
          icon={<ShoppingCartIcon fontSize="small" />}
        />

        <StatCard
          label="Høyeste utgift"
          value={NOK.format(highest.value)}
          subtext={highest.name}
          icon={<StorefrontIcon fontSize="small" />}
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

        <ChartCard
          title="Utgifter over tid"
          action={
            <ToggleButtonGroup
              size="small"
              exclusive
              value={period}
              onChange={(event, value) => {
                if (value) setPeriod(value);
              }}
              sx={{
                "& .MuiToggleButton-root": {
                  px: 1.25,
                  py: 0.35,
                  textTransform: "none",
                  fontWeight: 700,
                },
              }}
            >
              <ToggleButton value="week">Uke</ToggleButton>
              <ToggleButton value="month">Måned</ToggleButton>
            </ToggleButtonGroup>
          }
        >
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
        </ChartCard>
      </Box>
    </Box>
  );
}
