import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Stack,
  Select,
  Switch,
  Tab,
  Tabs,
  Typography,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import AddIcon from "@mui/icons-material/Add";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import dayjs from "dayjs";
import { useSearchParams } from "react-router-dom";

import AppScreen from "../../components/commons/Layout/AppScreen";
import KpiCard from "../../components/commons/DataDisplay/KpiCard";
import SectionCard from "../../components/commons/Layout/SectionCard";
import SegmentedControl from "../../components/commons/Controls/SegmentedControl";
import RecurringOverviewCharts from "./components/RecurringOverviewCharts";
import NextBillsCard from "./components/NextBillsCard";
import ForecastSection from "./components/ForecastSection";
import ExpenseTemplatesSection from "./components/ExpenseTemplatesSection";
import MortgageCenter from "./components/MortgageCenter";
import MonthDrawer from "./components/MonthDrawer";
import RecurringExpenseDialog from "./components/RecurringExpenseDialog";
import PayDialog from "./components/PayDialog";
import ChangeTermsDialog from "./components/ChangeTermsDialog";
import PauseDialog from "./components/PauseDialog";
import PurgeAllRecurringDialog from "./components/PurgeAllRecurringDialog";
import { useRecurringController } from "./hooks/useRecurringController";
import {
  useRecurringData,
  useRecurringInvalidation,
} from "./hooks/useRecurringData";
import { useRecurringSummary } from "./hooks/useRecurringSummary";
import { usePayDialog } from "./hooks/usePayDialog";
import { useRecurringPayments } from "./hooks/useRecurringPayments";
import { useRecurringPaymentActions } from "./hooks/useRecurringPaymentActions";
import { useRecurringMaintenanceActions } from "./hooks/useRecurringMaintenanceActions";
import { makeCurrencyFormatter } from "./utils/recurringFormatters";
import { RECURRING_TYPES, TYPE_META_BY_KEY, normalizeRecurringType } from "./utils/recurringTypes";
import { useTranslation } from "../../i18n/useTranslation";

const MONTHS_FORWARD = 12;
const HISTORY_OPTIONS = [0, 3, 6, 12, 18, 24];

const dueKey = (value) => {
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD") : String(value ?? "");
};

const monthSelectLabel = (month, t) => {
  const date = dayjs(month?.date || `${month?.key}-01`);
  const label = date.isValid() ? date.format("MMM YYYY") : month?.key;
  const missing = (month?.items || []).filter((item) => item.status === "UNPAID").length;
  return missing ? `${label} - ${missing} ${t("recurring.missing")}` : label;
};

function RecurringControlPanel({
  filter,
  onFilter,
  monthsBack,
  onMonthsBack,
  monthOptions,
  selectedMonthKey,
  onSelectedMonth,
  onOpenMonth,
}) {
  const { t } = useTranslation();
  const monthValue =
    selectedMonthKey && monthOptions.some((month) => month.key === selectedMonthKey)
      ? selectedMonthKey
      : monthOptions[0]?.key || "";

  return (
    <SectionCard
      title={t("recurring.control")}
      subtitle={t("recurring.controlSubtitle")}
      contentSx={{ p: 1.25 }}
    >
      <Stack spacing={1}>
        <FormControl size="small" fullWidth>
          <InputLabel id="recurring-type-filter-label">{t("recurring.show")}</InputLabel>
          <Select
            labelId="recurring-type-filter-label"
            label={t("recurring.show")}
            value={filter}
            onChange={(event) => onFilter(event.target.value)}
          >
            <MenuItem value="ALL">{t("recurring.allFixedCosts")}</MenuItem>
            {RECURRING_TYPES.map((type) => (
              <MenuItem key={type.key} value={type.key}>
                {type.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth>
          <InputLabel id="recurring-history-label">{t("recurring.history")}</InputLabel>
          <Select
            labelId="recurring-history-label"
            label={t("recurring.history")}
            value={monthsBack}
            onChange={(event) => onMonthsBack(Number(event.target.value))}
          >
            {HISTORY_OPTIONS.map((months) => (
              <MenuItem key={months} value={months}>
                {months === 0 ? t("recurring.noHistory") : t("recurring.monthsBack", { count: months })}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl size="small" fullWidth disabled={!monthOptions.length}>
          <InputLabel id="recurring-month-label">{t("common.month")}</InputLabel>
          <Select
            labelId="recurring-month-label"
            label={t("common.month")}
            value={monthValue}
            onChange={(event) => onSelectedMonth(event.target.value)}
          >
            {monthOptions.map((month) => (
              <MenuItem key={month.key} value={month.key}>
                {monthSelectLabel(month, t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          fullWidth
          disabled={!monthValue}
          onClick={() => onOpenMonth(monthValue)}
        >
          {t("recurring.openSelectedMonth")}
        </Button>
      </Stack>
    </SectionCard>
  );
}

function MissedPaymentsPanel({
  items,
  monthLabel,
  formatCurrency,
  onOpenPay,
  onOpenMonth,
  pending,
}) {
  const { t } = useTranslation();
  const visibleItems = items.slice(0, 8);

  return (
    <SectionCard
      title={t("recurring.unpaidTitle", { month: monthLabel || t("recurring.selectedMonth") })}
      subtitle={t("recurring.unpaidSubtitle")}
      icon={<WarningAmberRoundedIcon fontSize="small" />}
      action={
        <Chip
          size="small"
          color={items.length ? "warning" : "success"}
          label={items.length ? `${items.length} ${t("recurring.open")}` : t("recurring.allOk")}
          sx={{ fontWeight: 900 }}
        />
      }
      sx={{
        borderColor: items.length ? "warning.main" : undefined,
      }}
      contentSx={{ p: 1.25 }}
    >
      {visibleItems.length ? (
        <Stack spacing={0.8} sx={{ maxHeight: { lg: "calc(100vh - 520px)" }, overflow: "auto", pr: 0.25 }}>
          {visibleItems.map((item) => {
            const typeKey = normalizeRecurringType(item.type);
            const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? item.type;
            const amount = item.expected?.max ?? item.expectedMax ?? 0;

            return (
              <Box
                key={`${item.recurringExpenseId}-${item.periodKey}`}
                sx={{
                  p: 0.9,
                  borderRadius: 1.5,
                  border: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.default",
                }}
              >
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={950} noWrap>
                      {item.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {dayjs(item.dueDate).format("DD. MMM")} · {typeLabel}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={950} sx={{ whiteSpace: "nowrap" }}>
                    {formatCurrency(amount)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.75} sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={pending}
                    onClick={() => onOpenPay({ ...item, paymentKind: "MAIN" })}
                    sx={{ flex: 1 }}
                  >
                    {t("recurring.register")}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onOpenMonth(item.monthKey)}
                    sx={{ flex: 1 }}
                  >
                    {t("recurring.monthButton")}
                  </Button>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {t("recurring.unpaidEmpty")}
        </Typography>
      )}
    </SectionCard>
  );
}

export default function RecurringExpenseScreen() {
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  const ctrl = useRecurringController();
  const payments = useRecurringPayments();
  const payDialog = usePayDialog();
  const { invalidateAllRecurring, invalidateSummary, invalidateTemplates } =
    useRecurringInvalidation();
  const maintenance = useRecurringMaintenanceActions({
    invalidateSummary,
    invalidateTemplates,
  });

  const [activeSection, setActiveSection] = useState("overview");
  const [showFinished, setShowFinished] = useState(false);
  const [monthsBack, setMonthsBack] = useState(12);
  const [controlMonthKey, setControlMonthKey] = useState("");
  const [overviewRange, setOverviewRange] = useState("withHistory");
  const [showChartIncome, setShowChartIncome] = useState(false);
  const [showChartExpectedIncome, setShowChartExpectedIncome] = useState(false);

  const templates = useRecurringData({ enabled: true, includeInactive: true });
  const { data, isLoading, isError, error } = useRecurringSummary({
    filter: ctrl.filter,
    months: MONTHS_FORWARD,
    pastMonths: monthsBack,
    enabled: true,
  });

  const { forecast, nextBills, sum3 } = data || {
    forecast: [],
    nextBills: [],
    sum3: { min: 0, max: 0, paid: 0 },
  };

  const routeMonthKey = searchParams.get("month");

  const mortgages = useMemo(
    () =>
      (templates.expenses || []).filter((expense) =>
        ["MORTGAGE", "HOUSING"].includes(String(expense.type).toUpperCase()),
      ),
    [templates.expenses],
  );

  const thisMonthKey = useMemo(() => dayjs().format("YYYY-MM"), []);
  const forecastPast = useMemo(
    () => (forecast || []).filter((month) => month.key < thisMonthKey),
    [forecast, thisMonthKey],
  );
  const forecastFuture = useMemo(
    () => (forecast || []).filter((month) => month.key >= thisMonthKey),
    [forecast, thisMonthKey],
  );

  const selectedMonth = useMemo(() => {
    if (!ctrl.selectedMonthKey) return null;
    return forecast.find((month) => month.key === ctrl.selectedMonthKey) ?? null;
  }, [forecast, ctrl.selectedMonthKey]);

  const monthOptions = useMemo(() => forecast || [], [forecast]);
  const selectedControlMonth =
    controlMonthKey && monthOptions.some((month) => month.key === controlMonthKey)
      ? controlMonthKey
      : thisMonthKey;
  const selectedSummaryMonth = useMemo(
    () => monthOptions.find((month) => month.key === selectedControlMonth) || null,
    [monthOptions, selectedControlMonth],
  );
  const unpaidSelectedMonth = useMemo(
    () =>
      (selectedSummaryMonth?.items || [])
        .filter((item) => item.status === "UNPAID")
        .map((item) => ({ ...item, monthKey: selectedSummaryMonth.key }))
        .sort((a, b) => dayjs(a.dueDate).valueOf() - dayjs(b.dueDate).valueOf()),
    [selectedSummaryMonth],
  );
  const selectedMonthLabel = selectedSummaryMonth
    ? dayjs(selectedSummaryMonth.date).format("MMM YYYY")
    : "";
  const summaryWindow = selectedSummaryMonth
    ? {
        label: selectedMonthLabel,
        min: selectedSummaryMonth.expectedMin ?? 0,
        max: selectedSummaryMonth.expectedMax ?? 0,
        paid: selectedSummaryMonth.paidTotal ?? 0,
      }
    : {
        label: t("recurring.threeMonths"),
        min: sum3.min ?? 0,
        max: sum3.max ?? 0,
        paid: sum3.paid ?? 0,
      };

  useEffect(() => {
    if (!monthOptions.length) return;
    if (monthOptions.some((month) => month.key === controlMonthKey)) return;

    const current = monthOptions.find((month) => month.key === thisMonthKey);
    setControlMonthKey(current?.key || monthOptions[0].key);
  }, [controlMonthKey, monthOptions, thisMonthKey]);

  useEffect(() => {
    if (!routeMonthKey || !/^\d{4}-\d{2}$/.test(routeMonthKey)) return;
    setControlMonthKey(routeMonthKey);
    setActiveSection("overview");
    ctrl.openMonth(routeMonthKey);
  }, [ctrl.openMonth, routeMonthKey]);

  useEffect(() => {
    if (monthsBack === 0 && overviewRange === "withHistory") {
      setOverviewRange("future");
    }
  }, [monthsBack, overviewRange]);

  const overviewForecast = useMemo(
    () => (overviewRange === "withHistory" ? forecast : forecastFuture),
    [forecast, forecastFuture, overviewRange],
  );

  const enrichedNextBills = useMemo(() => {
    const byDueDate = new Map();

    (forecast || []).forEach((month) => {
      (month.items || []).forEach((item) => {
        byDueDate.set(
          `${String(item.recurringExpenseId)}|${dueKey(item.dueDate)}`,
          { ...item, monthKey: month.key },
        );
      });
    });

    return (nextBills || []).map((bill) => {
      const match = byDueDate.get(
        `${String(bill.recurringExpenseId)}|${dueKey(bill.dueDate)}`,
      );

      return {
        ...bill,
        ...(match || {}),
        expectedMax: bill.expectedMax ?? match?.expected?.max ?? 0,
        periodKey:
          match?.periodKey ||
          match?.monthKey ||
          (dayjs(bill.dueDate).isValid() ? dayjs(bill.dueDate).format("YYYY-MM") : ""),
      };
    });
  }, [forecast, nextBills]);

  const maxRef = useMemo(() => {
    const values = (forecast || []).map((month) =>
      ctrl.tab === 1 ? month.paidTotal : month.expectedMax,
    );
    return Math.max(...values, 1) || 1;
  }, [forecast, ctrl.tab]);

  const currencyFormatter = useMemo(() => makeCurrencyFormatter(), []);
  const formatCurrency = useCallback(
    (value) => currencyFormatter.format(Number(value || 0)),
    [currencyFormatter],
  );

  const paymentActions = useRecurringPaymentActions({ payDialog, payments });

  const activeTemplateCount = useMemo(
    () => (templates.expenses || []).filter((expense) => expense.isActive !== false).length,
    [templates.expenses],
  );

  const sectionTabs = useMemo(
    () => [
      { value: "overview", label: t("recurring.thisMonth"), icon: <DashboardRoundedIcon fontSize="small" /> },
      { value: "months", label: t("recurring.queueAndMonths"), icon: <CalendarMonthRoundedIcon fontSize="small" /> },
      {
        value: "templates",
        label: `${t("recurring.agreements")}${activeTemplateCount ? ` (${activeTemplateCount})` : ""}`,
        icon: <ReceiptLongRoundedIcon fontSize="small" />,
      },
      {
        value: "mortgages",
        label: `${t("recurring.mortgage")}${mortgages.length ? ` (${mortgages.length})` : ""}`,
        icon: <AccountBalanceRoundedIcon fontSize="small" />,
      },
    ],
    [activeTemplateCount, mortgages.length, t],
  );

  const renderStatusCard = () =>
    (isLoading || isError) && (
      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          {isLoading && (
            <Typography color="text.secondary">
              {t("recurring.loading")}
            </Typography>
          )}
          {isError && (
            <Typography color="error">
              {t("recurring.fetchFailed")}
              {error?.message ? `: ${error.message}` : "."}
            </Typography>
          )}
      </Paper>
    );

  return (
    <AppScreen
      title={t("recurring.title")}
      subtitle={t("recurring.subtitle")}
      icon={<ReceiptLongRoundedIcon />}
      actionLabel={t("recurring.add")}
      actionIcon={<AddIcon />}
      onAction={ctrl.openAdd}
      summaryItems={[
        { label: t("recurring.activeAgreements"), value: activeTemplateCount },
        { label: t("recurring.unpaidSelectedMonth"), value: unpaidSelectedMonth.length },
        { label: t("recurring.nextPayments"), value: enrichedNextBills.length },
        ...(mortgages.length ? [{ label: t("recurring.mortgage"), value: mortgages.length }] : []),
      ]}
      workflow={{
        question: t("recurring.question"),
        answer: t("recurring.answer"),
        steps: [t("recurring.stepMonth"), t("recurring.stepPayment"), t("recurring.stepEffect")],
      }}
      maxWidth={1720}
      contentSx={{
        gap: { xs: 1.5, lg: 1.35 },
      }}
      headerSx={{
        p: { xs: 1.5, md: 1.65 },
      }}
    >
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
              xl: "1.1fr 1fr 0.95fr 0.95fr",
            },
          }}
        >
          <KpiCard
            label={t("recurring.expected", { period: summaryWindow.label })}
            value={`${formatCurrency(summaryWindow.min)} - ${formatCurrency(summaryWindow.max)}`}
            subtext={t("recurring.expectedFuture")}
            icon={<ReceiptLongRoundedIcon />}
            tone="primary"
          />
          <KpiCard
            label={t("recurring.paid", { period: summaryWindow.label })}
            value={formatCurrency(summaryWindow.paid ?? 0)}
            subtext={t("recurring.actualPaid")}
            icon={<PaidRoundedIcon />}
            tone="success"
          />
          <KpiCard
            label={t("recurring.unpaid", { period: summaryWindow.label })}
            value={unpaidSelectedMonth.length}
            subtext={
              unpaidSelectedMonth.length
                ? t("recurring.missingCount", { count: unpaidSelectedMonth.length })
                : t("recurring.paidInSelected")
            }
            icon={<WarningAmberRoundedIcon />}
            tone={unpaidSelectedMonth.length ? "warning" : "success"}
          />
          <KpiCard
            label={t("recurring.mortgage")}
            value={mortgages.length}
            subtext={t("recurring.activeLoans")}
            icon={<AccountBalanceRoundedIcon />}
          />
        </Box>

        {renderStatusCard()}

        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, lg: 1.25, xl: 1.5 },
            gridTemplateColumns: { xs: "1fr", lg: "280px minmax(0, 1fr)", xl: "300px minmax(0, 1fr)" },
            alignItems: "start",
          }}
        >
          <Stack spacing={1.5} sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}>
            <RecurringControlPanel
              filter={ctrl.filter}
              onFilter={ctrl.setFilter}
              monthsBack={monthsBack}
              onMonthsBack={setMonthsBack}
              monthOptions={monthOptions}
              selectedMonthKey={selectedControlMonth}
              onSelectedMonth={setControlMonthKey}
              onOpenMonth={ctrl.openMonth}
            />
            <MissedPaymentsPanel
              items={unpaidSelectedMonth}
              monthLabel={selectedMonthLabel}
              formatCurrency={formatCurrency}
              onOpenPay={payDialog.openDialog}
              onOpenMonth={ctrl.openMonth}
              pending={payments.pending}
            />
          </Stack>

          <Box sx={{ minWidth: 0 }}>
            <Paper
              variant="outlined"
              sx={{
                p: 0.5,
                borderRadius: 2,
                boxShadow: "none",
                bgcolor: "background.paper",
                mb: 1.25,
              }}
            >
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={0.75}
                alignItems={{ xs: "stretch", md: "center" }}
                justifyContent="space-between"
              >
                <Box sx={{ px: { xs: 0.5, md: 1 }, minWidth: 0, display: { xs: "block", xl: "none" } }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={900}>
                    {t("recurring.workArea")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: "none", md: "block" } }}>
                    {t("recurring.workAreaHelp")}
                  </Typography>
                </Box>
                <Tabs
                  value={activeSection}
                  onChange={(_, value) => setActiveSection(value)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{
                    minHeight: 40,
                    maxWidth: "100%",
                    flex: { md: "1 1 auto" },
                    "& .MuiTabs-indicator": { display: "none" },
                    "& .MuiTabs-flexContainer": {
                      gap: 0.5,
                    },
                    "& .MuiTab-root": {
                      minHeight: 40,
                      borderRadius: 1.5,
                      px: 1.5,
                      minWidth: 0,
                      gap: 0.75,
                      border: "1px solid transparent",
                      color: "text.secondary",
                      flexShrink: 0,
                    },
                    "& .MuiTab-root.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      borderColor: "primary.dark",
                    },
                    "& .MuiTab-root.Mui-selected .MuiSvgIcon-root": {
                      color: "inherit",
                    },
                  }}
                >
                  {sectionTabs.map((tab) => (
                    <Tab
                      key={tab.value}
                      value={tab.value}
                      icon={tab.icon}
                      iconPosition="start"
                      label={tab.label}
                    />
                  ))}
                </Tabs>
              </Stack>
            </Paper>

            {activeSection === "overview" && (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "minmax(0, 1.45fr) minmax(380px, 0.9fr)",
                    xl: "minmax(0, 1.7fr) minmax(440px, 0.85fr)",
                  },
                  alignItems: "start",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  {!isLoading && !isError && (forecast?.length ?? 0) > 0 && (
                    <Stack spacing={1.25}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: "background.paper",
                        }}
                      >
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          alignItems={{ xs: "stretch", sm: "center" }}
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={900}>
                              {t("recurring.graphPeriod")}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {overviewRange === "withHistory"
                                ? t("recurring.historicalAndFuture", { past: forecastPast.length, future: forecastFuture.length })
                                : t("recurring.futureMonths", { count: forecastFuture.length })}
                            </Typography>
                          </Box>
                          <SegmentedControl
                            value={overviewRange}
                            onChange={setOverviewRange}
                            ariaLabel={t("recurring.graphPeriodAria")}
                            options={[
                              { value: "future", label: t("recurring.future") },
                              {
                                value: "withHistory",
                                label: t("recurring.historyAndFuture"),
                                disabled: monthsBack === 0,
                              },
                            ]}
                            fullWidth={false}
                          />
                        </Stack>
                        <Stack
                          direction={{ xs: "column", sm: "row" }}
                          spacing={{ xs: 0, sm: 1.5 }}
                          sx={{ mt: 0.5 }}
                        >
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={showChartIncome}
                                onChange={(event) => setShowChartIncome(event.target.checked)}
                              />
                            }
                            label={t("recurring.showIncome")}
                          />
                          <FormControlLabel
                            control={
                              <Switch
                                size="small"
                                checked={showChartExpectedIncome}
                                onChange={(event) =>
                                  setShowChartExpectedIncome(event.target.checked)
                                }
                              />
                            }
                            label={t("recurring.showExpectedIncome")}
                          />
                        </Stack>
                      </Paper>

                      <RecurringOverviewCharts
                        forecast={overviewForecast}
                        monthsForTypeSplit={3}
                        showTypeSplit={false}
                        showActualIncome={showChartIncome}
                        showExpectedIncome={showChartExpectedIncome}
                        title={
                          overviewRange === "withHistory"
                            ? t("recurring.historyExpectedPaid")
                            : t("recurring.expectedVsPaid")
                        }
                        subtitle={
                          overviewRange === "withHistory"
                            ? t("recurring.historySubtitle")
                            : t("recurring.futureSubtitle")
                        }
                      />
                    </Stack>
                  )}
                </Box>
                <NextBillsCard
                  nextBills={enrichedNextBills}
                  formatCurrency={formatCurrency}
                  onOpenPay={payDialog.openDialog}
                  onOpenMonth={ctrl.openMonth}
                  pending={payments.pending}
                />
              </Box>
            )}

            {activeSection === "months" && (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
                  alignItems: "start",
                }}
              >
                <ForecastSection
                  title={t("recurring.upcomingMonths")}
                  forecast={forecastFuture}
                  tab={ctrl.tab}
                  onTab={ctrl.setTab}
                  onOpenMonth={ctrl.openMonth}
                  maxRef={maxRef}
                  formatCurrency={formatCurrency}
                />

                <ForecastSection
                  title={t("recurring.history")}
                  forecast={forecastPast}
                  tab={ctrl.tab}
                  onTab={ctrl.setTab}
                  onOpenMonth={ctrl.openMonth}
                  maxRef={maxRef}
                  formatCurrency={formatCurrency}
                  pastMonths={monthsBack}
                  setPastMonths={setMonthsBack}
                  monthsForward={MONTHS_FORWARD}
                />
              </Box>
            )}

            {activeSection === "templates" && (
              <ExpenseTemplatesSection
                expenses={templates.expenses}
                templates={templates.expenses}
                formatCurrency={formatCurrency}
                onEdit={ctrl.openEdit}
                onDelete={ctrl.openDelete}
                showFinished={showFinished}
                onToggleShowFinished={() => setShowFinished((value) => !value)}
                onFinish={maintenance.archiveExpense}
                onRestore={maintenance.restoreExpense}
                onOpenTerms={maintenance.openTerms}
                onOpenPauseCreate={maintenance.openPauseCreate}
                onOpenPauseEdit={maintenance.openPauseEdit}
                onUnpause={maintenance.unpause}
              />
            )}

            {activeSection === "mortgages" && (
              <MortgageCenter
                mortgages={mortgages}
                formatCurrency={formatCurrency}
                onHardDeleteMortgage={maintenance.hardDeleteMortgage}
                onPurgeMortgages={maintenance.purgeMortgages}
              />
            )}
          </Box>
        </Box>

        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={900}>{t("recurring.advanced")}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                {t("recurring.advancedText")}
              </Typography>
              <Divider />
              <Button
                color="error"
                variant="outlined"
                onClick={() => maintenance.setPurgeOpen(true)}
                sx={{
                  alignSelf: { sm: "flex-start" },
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {t("recurring.deleteAll")}
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>

      <MonthDrawer
        open={ctrl.monthDrawerOpen}
        onClose={ctrl.closeMonth}
        selected={selectedMonth}
        expenses={templates.expenses}
        onOpenPay={payDialog.openDialog}
        onOpenTerms={maintenance.openTerms}
        onOpenPauseCreate={maintenance.openPauseCreate}
        onOpenPauseEdit={maintenance.openPauseEdit}
        onUnpause={maintenance.unpause}
        registerPaymentPending={payments.pending}
        registerPaymentError={payments.error}
        formatCurrency={formatCurrency}
      />

      <RecurringExpenseDialog
        open={ctrl.dialogOpen}
        mode={ctrl.dialogMode}
        expense={ctrl.expenseTarget}
        onClose={ctrl.closeDialog}
        onSuccess={invalidateAllRecurring}
        onError={() => {}}
      />

      <PayDialog
        open={payDialog.open}
        onClose={payDialog.closeDialog}
        title={payDialog.draft?.title}
        amount={payDialog.amount}
        onAmount={paymentActions.onAmount}
        paidDate={payDialog.paidDate}
        onPaidDate={paymentActions.onPaidDate}
        periodKey={payDialog.periodKey}
        onPeriodKey={paymentActions.onPeriodKey}
        isExtra={payDialog.isExtra}
        onIsExtra={paymentActions.onIsExtra}
        allowExtra={payDialog.allowExtra}
        error={payDialog.error}
        onConfirm={paymentActions.confirmPay}
        onDelete={payDialog.mode === "EDIT" ? paymentActions.deletePay : undefined}
        pending={payments.pending}
        mode={payDialog.mode}
      />

      <ChangeTermsDialog
        open={maintenance.termsOpen}
        onClose={maintenance.closeTerms}
        onSubmit={maintenance.submitTerms}
        expense={maintenance.termsItem}
        periodKey={maintenance.termsPk}
      />

      <PauseDialog
        open={maintenance.pauseOpen}
        mode={maintenance.pauseMode}
        onClose={maintenance.closePause}
        onSubmit={maintenance.submitPause}
        initial={maintenance.pauseInitial}
      />

      <PurgeAllRecurringDialog
        open={maintenance.purgeOpen}
        onClose={() => maintenance.setPurgeOpen(false)}
        onConfirm={maintenance.doPurgeAll}
      />
    </AppScreen>
  );
}
