// src/components/features/RecurringExpenes/hooks/useRecurringDialog.js
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { StoreContext } from "../../../../Store/Store";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { recurringExpenseValidationSchema } from "../../../../validation/validationSchema";
import {
  RECURRING_EXPENSES_QUERY_KEY,
  RECURRING_EXPENSES_SUMMARY_ROOT_KEY,
} from "./useRecurringData";

const INITIAL = {
  title: "",
  type: "UTILITY",
  amount: 0,
  estimateMin: 0,
  estimateMax: 0,
  dueDate: "",
 
billingIntervalMonths: 1,
startMonth: new Date().getMonth() + 1,
  mortgageHolder: "",
  mortgageKind: "Hus",
  remainingBalance: 0,
  interestRate: 0,
  hasMonthlyFee: false,
  monthlyFee: 0,
};

// resource name for StoreContext errors
const RESOURCE = "recurring-expenses";

const clampDueDay = (d) => Math.min(28, Math.max(1, Number(d || 1)));

const dueDateToDueDay = (dueDateStr) => {
  if (!dueDateStr) return 1;
  const d = new Date(dueDateStr);
  if (Number.isNaN(d.getTime())) return 1;
  return clampDueDay(d.getDate());
};

const buildFormFromInitial = (initial) => {
  if (!initial) return { ...INITIAL };

  const id = initial._id || initial.id;

const baseAmount =
initial.amount ?? initial.monthlyPayment ?? initial.total ?? 0;

  // backend might store dueDay; convert to a stable date for the date input
  const dueDate =
    initial.dueDate ||
    (initial.dueDay
      ? new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          clampDueDay(initial.dueDay),
        )
          .toISOString()
          .slice(0, 10)
      : "");

  return {
    ...INITIAL,
    ...initial,
    _id: id, // keep for edit
    id,

    title: initial.title ?? "",
    type: initial.type === "HOUSING" ? "MORTGAGE" : (initial.type ?? "UTILITY"),

    amount: Number(baseAmount || 0),
    estimateMin: Number(initial.estimateMin ?? initial.estimate?.min ?? 0),
    estimateMax: Number(initial.estimateMax ?? initial.estimate?.max ?? 0),

    dueDate,

    mortgageHolder: initial.mortgageHolder ?? "",
    mortgageKind: initial.mortgageKind ?? "Hus",
    remainingBalance: Number(
      initial.remainingBalance ?? initial.remaining ?? 0,
    ),
    interestRate: Number(initial.interestRate ?? 0),
    hasMonthlyFee: Boolean(
      initial.hasMonthlyFee ?? Number(initial.monthlyFee || 0) > 0,
    ),
    monthlyFee: Number(initial.monthlyFee ?? 0),
  };
};

const buildBackendPayload = (form) => {
  const payload = {
    title: formatComponentFields(form.title, "category", "name"),
    type: form.type,

    // backend: store day-of-month, not full date
    dueDay: dueDateToDueDay(form.dueDate),

    amount: Number(form.amount || 0),
    estimateMin: Number(form.estimateMin || 0),
    estimateMax: Number(form.estimateMax || 0),
    billingIntervalMonths: Number(form.billingIntervalMonths || 1),
   startMonth: Number(form.startMonth || new Date().getMonth() + 1),
    mortgageHolder: formatComponentFields(form.mortgageHolder, "brand", "name"),
    mortgageKind: formatComponentFields(form.mortgageKind, "category", "name"),
    remainingBalance: Number(form.remainingBalance || 0),
    interestRate: Number(form.interestRate || 0),
    hasMonthlyFee: Boolean(form.hasMonthlyFee),
    monthlyFee: form.hasMonthlyFee ? Number(form.monthlyFee || 0) : 0,
  };

  // clean fields by type
  if (payload.type !== "MORTGAGE") {
    delete payload.mortgageHolder;
    delete payload.mortgageKind;
    delete payload.remainingBalance;
    delete payload.interestRate;
    delete payload.hasMonthlyFee;
    delete payload.monthlyFee;
  } else {
    // mortgage does not use estimate range
    payload.estimateMin = 0;
    payload.estimateMax = 0;
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
    if (!open) return;
    if (!id) return;
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

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
         const url = isEdit
       ? `/api/recurring-expenses/${id}`
               : "/api/recurring-expenses";
      const method = isEdit ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, payload);
      if (error)
        throw new Error(error.message || "Kunne ikke lagre fast kostnad");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSES_QUERY_KEY });
           // ✅ also refresh the summary screen data
     queryClient.invalidateQueries({
       queryKey: RECURRING_EXPENSES_SUMMARY_ROOT_KEY,
      });

      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
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
      if (error)
        throw new Error(error.message || "Kunne ikke slette fast kostnad");
      return deleteId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECURRING_EXPENSES_QUERY_KEY });
            // ✅ also refresh the summary screen data
     queryClient.invalidateQueries({
        queryKey: RECURRING_EXPENSES_SUMMARY_ROOT_KEY,
      });
      resetServerError();
      resetValidationErrors();
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
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

      // ADD: reset
      if (!isEdit) {
        setForm({ ...INITIAL });
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
    // fast UI gate; Yup is ultimate
    if (!form.title?.trim()) return false;
    if (!form.dueDate) return false;

    if (form.type === "MORTGAGE") {
      if (!form.mortgageHolder?.trim()) return false;
      if (!form.mortgageKind?.trim()) return false;
      if (Number(form.amount || 0) <= 0) return false;
      if (Number(form.remainingBalance || 0) <= 0) return false;
      if (Number(form.interestRate ?? -1) < 0) return false;
      if (form.hasMonthlyFee && Number(form.monthlyFee || 0) < 0) return false;
      return true;
    }

    const amountOk = Number(form.amount || 0) > 0;
    const estOk =
      Number(form.estimateMin || 0) > 0 &&
      Number(form.estimateMax || 0) >= Number(form.estimateMin || 0);
    return amountOk || estOk;
  }, [form]);

    const loading =
    httpLoading || saveMutation.isPending || deleteMutation.isPending;

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
