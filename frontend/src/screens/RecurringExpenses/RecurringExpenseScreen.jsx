// src/screens/RecurringExpenses/RecurringExpenseScreen.jsx
import React, { useCallback, useMemo } from "react";
import axios from "axios";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { useMutation } from "@tanstack/react-query";

import { API_URL } from "../../components/commons/Consts/constants";
import { useRecurringController } from "../../components/features/RecurringExpenes/hooks/useRecurringController";
import RecurringExpenseDialog from "../../components/features/RecurringExpenes/components/RecurringExpenseDialog";
import { useRecurringInvalidation } from "../../components/features/RecurringExpenes/hooks/useRecurringData";
import RecurringOverviewCharts from "../../components/features/RecurringExpenes/components/RecurringOverviewCharts";

import { useRecurringSummary } from "./hooks/useRecurringSummary";
import { usePayDialog } from "./hooks/usePayDialog";
import { makeCurrencyFormatter } from "./utils/recurringFormatters";

import HeaderBar from "./components/HeaderBar";
import FiltersSummaryCard from "./components/FiltersSummaryCard";
import ForecastSection from "./components/ForecastSection";
import NextBillsCard from "./components/NextBillsCard";
import ExpenseTemplatesSection from "./components/ExpenseTemplatesSection";
import MonthDrawer from "./components/MonthDrawer";
import PayDialog from "./components/PayDialog";

export default function RecurringExpenseScreen() {
  const ctrl = useRecurringController();
  const { invalidateSummary } = useRecurringInvalidation();

  // Stable currency formatter
  const currencyFormatter = useMemo(() => makeCurrencyFormatter(), []);
  const formatCurrency = useCallback(
    (val) => currencyFormatter.format(Number(val || 0)),
    [currencyFormatter],
  );

  const {
    open: payDialogOpen,
    draft: payDraft,
    amount: payAmount,
    error: payAmountError,
    setAmount: setPayAmount,
    setError: setPayAmountError,
    openDialog: openPayDialog,
    closeDialog: closePayDialog,
  } = usePayDialog();

  const months = 12;

  // ✅ With select(), data is already shaped and has defaults
  const { data, isLoading, isError, error: loadError } = useRecurringSummary({
    filter: ctrl.filter,
    months,
    enabled: true,
  });

 

  const { expenses, forecast, nextBills, sum3 } = data;

   console.log("FORECAST FROM API:", forecast);

  const selected = useMemo(() => {
    if (!ctrl.selectedMonthKey) return null;
    return forecast.find((m) => m.key === ctrl.selectedMonthKey) ?? null;
  }, [forecast, ctrl.selectedMonthKey]);

  const maxRef = useMemo(() => {
    const vals = forecast.map((x) =>
      ctrl.tab === 1 ? x.paidTotal : x.expectedMax,
    );
    return Math.max(...vals, 1) || 1;
  }, [forecast, ctrl.tab]);

  const registerPayment = useMutation({
    mutationFn: async ({ recurringExpenseId, periodKey, amount }) => {
      const url = `${API_URL}/api/recurring-payments`;
      const payload = {
        recurringExpenseId,
        periodKey,
        amount: Number(amount || 0),
        paidDate: new Date().toISOString(),
        status: "PAID",
      };
      const res = await axios.post(url, payload);
      return res.data;
    },
    onSuccess: () => invalidateSummary(),
  });

  // Prefer depending on functions, not whole ctrl object
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

  const confirmPay = useCallback(() => {
    const n = Number(payAmount);
    if (!Number.isFinite(n) || n < 0) {
      setPayAmountError("Ugyldig beløp");
      return;
    }
    if (!payDraft?.recurringExpenseId || !payDraft?.periodKey) {
      setPayAmountError("Mangler data for betaling");
      return;
    }

    registerPayment.mutate(
      {
        recurringExpenseId: payDraft.recurringExpenseId,
        periodKey: payDraft.periodKey,
        amount: n,
      },
      { onSuccess: () => closePayDialog() },
    );
  }, [payAmount, payDraft, registerPayment, closePayDialog, setPayAmountError]);

  

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
                <Typography color="text.secondary">
                  Laster faste kostnader…
                </Typography>
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

          {/* ✅ this section now virtualizes internally via VirtuosoGrid when large */}
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
        registerPaymentPending={registerPayment.isPending}
        registerPaymentError={registerPayment.isError}
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
        error={payAmountError}
        onConfirm={confirmPay}
        pending={registerPayment.isPending}
      />
    </Box>
  );
}
