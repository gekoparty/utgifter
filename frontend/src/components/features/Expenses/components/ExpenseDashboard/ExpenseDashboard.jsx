// src/components/features/Expenses/components/ExpenseDashboard/ExpenseDashboard.jsx
import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
});

const COLORS = ["#3b82f6", "#8b5cf6", "#22c55e", "#f59e0b", "#94a3b8"];

const StatCard = ({ title, value, subtitle, icon }) => (
  <Card
    sx={{
      minWidth: 0,
      height: "100%",
      borderRadius: 4,
      background:
        "linear-gradient(135deg, rgba(35,42,68,.96), rgba(18,23,38,.96))",
      border: "1px solid rgba(255,255,255,.08)",
      boxShadow: "0 18px 45px rgba(0,0,0,.25)",
    }}
  >
    <CardContent>
      <Stack direction="row" justifyContent="space-between" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" variant="body2" noWrap>
            {title}
          </Typography>

          <Typography
            variant="h4"
            fontWeight={900}
            sx={{
              mt: 1,
              lineHeight: 1.1,
              wordBreak: "break-word",
            }}
          >
            {value}
          </Typography>

          <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        </Box>

        <Box
          sx={{
            flexShrink: 0,
            width: 44,
            height: 44,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            boxShadow: "0 10px 25px rgba(47, 102, 246, .35)",
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, children }) => (
  <Card
    sx={{
      borderRadius: 4,
      minHeight: 340,
      background:
        "linear-gradient(135deg, rgba(30,36,58,.94), rgba(16,21,34,.94))",
      border: "1px solid rgba(255,255,255,.08)",
      boxShadow: "0 18px 45px rgba(0,0,0,.25)",
    }}
  >
    <CardContent sx={{ height: "100%" }}>
      <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const ExpenseDashboard = ({ expenses = [], totalRowCount = 0, onAdd }) => {
  const stats = useMemo(() => {
    const total = expenses.reduce(
      (sum, x) => sum + Number(x.finalPrice || 0),
      0,
    );

    const average = expenses.length ? total / expenses.length : 0;

    const highest = expenses.reduce(
      (max, x) =>
        Number(x.finalPrice || 0) > Number(max.finalPrice || 0) ? x : max,
      expenses[0] || {},
    );

    return { total, average, highest };
  }, [expenses]);

  const chartData = useMemo(() => {
    const map = new Map();

    expenses.forEach((x) => {
      const key = x.purchaseDate
        ? new Date(x.purchaseDate).toLocaleDateString("nb-NO", {
            day: "2-digit",
            month: "short",
          })
        : "Ukjent";

      map.set(key, (map.get(key) || 0) + Number(x.finalPrice || 0));
    });

    return Array.from(map.entries()).map(([date, amount]) => ({
      date,
      amount,
    }));
  }, [expenses]);

  const categoryData = useMemo(() => {
    const map = new Map();

    expenses.forEach((x) => {
      const key = x.shopName || "Ukjent";
      map.set(key, (map.get(key) || 0) + Number(x.finalPrice || 0));
    });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [expenses]);

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "flex-start" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900}>
            Utgifter
          </Typography>
          <Typography color="text.secondary">
            Oversikt og håndtering av dine utgifter
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={onAdd}
          sx={{
            borderRadius: 999,
            px: 4,
            py: 1.5,
            alignSelf: { xs: "stretch", md: "flex-start" },
            fontWeight: 800,
          }}
        >
          Legg til ny utgift
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 2,
        }}
      >
        <StatCard
          title="Totale utgifter"
          value={NOK.format(stats.total)}
          subtitle="Synlige rader"
          icon={<ReceiptLongIcon />}
        />

        <StatCard
          title="Gjennomsnitt"
          value={NOK.format(stats.average)}
          subtitle="Per utgift"
          icon={<TrendingUpIcon />}
        />

        <StatCard
          title="Antall transaksjoner"
          value={totalRowCount || expenses.length}
          subtitle={`${expenses.length} vist nå`}
          icon={<ShoppingCartIcon />}
        />

        <StatCard
          title="Høyeste utgift"
          value={NOK.format(stats.highest?.finalPrice || 0)}
          subtitle={stats.highest?.productName || "Ingen data"}
          icon={<TrendingUpIcon />}
        />
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(360px, 0.8fr) minmax(0, 1.2fr)",
          },
          gap: 2,
        }}
      >
        <ChartCard title="Utgifter per butikk">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={categoryData}
                dataKey="value"
                nameKey="name"
                innerRadius={75}
                outerRadius={110}
                paddingAngle={4}
              >
                {categoryData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => NOK.format(value)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Utgifter over tid">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis tickFormatter={(v) => `${v} kr`} />
              <Tooltip formatter={(value) => NOK.format(value)} />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.22}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </Box>
    </Box>
  );
};

export default React.memo(ExpenseDashboard);