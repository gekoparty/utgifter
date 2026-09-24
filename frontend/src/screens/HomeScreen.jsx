import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Badge,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import AccountBalanceWalletRoundedIcon from "@mui/icons-material/AccountBalanceWalletRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import dayjs from "dayjs";

import { buildApiUrl, requestJson } from "../api/httpClient";
import AppScreen from "../components/commons/Layout/AppScreen";
import SectionCard from "../components/commons/Layout/SectionCard";
import BreakdownList from "../components/commons/DataDisplay/BreakdownList";
import DecisionLabel from "../components/commons/DataDisplay/DecisionLabel";
import { buildPaginatedUrl } from "../components/commons/EntityTableScreen/buildPaginatedUrl";
import { useTranslation } from "../i18n/useTranslation";

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

const formatChangeContext = (item) => {
  const parts = [
    item.brandName && item.brandName !== "Ukjent merke" ? item.brandName : "Ukjent merke",
    item.variantName || "Ingen variant",
    item.shopName || "Ukjent butikk",
  ];
  return parts.join(" · ");
};

const formatPriceMove = (item) => {
  const previous = Number(item.previousPrice || 0);
  const current = Number(item.currentPrice || 0);
  const unit = item.usedUnitPrice ? `/${item.measurementUnit || "enhet"}` : "";
  if (!previous || !current) return "Sammenlignet med forrige kjøp";
  return `${NOK.format(previous)}${unit} → ${NOK.format(current)}${unit}`;
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

const fetchDataQuality = async (signal) => requestJson("/api/stats/data-quality", { signal });

const ignoreDataQualityIssue = async (payload) =>
  requestJson("/api/stats/data-quality/ignore", {
    method: "POST",
    data: payload,
  });

function CommandMetric({ label, value, help, tone = "neutral", to }) {
  const toneColor = {
    success: "success.main",
    error: "error.main",
    primary: "primary.main",
    warning: "warning.main",
    neutral: "text.primary",
  }[tone];

  return (
    <Box
      component={to ? RouterLink : "div"}
      to={to}
      sx={(theme) => ({
        p: 1.25,
        borderRadius: 1.25,
        bgcolor:
          tone === "neutral"
            ? "background.default"
            : alpha(theme.palette[tone === "primary" ? "primary" : tone]?.main || theme.palette.primary.main, 0.1),
        border: "1px solid",
        borderColor:
          tone === "neutral"
            ? "divider"
            : alpha(theme.palette[tone === "primary" ? "primary" : tone]?.main || theme.palette.primary.main, 0.32),
        color: "inherit",
        minWidth: 0,
        textDecoration: "none",
        "&:hover": to
          ? {
              borderColor: "primary.main",
              bgcolor: "action.hover",
            }
          : undefined,
      })}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={900}>
        {label}
      </Typography>
      <Typography
        variant="h5"
        sx={{
          mt: 0.2,
          fontWeight: 950,
          color: toneColor,
          overflowWrap: "anywhere",
          lineHeight: 1.15,
        }}
      >
        {NOK.format(value)}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.35 }}>
        {help}
      </Typography>
    </Box>
  );
}

function EquationOperator({ children }) {
  return (
    <Box
      sx={{
        display: { xs: "none", md: "grid" },
        placeItems: "center",
        color: "text.secondary",
        fontWeight: 950,
        fontSize: 22,
        px: 0.25,
      }}
    >
      {children}
    </Box>
  );
}

function ActionLink({ item }) {
  return (
    <Box
      component={RouterLink}
      to={item.to}
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 1,
        alignItems: "center",
        p: 1,
        borderRadius: 1.25,
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
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" fontWeight={950} noWrap>
          {item.title}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {item.text}
        </Typography>
      </Box>
      <ArrowForwardRoundedIcon fontSize="small" color="action" />
    </Box>
  );
}

const getQualityExampleTarget = (issue, example) => {
  if (
    ["suspicious-volume-price", "expenses-missing-place"].includes(issue?.id) &&
    example?.id
  ) {
    return `/expenses?openExpense=${encodeURIComponent(String(example.id))}`;
  }

  return example?.to || issue?.to || "/expenses";
};

function QualityIssueRow({ issue, onIgnore, ignoringKey }) {
  const hasIssues = Number(issue.count || 0) > 0;
  const tone =
    issue.severity === "error" ? "error" : issue.severity === "warning" ? "warning" : issue.severity === "info" ? "info" : "success";

  return (
    <Box
      sx={{
        p: 1,
        borderRadius: 1.25,
        bgcolor: "background.default",
        border: "1px solid",
        borderColor: hasIssues ? `${tone}.main` : "divider",
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="flex-start">
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={950}>
            {issue.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {issue.decision}
          </Typography>
        </Box>
        <Chip
          size="small"
          color={tone}
          variant={hasIssues ? "filled" : "outlined"}
          label={hasIssues ? issue.count : "OK"}
          sx={{ fontWeight: 900, minWidth: 48 }}
        />
      </Stack>
      {hasIssues && issue.examples?.length ? (
        <Stack spacing={0.6} sx={{ mt: 0.9 }}>
          {issue.examples.slice(0, 2).map((example) => {
            const rowKey = `${issue.id}:${example.id}`;
            return (
            <Stack
              key={rowKey}
              direction="row"
              spacing={0.75}
              alignItems="center"
              sx={{
                bgcolor: "action.hover",
                borderRadius: 1,
                p: 0.35,
              }}
            >
              <Button
                component={RouterLink}
                to={getQualityExampleTarget(issue, example)}
                size="small"
                variant="text"
                endIcon={<ArrowForwardRoundedIcon />}
                sx={{
                  justifyContent: "space-between",
                  px: 0.75,
                  color: "text.primary",
                  textTransform: "none",
                  minWidth: 0,
                  flex: 1,
                }}
              >
                <Box component="span" sx={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {example.label}
                </Box>
                <Box component="span" sx={{ color: "text.secondary", ml: 1, flexShrink: 0 }}>
                  {example.detail}
                </Box>
              </Button>
              {example.canIgnore ? (
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  disabled={ignoringKey === rowKey}
                  onClick={() => onIgnore?.(issue, example)}
                  sx={{ flexShrink: 0, fontWeight: 850, px: 1, minWidth: 84 }}
                >
                  OK
                </Button>
              ) : null}
            </Stack>
            );
          })}
        </Stack>
      ) : null}
    </Box>
  );
}

export default function HomeScreen() {
  const [selectedMonth, setSelectedMonth] = useState(monthKeyNow);
  const queryClient = useQueryClient();
  const [ignoringQualityKey, setIgnoringQualityKey] = useState("");
  const [qualityChecksEnabled, setQualityChecksEnabled] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const timer = window.setTimeout(() => setQualityChecksEnabled(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

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

  const dataQualityQuery = useQuery({
    queryKey: ["home", "data-quality"],
    queryFn: ({ signal }) => fetchDataQuality(signal),
    enabled: qualityChecksEnabled,
    staleTime: 5 * 60_000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  const ignoreQualityMutation = useMutation({
    mutationFn: ignoreDataQualityIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home", "data-quality"] });
    },
    onSettled: () => setIgnoringQualityKey(""),
  });

  const dashboard = dashboardQuery.data || {};
  const recurring = recurringQuery.data || {};
  const dataQuality = dataQualityQuery.data || {};
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
  const incomeBasis = income > 0 ? income : expectedIncome;
  const remaining = incomeBasis - visibleExpenses;
  const fixedOutstanding = Math.max(0, fixedExpected - fixedActual);
  const expensePressure = variableExpenses + Math.max(fixedActual, fixedExpected);
  const expectedPressureRemaining = incomeBasis - expensePressure;
  const priceChanges = dashboard?.priceChanges || { increases: [], decreases: [] };
  const changes = [...(priceChanges.increases || []), ...(priceChanges.decreases || [])]
    .slice(0, 5);
  const recentExpenses = recentQuery.data?.expenses || [];
  const qualityIssues = dataQuality?.issues || [];
  const qualityProblemCount = Number(dataQuality?.totals?.issues || 0);
  const isLoading = dashboardQuery.isFetching || recurringQuery.isFetching || recentQuery.isFetching || dataQualityQuery.isFetching;
  const hasError = dashboardQuery.error || recurringQuery.error || recentQuery.error || dataQualityQuery.error;

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

  const handleIgnoreQualityExample = (issue, example) => {
    const payload = example?.ignorePayload;
    if (!payload) return;
    setIgnoringQualityKey(`${issue.id}:${example.id}`);
    ignoreQualityMutation.mutate(payload);
  };

  return (
    <AppScreen
      title={t("homeTitle")}
      subtitle={t("homeSubtitle")}
      icon={<HomeRoundedIcon />}
      toolbar={toolbar}
      workflow={{
        question: t("homeQuestion"),
        answer: t("homeAnswer"),
        steps: [t("homeStepMonth"), t("homeStepRemaining"), t("homeStepFollowUp")],
      }}
      summaryItems={[
        { label: "Måned", value: monthLabel(selectedMonth) },
        { label: "Ubetalt", value: unpaid.length },
        { label: "Datakvalitet", value: qualityProblemCount },
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
        title={`Månedssenter: ${monthLabel(selectedMonth)}`}
        subtitle="Inntekt - variable utgifter - faste kostnader = igjen."
        icon={<AccountBalanceWalletRoundedIcon />}
        action={<DecisionLabel tone={statusTone} label={statusLabel} />}
        compact
        sx={{
          borderColor:
            statusTone === "success" ? "success.main" : statusTone === "warning" ? "warning.main" : "error.main",
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              md: "1fr auto 1fr auto 1fr auto 1.1fr",
            },
            alignItems: "stretch",
          }}
        >
          <CommandMetric
            label={income > 0 ? "Faktisk inntekt" : "Planlagt inntekt"}
            value={incomeBasis}
            tone="success"
            help={income > 0 ? t("incomeActualHelp") : t("incomeExpectedHelp")}
          />
          <EquationOperator>-</EquationOperator>
          <CommandMetric
            label="Variable utgifter"
            value={variableExpenses}
            tone="primary"
            help={t("variableExpensesHelp")}
            to={expenseMonthUrl}
          />
          <EquationOperator>-</EquationOperator>
          <CommandMetric
            label="Faste kostnader"
            value={fixedActual}
            tone={fixedOutstanding > 0 ? "warning" : "neutral"}
            help={
              fixedOutstanding > 0
                ? `${NOK.format(fixedOutstanding)} ${t("fixedOutstandingHelp")}`
                : `${t("fixedPaidHelp")} ${NOK.format(fixedExpected)}`
            }
            to={recurringMonthUrl}
          />
          <EquationOperator>=</EquationOperator>
          <CommandMetric
            label="Igjen nå"
            value={remaining}
            tone={remaining >= 0 ? "success" : "error"}
            help={`${t("remainingWithFixedHelp")}: ${NOK.format(expectedPressureRemaining)}`}
          />
        </Box>

        <Box
          sx={(theme) => ({
            mt: 1.25,
            p: 1.25,
            borderRadius: 1.25,
            bgcolor: alpha(theme.palette.primary.main, 0.06),
            border: "1px solid",
            borderColor: alpha(theme.palette.primary.main, 0.18),
          })}
        >
          <Stack direction={{ xs: "column", md: "row" }} spacing={1} alignItems={{ xs: "stretch", md: "center" }}>
            <Typography variant="body2" fontWeight={950} sx={{ minWidth: 170 }}>
              {t("monthDecision")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {remaining < 0
                ? `Du ligger ${NOK.format(Math.abs(remaining))} over ${income > 0 ? "registrert inntekt" : "planlagt inntekt"} akkurat nå.`
                : unpaid.length
                  ? `Du har ${NOK.format(remaining)} igjen nå, men ${unpaid.length} faste kostnader må fortsatt kontrolleres.`
                  : `Du har ${NOK.format(remaining)} igjen etter registrerte utgifter og betalte faste kostnader.`}
            </Typography>
            <Button
              component={RouterLink}
              to={remaining < 0 ? expenseMonthUrl : unpaid.length ? recurringMonthUrl : "/stats"}
              variant="contained"
              size="small"
              endIcon={<ArrowForwardRoundedIcon />}
            >
              {remaining < 0 ? "Se utgifter" : unpaid.length ? "Se faste" : "Se trend"}
            </Button>
          </Stack>
        </Box>

        <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ mt: 1 }}>
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
            color={expectedPressureRemaining >= 0 ? "success" : "error"}
            label={`Hvis alle faste tas med: ${NOK.format(expectedPressureRemaining)}`}
            sx={{ fontWeight: 900 }}
          />
        </Stack>
      </SectionCard>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", lg: "minmax(320px, 0.72fr) minmax(0, 1.28fr)" },
          alignItems: "start",
        }}
      >
        <SectionCard
          title="Hva trenger handling"
          subtitle="Kort liste over det viktigste for valgt måned."
          icon={<WarningAmberRoundedIcon />}
          action={
            <DecisionLabel
              tone={actionItems.length ? "warning" : "success"}
              label={actionItems.length ? `${actionItems.length} punkter` : "Alt rolig"}
            />
          }
          compact
        >
          <Stack spacing={1}>
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
              <ActionLink key={item.title} item={item} />
            ))}
          </Stack>
        </SectionCard>

        <SectionCard
          title="Hvor pengene gikk"
          subtitle="Variable utgifter i valgt måned. Faste kostnader vises i månedskontrollen over."
          icon={<PaymentsRoundedIcon />}
          action={
            <DecisionLabel tone="neutral" label={NOK.format(variableExpenses)} />
          }
          compact
        >
          <BreakdownList
            rows={categoryRows}
            total={variableExpenses}
            maxRows={7}
            formatValue={(value) => NOK.format(value)}
            emptyText="Ingen variable utgifter registrert i valgt måned."
          />
        </SectionCard>
      </Box>

      <SectionCard
        title="Datakvalitet"
        subtitle={t("dataQualitySubtitle")}
        icon={
          <Badge color={qualityProblemCount ? "warning" : "success"} variant={qualityProblemCount ? "dot" : "standard"}>
            {qualityProblemCount ? <RuleRoundedIcon /> : <CheckCircleRoundedIcon />}
          </Badge>
        }
        action={
          <DecisionLabel
            tone={qualityProblemCount ? "warning" : "success"}
            label={qualityProblemCount ? `${qualityProblemCount} ${t("qualityToCheck")}` : t("qualityAllOk")}
          />
        }
        compact
      >
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" },
          }}
        >
          {qualityIssues.map((issue) => (
            <QualityIssueRow
              key={issue.id}
              issue={issue}
              onIgnore={handleIgnoreQualityExample}
              ignoringKey={ignoringQualityKey}
            />
          ))}
          {!qualityIssues.length ? (
            <Typography variant="body2" color="text.secondary">
              Ingen datakvalitetssjekker å vise enda.
            </Typography>
          ) : null}
        </Box>
      </SectionCard>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        }}
      >
        <SectionCard
          title="Ubetalte faste kostnader"
          subtitle={unpaid.length ? "Dette bør følges opp først." : "Alt er betalt eller ingen forfall i valgt måned."}
          icon={<ReceiptLongRoundedIcon />}
          action={
            <Button component={RouterLink} to={recurringMonthUrl} size="small" endIcon={<ArrowForwardRoundedIcon />}>
              Åpne måned
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

        <SectionCard title="Siste transaksjoner" subtitle="Nyeste registrerte kjøp i valgt måned." compact>
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
            {!recentExpenses.length ? (
              <Typography variant="body2" color="text.secondary">
                Ingen kjøp registrert i valgt måned.
              </Typography>
            ) : null}
          </Stack>
        </SectionCard>
      </Box>

      <SectionCard
        title="Hva endret seg"
        subtitle="Største prisendringer fra kjøp i valgt måned."
        icon={<TrendingUpRoundedIcon />}
        action={
          <Button component={RouterLink} to="/stats" size="small" endIcon={<ArrowForwardRoundedIcon />}>
            Se statistikk
          </Button>
        }
        compact
      >
        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" },
          }}
        >
          {changes.map((item) => {
            const delta = Number(item.changePercent || 0);
            const isUp = delta >= 0;
            return (
              <Paper
                key={`${item.productId}-${item.shopName}-${item.currentDate}-${item.changeAmount}`}
                variant="outlined"
                sx={{
                  p: 1.1,
                  borderRadius: 1.25,
                  bgcolor: "background.default",
                  borderColor: isUp ? "error.dark" : "success.dark",
                  minWidth: 0,
                }}
              >
                <Stack spacing={0.65}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={950} noWrap>
                        {item.productName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {formatChangeContext(item)}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      fontWeight={950}
                      color={isUp ? "error.main" : "success.main"}
                      sx={{ whiteSpace: "nowrap" }}
                    >
                      {delta > 0 ? "+" : ""}{delta.toFixed(1)}%
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.primary" fontWeight={850} noWrap>
                    {formatPriceMove(item)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Samme butikk/merke/variant · {formatDate(item.previousDate)} til {formatDate(item.currentDate)}
                  </Typography>
                </Stack>
              </Paper>
            );
          })}
          {!changes.length ? (
            <Typography variant="body2" color="text.secondary">
              Ingen prisendringer funnet i valgt måned.
            </Typography>
          ) : null}
        </Box>
      </SectionCard>

    </AppScreen>
  );
}
