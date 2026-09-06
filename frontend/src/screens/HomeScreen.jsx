import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import dayjs from "dayjs";

import { buildApiUrl, requestJson } from "../api/httpClient";
import AppScreen from "../components/commons/Layout/AppScreen";
import SectionCard from "../components/commons/Layout/SectionCard";
import BreakdownList from "../components/commons/DataDisplay/BreakdownList";
import DecisionLabel from "../components/commons/DataDisplay/DecisionLabel";
import { buildPaginatedUrl } from "../components/commons/EntityTableScreen/buildPaginatedUrl";

const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 2,
});

const monthKeyNow = () => dayjs().format("YYYY-MM");

const monthLabel = (monthKey) => {
  const date = dayjs(`${monthKey}-01`);
  return date.isValid() ? date.format("MMMM YYYY") : monthKey;
};

const formatDate = (value) => {
  if (!value) return "";
  const date = dayjs(value);
  return date.isValid() ? date.format("DD. MMM YYYY") : String(value);
};

const getFixedActualForMonth = (summary, monthKey) => {
  const month = (summary?.forecast || []).find((item) => item.key === monthKey);
  return Number(month?.paidTotal || 0);
};

const getFixedMonth = (summary, monthKey) =>
  (summary?.forecast || []).find((item) => item.key === monthKey) || null;

const getUnpaidForMonth = (summary, monthKey) => {
  const month = (summary?.forecast || []).find((item) => item.key === monthKey);
  return (month?.items || [])
    .filter((item) => item.status === "UNPAID")
    .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf());
};

const fetchMonthDashboard = async (month, signal) => {
  const url = buildApiUrl("/api/stats/expense-dashboard-v2");
  url.searchParams.set("period", "month");
  url.searchParams.set("month", month);
  return requestJson(url, { signal });
};

const fetchRecurringSummary = async (month, signal) => {
  const selected = dayjs(`${month}-01`);
  const current = dayjs().startOf("month");
  const pastMonths = Math.max(0, current.diff(selected, "month"));
  const monthsForward = Math.max(3, selected.diff(current, "month") + 1);

  const url = buildApiUrl("/api/recurring-expenses/summary");
  url.searchParams.set("filter", "ALL");
  url.searchParams.set("pastMonths", String(Math.min(24, pastMonths)));
  url.searchParams.set("months", String(Math.min(24, monthsForward)));
  return requestJson(url, { signal });
};

const fetchRecentExpenses = async (month, signal) => {
  const start = `${month}-01`;
  const end = dayjs(start).endOf("month").format("YYYY-MM-DD");
  const url = buildPaginatedUrl("/api/expenses", {
    pageIndex: 0,
    pageSize: 6,
    sorting: [{ id: "purchaseDate", desc: true }],
    filters: [{ id: "purchaseDate", value: [start, end] }],
    globalFilter: "",
  });
  return requestJson(url, { signal });
};

export default function HomeScreen() {
  const [selectedMonth, setSelectedMonth] = useState(monthKeyNow);

  const dashboardQuery = useQuery({
    queryKey: ["home", "dashboard", selectedMonth],
    queryFn: ({ signal }) => fetchMonthDashboard(selectedMonth, signal),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  const recurringQuery = useQuery({
    queryKey: ["home", "recurring-summary", selectedMonth],
    queryFn: ({ signal }) => fetchRecurringSummary(selectedMonth, signal),
    staleTime: 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  const recentQuery = useQuery({
    queryKey: ["home", "recent-expenses", selectedMonth],
    queryFn: ({ signal }) => fetchRecentExpenses(selectedMonth, signal),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const dashboard = dashboardQuery.data || {};
  const recurring = recurringQuery.data || {};
  const fixedMonth = getFixedMonth(recurring, selectedMonth);
  const variableExpenses = Number(dashboard?.totals?.total || 0);
  const income = Number(dashboard?.income?.totals?.total || 0);
  const expectedIncome = Number(dashboard?.income?.expected || 0);
  const fixedActual = getFixedActualForMonth(recurring, selectedMonth);
  const fixedExpected = Number(fixedMonth?.expectedMax ?? fixedMonth?.expectedMin ?? 0);
  const visibleExpenses = variableExpenses + fixedActual;
  const unpaid = useMemo(
    () => getUnpaidForMonth(recurring, selectedMonth),
    [recurring, selectedMonth],
  );
  const unpaidAmount = unpaid.reduce(
    (sum, item) => sum + Number(item.expected?.max ?? item.expected?.fixed ?? 0),
    0,
  );
  const plannedMonthExpenses = variableExpenses + fixedExpected;
  const incomeBasis = income > 0 ? income : expectedIncome;
  const remaining = incomeBasis - visibleExpenses;
  const plannedRemaining = incomeBasis - plannedMonthExpenses;
  const priceChanges = dashboard?.priceChanges || { increases: [], decreases: [] };
  const changes = [...(priceChanges.increases || []), ...(priceChanges.decreases || [])]
    .slice(0, 5);
  const recentExpenses = recentQuery.data?.expenses || [];
  const isLoading = dashboardQuery.isFetching || recurringQuery.isFetching || recentQuery.isFetching;
  const hasError = dashboardQuery.error || recurringQuery.error || recentQuery.error;

  const categoryRows = dashboard?.categories || [];
  const expenseMonthUrl = `/expenses?month=${selectedMonth}`;
  const recurringMonthUrl = `/recurring-expenses?month=${selectedMonth}`;
  const statusTone = remaining >= 0 && !unpaid.length ? "success" : unpaid.length ? "warning" : "error";
  const statusLabel =
    remaining >= 0
      ? unpaid.length
        ? `${unpaid.length} faste kostnader må følges opp`
        : "Måneden er i rute"
      : "Utgiftene er over inntekt";
  const biggestChange = changes[0];
  const actionItems = [
    remaining < 0
      ? {
          title: "Måneden går i minus",
          text: `${NOK.format(Math.abs(remaining))} over ${income > 0 ? "faktisk inntekt" : "planlagt inntekt"}.`,
          tone: "error",
          to: expenseMonthUrl,
        }
      : null,
    unpaid.length
      ? {
          title: "Faste kostnader mangler",
          text: `${unpaid.length} ubetalt, totalt cirka ${NOK.format(unpaidAmount)}.`,
          tone: "warning",
          to: recurringMonthUrl,
        }
      : null,
    biggestChange
      ? {
          title: "Prisendring å sjekke",
          text: `${biggestChange.productName}: ${Number(biggestChange.changePercent || 0) > 0 ? "+" : ""}${Number(biggestChange.changePercent || 0).toFixed(1)}%.`,
          tone: Number(biggestChange.changePercent || 0) > 0 ? "warning" : "success",
          to: "/stats",
        }
      : null,
  ].filter(Boolean);

  const toolbar = (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
    >
      <TextField
        size="small"
        type="month"
        label="Måned"
        value={selectedMonth}
        onChange={(event) => {
          if (event.target.value) setSelectedMonth(event.target.value);
        }}
        sx={{ width: { xs: "100%", sm: 190 } }}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <Button component={RouterLink} to="/expenses" variant="outlined" size="small">
          Utgifter
        </Button>
        <Button component={RouterLink} to={recurringMonthUrl} variant="outlined" size="small">
          Faste kostnader
        </Button>
        <Button component={RouterLink} to="/stats" variant="contained" size="small">
          Statistikk
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <AppScreen
      title="Hjem"
      subtitle="Månedsoversikt for inntekt, utgifter og faste kostnader."
      icon={<HomeRoundedIcon />}
      toolbar={toolbar}
      workflow={{
        question: "Hvordan ligger måneden an?",
        answer: "Start med inntekt mot synlige utgifter, sjekk ubetalte faste kostnader, og åpne detaljene bare når noe trenger oppfølging.",
        steps: ["Velg måned", "Sjekk saldo", "Følg opp avvik"],
      }}
      summaryItems={[
        { label: "Måned", value: monthLabel(selectedMonth) },
        { label: "Ubetalt", value: unpaid.length },
      ]}
      maxWidth={1480}
    >
      {isLoading ? <LinearProgress /> : null}

      {hasError ? (
        <Alert severity="error" variant="outlined">
          Kunne ikke laste hele månedsoversikten.
        </Alert>
      ) : null}

      <SectionCard
        title={`Månedskontroll: ${monthLabel(selectedMonth)}`}
        subtitle="Inntekt minus variable utgifter minus faste kostnader gir det som er igjen."
        icon={<AccountBalanceWalletRoundedIcon />}
        action={<DecisionLabel tone={statusTone} label={statusLabel} />}
        compact
        sx={{
          borderColor: statusTone === "success" ? "success.main" : statusTone === "warning" ? "warning.main" : "error.main",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr auto 1fr auto 1fr auto 1.1fr",
            },
            alignItems: "stretch",
          }}
        >
          {[
            {
              label: income > 0 ? "Faktisk inntekt" : "Planlagt inntekt",
              value: incomeBasis,
              tone: "success",
              help: income > 0 ? "Dette er faktisk registrert inntekt" : "Dette er forventet inntekt",
            },
            {
              label: "Variable utgifter",
              value: variableExpenses,
              tone: "primary",
              help: "Dette er faktisk registrerte kjøp",
              to: expenseMonthUrl,
            },
            {
              label: "Faste kostnader",
              value: fixedActual,
              tone: "default",
              help: `Betalt av forventet ${NOK.format(fixedExpected)}`,
              to: recurringMonthUrl,
            },
            {
              label: "Igjen",
              value: remaining,
              tone: remaining >= 0 ? "success" : "error",
              help: `Planlagt igjen: ${NOK.format(plannedRemaining)}`,
            },
          ].map((item, index, list) => (
            <React.Fragment key={item.label}>
              <Box
                component={item.to ? RouterLink : "div"}
                to={item.to}
                sx={{
                  p: 1.25,
                  borderRadius: 1.5,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor: "divider",
                  textDecoration: "none",
                  color: "inherit",
                  minWidth: 0,
                  "&:hover": item.to ? { borderColor: "primary.main" } : undefined,
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={900}>
                  {item.label}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    mt: 0.25,
                    fontWeight: 950,
                    color:
                      item.tone === "success"
                        ? "success.main"
                        : item.tone === "error"
                          ? "error.main"
                          : item.tone === "primary"
                            ? "primary.main"
                            : "text.primary",
                    overflowWrap: "anywhere",
                  }}
                >
                  {NOK.format(item.value)}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
                  {item.help}
                </Typography>
              </Box>
              {index < list.length - 1 ? (
                <Box
                  sx={{
                    display: { xs: "none", md: "grid" },
                    placeItems: "center",
                    color: "text.secondary",
                    fontWeight: 950,
                    px: 0.25,
                  }}
                >
                  {index === list.length - 2 ? "=" : "-"}
                </Box>
              ) : null}
            </React.Fragment>
          ))}
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1.25 }}>
          <Chip
            size="small"
            color={unpaid.length ? "warning" : "success"}
            label={
              unpaid.length
                ? `${NOK.format(unpaidAmount)} mangler i faste kostnader`
                : "Alle faste kostnader er betalt"
            }
            sx={{ fontWeight: 900 }}
          />
          <Chip
            size="small"
            color={plannedRemaining >= 0 ? "success" : "error"}
            label={`Forventet månedsslutt: ${NOK.format(plannedRemaining)}`}
            sx={{ fontWeight: 900 }}
          />
        </Stack>

        <Divider sx={{ my: 1.25 }} />

        <Box>
          <Typography variant="subtitle2" fontWeight={950} sx={{ mb: 0.75 }}>
            Hva trenger handling
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            }}
          >
            {(actionItems.length
              ? actionItems
              : [
                  {
                    title: "Ingen akutte avvik",
                    text: "Måneden ser ryddig ut med valgte data.",
                    tone: "success",
                    to: expenseMonthUrl,
                  },
                ]
            ).map((item) => (
              <Box
                key={item.title}
                component={RouterLink}
                to={item.to}
                sx={{
                  p: 1,
                  borderRadius: 1.5,
                  bgcolor: "background.default",
                  border: "1px solid",
                  borderColor:
                    item.tone === "error"
                      ? "error.main"
                      : item.tone === "warning"
                        ? "warning.main"
                        : "divider",
                  color: "inherit",
                  textDecoration: "none",
                  minWidth: 0,
                  "&:hover": { borderColor: "primary.main" },
                }}
              >
                <Typography variant="body2" fontWeight={950} noWrap>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {item.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </SectionCard>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.25fr) minmax(360px, 0.75fr)" },
          alignItems: "start",
        }}
      >
        <SectionCard
          title={remaining >= 0 || income <= 0 ? "Måneden er innenfor" : "Måneden er over inntekt"}
          subtitle={
            income > 0
              ? `Synlige utgifter er ${NOK.format(visibleExpenses)} mot inntekt på ${NOK.format(income)}.`
              : `Synlige utgifter er ${NOK.format(visibleExpenses)} mot plan på ${NOK.format(expectedIncome)}.`
          }
          action={
            <DecisionLabel
              tone={unpaid.length ? "warning" : "success"}
              label={
                unpaid.length
                  ? `Denne måneden mangler ${unpaid.length} faste kostnader`
                  : "Ingen faste kostnader mangler"
              }
            />
          }
          compact
        >
          <BreakdownList
            title="Hvor pengene går"
            rows={categoryRows}
            total={variableExpenses}
            maxRows={6}
            formatValue={(value) => NOK.format(value)}
            emptyText="Ingen variable utgifter registrert i valgt måned."
          />
        </SectionCard>

        <SectionCard
          title="Ubetalte faste kostnader"
          subtitle={unpaid.length ? "Dette bør følges opp først." : "Alt er betalt eller ingen forfall i valgt måned."}
          icon={<WarningAmberRoundedIcon />}
          action={
            <Button component={RouterLink} to="/recurring-expenses" size="small" endIcon={<ArrowForwardRoundedIcon />}>
              Åpne
            </Button>
          }
          compact
        >
          <Stack spacing={1}>
            {unpaid.slice(0, 6).map((item) => (
              <Stack
                key={`${item.recurringExpenseId}-${item.periodKey}`}
                direction="row"
                spacing={1.5}
                justifyContent="space-between"
                sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={900} noWrap>
                    {item.title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(item.dueDate)}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={950} sx={{ whiteSpace: "nowrap" }}>
                  {NOK.format(item.expected?.max ?? item.expected?.fixed ?? 0)}
                </Typography>
              </Stack>
            ))}
            {!unpaid.length ? (
              <Typography variant="body2" color="text.secondary">
                Ingen ubetalte faste kostnader i valgt måned.
              </Typography>
            ) : null}
          </Stack>
        </SectionCard>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        }}
      >
        <SectionCard title="Siste transaksjoner" subtitle="Nyeste registrerte kjøp." compact>
          <Stack spacing={1}>
            {recentExpenses.map((expense) => (
              <Stack
                key={expense._id}
                direction="row"
                spacing={1.5}
                justifyContent="space-between"
                sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={900} noWrap>
                    {expense.productName || "Ukjent produkt"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {expense.shopName || "Ukjent butikk"} · {expense.purchaseDate || expense.registeredDate}
                  </Typography>
                </Box>
                <Typography variant="body2" fontWeight={950} sx={{ whiteSpace: "nowrap" }}>
                  {NOK.format(expense.finalPrice ?? expense.price ?? 0)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </SectionCard>

        <SectionCard title="Største prisendringer" subtitle="Sammenlignet med forrige kjøp i valgt måned." compact>
          <Stack spacing={1}>
            {changes.map((item) => {
              const delta = Number(item.changePercent || 0);
              return (
                <Stack
                  key={`${item.productId}-${item.shopName}-${item.currentDate}-${item.changeAmount}`}
                  direction="row"
                  spacing={1.5}
                  justifyContent="space-between"
                  sx={{ py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={900} noWrap>
                      {item.productName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.shopName} · {formatDate(item.currentDate)}
                    </Typography>
                  </Box>
                  <Typography
                    variant="body2"
                    fontWeight={950}
                    color={delta >= 0 ? "error.main" : "success.main"}
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                  </Typography>
                </Stack>
              );
            })}
            {!changes.length ? (
              <Typography variant="body2" color="text.secondary">
                Ingen prisendringer funnet i valgt måned.
              </Typography>
            ) : null}
          </Stack>
        </SectionCard>
      </Box>
    </AppScreen>
  );
}
