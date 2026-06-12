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
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
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

const chartColors = ["#3b82f6", "#22c55e", "#8b5cf6", "#f59e0b", "#94a3b8"];

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
            lg: "0.8fr 1.2fr",
          },
          gap: 1.5,
        }}
      >
        <ChartCard title="Utgifter per butikk">
          {shopData.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={shopData}
                  innerRadius={45}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {shopData.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={chartColors[index % chartColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => NOK.format(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <Typography color="text.secondary">Ingen data å vise</Typography>
          )}
        </ChartCard>

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
