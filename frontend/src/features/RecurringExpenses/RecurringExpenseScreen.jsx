import React, { useCallback, useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import dayjs from "dayjs";

import HeaderBar from "./components/HeaderBar";
import FiltersSummaryCard from "./components/FiltersSummaryCard";
import RecurringOverviewCharts from "./components/RecurringOverviewCharts";
import NextBillsCard from "./components/NextBillsCard";
import PastMonthsSelect from "./components/PastMonthsSelect";
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

const MONTHS_FORWARD = 12;

const dueKey = (value) => {
  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD") : String(value ?? "");
};

export default function RecurringExpenseScreen() {
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

  const templates = useRecurringData({ enabled: true, includeInactive: true });
  const { data, isLoading, isError, error } = useRecurringSummary({
    filter: ctrl.filter,
    months: MONTHS_FORWARD,
    pastMonths: monthsBack,
    enabled: true,
  });

  const { expenses, forecast, nextBills, sum3 } = data || {
    expenses: [],
    forecast: [],
    nextBills: [],
    sum3: { min: 0, max: 0, paid: 0 },
  };

  const mortgages = useMemo(
    () =>
      (templates.expenses || []).filter(
        (expense) => String(expense.type).toUpperCase() === "MORTGAGE",
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

  const renderStatusCard = () =>
    (isLoading || isError) && (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          {isLoading && (
            <Typography color="text.secondary">
              Laster faste kostnader...
            </Typography>
          )}
          {isError && (
            <Typography color="error">
              Kunne ikke hente faste kostnader
              {error?.message ? `: ${error.message}` : "."}
            </Typography>
          )}
        </CardContent>
      </Card>
    );

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <HeaderBar onAdd={ctrl.openAdd} />

      <Box sx={{ px: { xs: 1.5, md: 3 }, pb: { xs: 2, md: 3 } }}>
        <FiltersSummaryCard
          filter={ctrl.filter}
          onFilter={ctrl.setFilter}
          sum3={sum3}
          formatCurrency={formatCurrency}
        />

        {renderStatusCard()}

        <Card sx={{ mt: 1.5, borderRadius: 2 }}>
          <CardContent sx={{ p: 0.5, "&:last-child": { pb: 0.5 } }}>
            <Tabs
              value={activeSection}
              onChange={(_, value) => setActiveSection(value)}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: 42,
                "& .MuiTabs-indicator": { display: "none" },
                "& .MuiTab-root": {
                  minHeight: 42,
                  borderRadius: 1.5,
                  mx: 0.25,
                  px: 1.75,
                },
                "& .Mui-selected": {
                  bgcolor: "action.selected",
                },
              }}
            >
              <Tab value="overview" label="Oversikt" />
              <Tab value="months" label="Måneder" />
              <Tab value="templates" label="Avtaler" />
              <Tab value="mortgages" label="Boliglån" />
            </Tabs>
          </CardContent>
        </Card>

        {activeSection === "overview" && (
          <Box
            sx={{
              mt: 2,
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1fr) minmax(390px, 430px)",
              },
              alignItems: "start",
            }}
          >
            <Box sx={{ minWidth: 0 }}>
              {!isLoading && !isError && (forecast?.length ?? 0) > 0 && (
                <RecurringOverviewCharts
                  forecast={forecastFuture}
                  monthsForTypeSplit={3}
                  showTypeSplit={false}
                />
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
          <Stack spacing={2} sx={{ mt: 2 }}>
            <Card>
              <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  justifyContent="space-between"
                  alignItems={{ xs: "stretch", sm: "center" }}
                  spacing={2}
                >
                  <Box>
                    <Typography fontWeight={900}>Periode</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Vis {monthsBack} måneder bakover og 12 måneder frem.
                    </Typography>
                  </Box>
                  <PastMonthsSelect
                    value={monthsBack}
                    onChange={setMonthsBack}
                  />
                </Stack>
              </CardContent>
            </Card>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", xl: "1fr 1fr" },
                alignItems: "start",
              }}
            >
              <ForecastSection
                title="Kommende måneder"
                forecast={forecastFuture}
                tab={ctrl.tab}
                onTab={ctrl.setTab}
                onOpenMonth={ctrl.openMonth}
                maxRef={maxRef}
                formatCurrency={formatCurrency}
              />

              <ForecastSection
                title="Historikk"
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
          </Stack>
        )}

        {activeSection === "templates" && (
          <Box sx={{ mt: 2 }}>
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
          </Box>
        )}

        {activeSection === "mortgages" && (
          <Stack spacing={2} sx={{ mt: 2 }}>
            <MortgageCenter
              mortgages={mortgages}
              formatCurrency={formatCurrency}
              onHardDeleteMortgage={maintenance.hardDeleteMortgage}
              onPurgeMortgages={maintenance.purgeMortgages}
            />
          </Stack>
        )}

        <Accordion sx={{ mt: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography fontWeight={900}>Avansert</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary">
                Bruk dette kun når du vil rydde all historikk og alle faste
                kostnader.
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
                Slett alt
              </Button>
            </Stack>
          </AccordionDetails>
        </Accordion>
      </Box>

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
    </Box>
  );
}
