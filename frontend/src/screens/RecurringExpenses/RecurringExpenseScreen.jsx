import React, { useCallback, useMemo } from "react";
import { Box, Card, CardContent, Typography } from "@mui/material";

import { useRecurringController } from "../../components/features/RecurringExpenes/hooks/useRecurringController";
import RecurringExpenseDialog from "../../components/features/RecurringExpenes/components/RecurringExpenseDialog";
import { useRecurringInvalidation } from "../../components/features/RecurringExpenes/hooks/useRecurringData";
import RecurringOverviewCharts from "../../components/features/RecurringExpenes/components/RecurringOverviewCharts";

import { useRecurringSummary } from "./hooks/useRecurringSummary";
import { usePayDialog } from "./hooks/usePayDialog";
import { useRecurringPayments } from "./hooks/useRecurringPayments";
import { makeCurrencyFormatter } from "./utils/recurringFormatters";

import HeaderBar from "./components/HeaderBar";
import FiltersSummaryCard from "./components/FiltersSummaryCard";
import ForecastSection from "./components/ForecastSection";
import NextBillsCard from "./components/NextBillsCard";
import ExpenseTemplatesSection from "./components/ExpenseTemplatesSection";
import MonthDrawer from "./components/MonthDrawer";
import PayDialog from "./components/PayDialog";

const isPeriodKey = (v) => /^\d{4}-\d{2}$/.test(String(v || ""));

export default function RecurringExpenseScreen() {
  const ctrl = useRecurringController();
  const payments = useRecurringPayments();
  const { invalidateSummary } = useRecurringInvalidation();

  const currencyFormatter = useMemo(() => makeCurrencyFormatter(), []);
  const formatCurrency = useCallback(
    (val) => currencyFormatter.format(Number(val || 0)),
    [currencyFormatter],
  );

  const {
    open: payDialogOpen,
    draft: payDraft,
    mode: payMode,
    amount: payAmount,
    paidDate: payPaidDate,
    periodKey: payPeriodKey,

    error: payAmountError,

    setAmount: setPayAmount,
    setPaidDate: setPayPaidDate,
    setPeriodKey: setPayPeriodKey,
    setError: setPayAmountError,

    openDialog: openPayDialog,
    closeDialog: closePayDialog,
  } = usePayDialog();

  const monthsForward = 12;
const monthsBack = 12;   // ⭐ history window

const { data, isLoading, isError, error: loadError } = useRecurringSummary({
  filter: ctrl.filter,
  months: monthsForward,
  pastMonths: monthsBack,
  enabled: true,
});
  const { expenses, forecast, nextBills, sum3 } = data || {
    expenses: [],
    forecast: [],
    nextBills: [],
    sum3: { min: 0, max: 0, paid: 0 },
  };

  const selected = useMemo(() => {
    if (!ctrl.selectedMonthKey) return null;
    return forecast.find((m) => m.key === ctrl.selectedMonthKey) ?? null;
  }, [forecast, ctrl.selectedMonthKey]);

  const maxRef = useMemo(() => {
    const vals = forecast.map((x) => (ctrl.tab === 1 ? x.paidTotal : x.expectedMax));
    return Math.max(...vals, 1) || 1;
  }, [forecast, ctrl.tab]);

  const onFilter = useCallback((f) => ctrl.setFilter(f), [ctrl.setFilter]);
  const onTab = useCallback((v) => ctrl.setTab(v), [ctrl.setTab]);
  const onOpenMonth = useCallback((key) => ctrl.openMonth(key), [ctrl.openMonth]);

  const onAmount = useCallback(
    (v) => {
      setPayAmount(v);
      setPayAmountError("");
    },
    [setPayAmount, setPayAmountError],
  );

  const onPaidDate = useCallback(
    (v) => {
      setPayPaidDate(v);
      setPayAmountError("");
    },
    [setPayPaidDate, setPayAmountError],
  );

  const onPeriodKey = useCallback(
    (v) => {
      setPayPeriodKey(v);
      setPayAmountError("");
    },
    [setPayPeriodKey, setPayAmountError],
  );

  const confirmPay = useCallback(async () => {
    const n = Number(payAmount);
    if (!Number.isFinite(n) || n < 0) {
      setPayAmountError("Ugyldig beløp");
      return;
    }

    if (!payDraft?.recurringExpenseId) {
      setPayAmountError("Mangler recurringExpenseId");
      return;
    }

    if (!payPeriodKey || !isPeriodKey(payPeriodKey)) {
      setPayAmountError("Ugyldig måned (YYYY-MM)");
      return;
    }

    if (!payPaidDate) {
      setPayAmountError("Mangler betalt dato");
      return;
    }

    // ✅ EDIT
    if (payMode === "EDIT") {
      if (!payDraft?.paymentId) {
        setPayAmountError("Mangler paymentId");
        return;
      }

      const originalPk = payDraft.originalPeriodKey;

      // If user changed month, "move" payment:
      // 1) upsert into the new periodKey
      // 2) delete old payment doc
      if (originalPk && originalPk !== payPeriodKey) {
        try {
          await payments.createPayment.mutateAsync({
            recurringExpenseId: payDraft.recurringExpenseId,
            periodKey: payPeriodKey,
            amount: n,
            paidDate: payPaidDate,
          });

          await payments.deletePayment.mutateAsync({
            paymentId: payDraft.paymentId,
          });

          closePayDialog();
        } catch (e) {
          setPayAmountError("Kunne ikke flytte betalingen");
        }
        return;
      }

      // Normal edit (amount/date only)
      payments.updatePayment.mutate(
        {
          paymentId: payDraft.paymentId,
          amount: n,
          paidDate: payPaidDate,
        },
        { onSuccess: () => closePayDialog() },
      );
      return;
    }

    // ✅ CREATE/UPSERT (expenseId + periodKey)
    payments.createPayment.mutate(
      {
        recurringExpenseId: payDraft.recurringExpenseId,
        periodKey: payPeriodKey,
        amount: n,
        paidDate: payPaidDate,
      },
      { onSuccess: () => closePayDialog() },
    );
  }, [
    payAmount,
    payDraft,
    payPaidDate,
    payPeriodKey,
    payMode,
    payments,
    closePayDialog,
    setPayAmountError,
  ]);

  const deletePay = useCallback(() => {
    if (!payDraft?.paymentId) {
      setPayAmountError("Mangler paymentId");
      return;
    }

    payments.deletePayment.mutate(
      { paymentId: payDraft.paymentId },
      { onSuccess: () => closePayDialog() },
    );
  }, [payDraft, payments, closePayDialog, setPayAmountError]);

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      <HeaderBar onAdd={ctrl.openAdd} />

      <Box sx={{ px: { xs: 2, md: 3 }, pb: 2 }}>
        <FiltersSummaryCard
          filter={ctrl.filter}
          onFilter={onFilter}
          sum3={sum3}
          formatCurrency={formatCurrency}
        />

        {!isLoading && !isError && forecast.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <RecurringOverviewCharts forecast={forecast} monthsForTypeSplit={3} />
          </Box>
        )}

        {(isLoading || isError) && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              {isLoading && (
                <Typography color="text.secondary">Laster faste kostnader…</Typography>
              )}
              {isError && (
                <Typography color="error">
                  Kunne ikke hente faste kostnader
                  {loadError?.message ? `: ${loadError.message}` : "."}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            alignItems: "start",
          }}
        >
          <ForecastSection
            forecast={forecast}
            tab={ctrl.tab}
            onTab={onTab}
            onOpenMonth={onOpenMonth}
            maxRef={maxRef}
            formatCurrency={formatCurrency}
          />

          <NextBillsCard nextBills={nextBills} formatCurrency={formatCurrency} />

          <ExpenseTemplatesSection
            expenses={expenses}
            onEdit={ctrl.openEdit}
            onDelete={ctrl.openDelete}
            formatCurrency={formatCurrency}
          />
        </Box>
      </Box>

      <MonthDrawer
        open={ctrl.monthDrawerOpen}
        onClose={ctrl.closeMonth}
        selected={selected}
        onOpenPay={openPayDialog}
        registerPaymentPending={payments.pending}
        registerPaymentError={payments.error}
        formatCurrency={formatCurrency}
      />

      <RecurringExpenseDialog
        open={ctrl.dialogOpen}
        mode={ctrl.dialogMode}
        expense={ctrl.expenseTarget}
        onClose={ctrl.closeDialog}
        onSuccess={() => invalidateSummary()}
        onError={() => {}}
      />

      <PayDialog
        open={payDialogOpen}
        onClose={closePayDialog}
        title={payDraft?.title}
        amount={payAmount}
        onAmount={onAmount}
        paidDate={payPaidDate}
        onPaidDate={onPaidDate}
        periodKey={payPeriodKey}
        onPeriodKey={onPeriodKey}
        error={payAmountError}
        onConfirm={confirmPay}
        onDelete={payMode === "EDIT" ? deletePay : undefined}
        pending={payments.pending}
        mode={payMode}
      />
    </Box>
  );
}
