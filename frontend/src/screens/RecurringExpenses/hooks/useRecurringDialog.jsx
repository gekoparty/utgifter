// src/screens/RecurringExpenses/hooks/useRecurringDialog.js
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCustomHttp from "../../../hooks/useHttp";
import { StoreContext } from "../../../Store/Store";
import { formatComponentFields } from "../../../components/commons/Utils/FormatUtil";
import { recurringExpenseValidationSchema } from "../../../validation/validationSchema";
import {
  RECURRING_EXPENSES_QUERY_KEY,
  RECURRING_EXPENSES_SUMMARY_ROOT_KEY,
} from "./useRecurringData";

const currentMonth = () => new Date().getMonth() + 1;

const INITIAL = {
  title: "",
  type: "UTILITY",
  amountMode: "FIXED",
  amount: "",
  estimateMin: "",
  estimateMax: "",
  dueDate: "",
  billingIntervalMonths: 1,
  startMonth: currentMonth(),
  mortgageHolder: "",
  mortgageKind: "Hus",
  remainingBalance: "",
  interestRate: "",
  hasMonthlyFee: false,
  monthlyFee: "",
};

const RESOURCE = "recurring-expenses";

const toNumber = (value) => {
  if (value === "" || value == null) return 0;
  return Number(value);
};

const clampDueDay = (day, type) => {
  const max = type === "MORTGAGE" ? 31 : 28;
  return Math.min(max, Math.max(1, Number(day || 1)));
};

const dateFromDueDay = (dueDay, type) => {
  if (!dueDay) return "";
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), clampDueDay(dueDay, type))
    .toISOString()
    .slice(0, 10);
};

const dueDateToDueDay = (dueDateStr, type) => {
  if (!dueDateStr) return 1;
  const date = new Date(dueDateStr);
  if (Number.isNaN(date.getTime())) return 1;
  return clampDueDay(date.getDate(), type);
};

const getAmountMode = (initial) => {
  const amount = Number(initial?.amount ?? initial?.monthlyPayment ?? initial?.total ?? 0);
  const estimateMin = Number(initial?.estimateMin ?? initial?.estimate?.min ?? 0);
  const estimateMax = Number(initial?.estimateMax ?? initial?.estimate?.max ?? 0);
  return amount > 0 || (!estimateMin && !estimateMax) ? "FIXED" : "ESTIMATE";
};

const buildFormFromInitial = (initial) => {
  if (!initial) return { ...INITIAL, startMonth: currentMonth() };

  const id = initial._id || initial.id;
  const type = initial.type === "HOUSING" ? "MORTGAGE" : (initial.type ?? "UTILITY");
  const amount = initial.amount ?? initial.monthlyPayment ?? initial.total ?? "";
  const dueDate = initial.dueDate || dateFromDueDay(initial.dueDay, type);

  return {
    ...INITIAL,
    ...initial,
    _id: id,
    id,
    title: initial.title ?? "",
    type,
    amountMode: getAmountMode(initial),
    amount: amount === 0 ? "" : amount,
    estimateMin: initial.estimateMin ?? initial.estimate?.min ?? "",
    estimateMax: initial.estimateMax ?? initial.estimate?.max ?? "",
    dueDate,
    billingIntervalMonths: Number(initial.billingIntervalMonths || 1),
    startMonth: Number(initial.startMonth || currentMonth()),
    mortgageHolder: initial.mortgageHolder ?? "",
    mortgageKind: initial.mortgageKind ?? "Hus",
    remainingBalance: initial.remainingBalance ?? initial.remaining ?? "",
    interestRate: initial.interestRate ?? "",
    hasMonthlyFee: Boolean(
      initial.hasMonthlyFee ?? Number(initial.monthlyFee || 0) > 0,
    ),
    monthlyFee: initial.monthlyFee ?? "",
  };
};

const buildBackendPayload = (form) => {
  const isMortgage = form.type === "MORTGAGE";
  const usesEstimate = !isMortgage && form.amountMode === "ESTIMATE";

  const payload = {
    title: formatComponentFields(form.title, "category", "name"),
    type: form.type,
    dueDay: dueDateToDueDay(form.dueDate, form.type),
    firstPaymentMonth:
      isMortgage && String(form.dueDate || "").length >= 7
        ? String(form.dueDate).slice(0, 7)
        : "",
    amount: usesEstimate ? 0 : toNumber(form.amount),
    estimateMin: usesEstimate ? toNumber(form.estimateMin) : 0,
    estimateMax: usesEstimate ? toNumber(form.estimateMax) : 0,
    billingIntervalMonths: isMortgage ? 1 : Number(form.billingIntervalMonths || 1),
    startMonth: Number(form.startMonth || currentMonth()),
    mortgageHolder: formatComponentFields(form.mortgageHolder, "brand", "name"),
    mortgageKind: formatComponentFields(form.mortgageKind, "category", "name"),
    remainingBalance: toNumber(form.remainingBalance),
    interestRate: toNumber(form.interestRate),
    hasMonthlyFee: Boolean(form.hasMonthlyFee),
    monthlyFee: form.hasMonthlyFee ? toNumber(form.monthlyFee) : 0,
  };

  if (!isMortgage) {
    delete payload.mortgageHolder;
    delete payload.mortgageKind;
    delete payload.remainingBalance;
    delete payload.interestRate;
    delete payload.hasMonthlyFee;
    delete payload.monthlyFee;
  }

  return payload;
};

export default function useRecurringDialog({ open, mode, initial }) {
  const queryClient = useQueryClient();
  const { dispatch, state } = useContext(StoreContext);

  const { sendRequest, loading: httpLoading } = useCustomHttp(
    "/api/recurring-expenses",
    { auto: false },
  );

  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";
  const id = initial?._id || initial?.id;
  const initKey = id || "ADD";

  const [form, _setForm] = useState(() => buildFormFromInitial(initial));
  const [hasInitialized, setHasInitialized] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const setForm = useCallback((updater) => {
    setIsDirty(true);
    _setForm(updater);
  }, []);

  useEffect(() => {
    if (!open) return;
    setHasInitialized(false);
    setIsDirty(false);
    _setForm(buildFormFromInitial(initial));
  }, [open, initKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || !id) return;
    if (!hasInitialized && !isDirty) {
      _setForm(buildFormFromInitial(initial));
      setHasInitialized(true);
    }
  }, [open, id, initial, hasInitialized, isDirty]);

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: RESOURCE });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: RESOURCE });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setHasInitialized(false);
    setIsDirty(false);
    _setForm(buildFormFromInitial(initial));
    resetServerError();
    resetValidationErrors();
  }, [initial, resetServerError, resetValidationErrors]);

  const refreshRecurringQueries = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSES_QUERY_KEY });
    queryClient.invalidateQueries({
      queryKey: RECURRING_EXPENSES_SUMMARY_ROOT_KEY,
    });
  }, [queryClient]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit ? `/api/recurring-expenses/${id}` : "/api/recurring-expenses";
      const method = isEdit ? "PUT" : "POST";
      const { data, error } = await sendRequest(url, method, payload);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      refreshRecurringQueries();
      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error,
        resource: RESOURCE,
        showError: true,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (deleteId) => {
      const { error } = await sendRequest(
        `/api/recurring-expenses/${deleteId}`,
        "DELETE",
      );
      if (error) throw error;
      return deleteId;
    },
    onSuccess: () => {
      refreshRecurringQueries();
      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error,
        resource: RESOURCE,
        showError: true,
      });
    },
  });

  const handleSave = useCallback(async () => {
    resetServerError();
    resetValidationErrors();

    const payload = buildBackendPayload(form);

    try {
      await recurringExpenseValidationSchema.validate(payload, {
        abortEarly: false,
      });
      const saved = await saveMutation.mutateAsync(payload);

      if (!isEdit) {
        setForm({ ...INITIAL, startMonth: currentMonth() });
      }

      return saved;
    } catch (error) {
      if (error?.name === "ValidationError") {
        const errors = {};
        (error.inner ?? []).forEach((err) => {
          if (!err?.path) return;
          errors[err.path] = { show: true, message: err.message };
        });

        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: RESOURCE,
          validationErrors: {
            ...(state.validationErrors?.[RESOURCE] ?? {}),
            ...errors,
          },
          showError: true,
        });
      }
      return false;
    }
  }, [
    form,
    isEdit,
    saveMutation,
    dispatch,
    state.validationErrors,
    resetServerError,
    resetValidationErrors,
    setForm,
  ]);

  const handleDelete = useCallback(
    async (expenseToDelete) => {
      const deleteId = expenseToDelete?._id || expenseToDelete?.id;
      if (!deleteId) return false;

      resetServerError();
      resetValidationErrors();

      try {
        await deleteMutation.mutateAsync(deleteId);
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation, resetServerError, resetValidationErrors],
  );

  const displayError = state.error?.[RESOURCE];
  const validationError = state.validationErrors?.[RESOURCE];

  const isFormValid = useCallback(() => {
    if (!form.title?.trim() || !form.dueDate) return false;

    if (form.type === "MORTGAGE") {
      if (!form.mortgageHolder?.trim() || !form.mortgageKind?.trim()) return false;
      if (toNumber(form.amount) <= 0) return false;
      if (toNumber(form.remainingBalance) <= 0) return false;
      if (toNumber(form.interestRate) < 0) return false;
      if (form.hasMonthlyFee && toNumber(form.monthlyFee) < 0) return false;
      return true;
    }

    if (form.amountMode === "ESTIMATE") {
      return toNumber(form.estimateMin) > 0 &&
        toNumber(form.estimateMax) >= toNumber(form.estimateMin);
    }

    return toNumber(form.amount) > 0;
  }, [form]);

  const loading = httpLoading || saveMutation.isPending || deleteMutation.isPending;

  return useMemo(
    () => ({
      form,
      setForm,
      loading,
      isEdit,
      isDelete,
      displayError,
      validationError,
      isFormValid,
      handleSave,
      handleDelete,
      resetFormAndErrors,
      resetServerError,
      resetValidationErrors,
    }),
    [
      form,
      setForm,
      loading,
      isEdit,
      isDelete,
      displayError,
      validationError,
      isFormValid,
      handleSave,
      handleDelete,
      resetFormAndErrors,
      resetServerError,
      resetValidationErrors,
    ],
  );
}
