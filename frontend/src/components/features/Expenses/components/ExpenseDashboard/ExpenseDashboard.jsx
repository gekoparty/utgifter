import React, { useMemo, useState } from "react";
import {
  Box,
  Card,
  CardContent,
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

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

export default function ExpenseDashboard({
  expenses = [],
  totalRowCount = 0,
}) {
  const theme = useTheme();
  const [period, setPeriod] = useState("week");

  const filteredByPeriod = useMemo(() => {
    const now = startOfDay(new Date());
    const daysBack = period === "week" ? 7 : 30;

    const from = new Date(now);
    from.setDate(from.getDate() - daysBack + 1);

    return expenses.filter((item) => {
      if (!item.purchaseDate) return false;
      const date = startOfDay(item.purchaseDate);
      if (!date) return false;
      return date >= from && date <= now;
    });
  }, [expenses, period]);

  const stats = useMemo(() => {
    const total = expenses.reduce(
      (sum, item) => sum + Number(item.finalPrice || item.price || 0),
      0,
    );

    const average = expenses.length ? total / expenses.length : 0;

    const highest = expenses.reduce(
      (max, item) => {
        const value = Number(item.finalPrice || item.price || 0);
        return value > max.value
          ? { value, name: item.productName || "Ukjent produkt" }
          : max;
      },
      { value: 0, name: "Ingen" },
    );

    return { total, average, highest };
  }, [expenses]);

  const shopData = useMemo(() => {
    const grouped = expenses.reduce((acc, item) => {
      const shop = item.shopName || "Ukjent";
      const value = Number(item.finalPrice || item.price || 0);
      acc[shop] = (acc[shop] || 0) + value;
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [expenses]);

  const timeData = useMemo(() => {
    const days = period === "week" ? 7 : 30;
    const today = startOfDay(new Date());

    const base = Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - 1 - index));

      const key = date.toISOString().slice(0, 10);
      const label = date.toLocaleDateString("nb-NO", {
        day: "2-digit",
        month: "short",
      });

      return { key, date: label, value: 0 };
    });

    const byKey = Object.fromEntries(base.map((item) => [item.key, item]));

    filteredByPeriod.forEach((item) => {
      if (!item.purchaseDate) return;

      const date = startOfDay(item.purchaseDate);
      if (!date) return;

      const key = date.toISOString().slice(0, 10);
      const value = Number(item.finalPrice || item.price || 0);

      if (byKey[key]) {
        byKey[key].value += value;
      }
    });

    return base;
  }, [filteredByPeriod, period]);

  return (
    <Box
      sx={{
        borderRadius: 4,
        p: 2,
        bgcolor: "rgba(15, 23, 42, 0.78)",
        border: "1px solid rgba(148, 163, 184, 0.16)",
      }}
    >
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
          subtext="Synlige rader"
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
          value={totalRowCount}
          subtext={`${expenses.length} vist nå`}
          icon={<ShoppingCartIcon fontSize="small" />}
        />

        <StatCard
          label="Høyeste utgift"
          value={NOK.format(stats.highest.value)}
          subtext={stats.highest.name}
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
