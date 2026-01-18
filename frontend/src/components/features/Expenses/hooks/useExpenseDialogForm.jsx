import { useCallback, useEffect, useMemo, useReducer, useRef, useState, use } from "react";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import useCustomHttp from "../../../../hooks/useHttp";
import { StoreContext } from "../../../../Store/Store";
import { addExpenseValidationSchema } from "../../../../validation/validationSchema";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { computeDerivedExpense } from "./expenseDerived";

const API_EXPENSES = "/api/expenses";
const EXPENSES_QUERY_KEY = ["expenses", "paginated"];

const INITIAL_EXPENSE_STATE = {
  measurementUnit: "",
  productName: "",
  shopName: "",
  brandName: "",
  locationName: "",
  quantity: 1,
  volume: 0,
  price: 0,
  hasDiscount: false,
  discountValue: 0,
  discountAmount: 0,
  finalPrice: 0,
  purchased: true,
  purchaseDate: dayjs().format(),
  registeredDate: null,
  type: "",
  pricePerUnit: 0,
  variant: "",
};

const expenseReducer = (state, action) => {
  switch (action.type) {
    case "INIT":
      return action.payload;
    case "SET":
      return typeof action.payload === "function" ? action.payload(state) : action.payload;
    case "RESET":
      return action.payload;
    default:
      return state;
  }
};

export const useExpenseDialogForm = ({ open, mode, expenseToEdit }) => {
  const queryClient = useQueryClient();
  const isMounted = useRef(true);

  const { dispatch: storeDispatch } = use(StoreContext);
  const { sendRequest, loading: httpLoading } = useCustomHttp(API_EXPENSES, { auto: false });

  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";
  const editId = expenseToEdit?._id;

  const [validationErrors, setValidationErrors] = useState({});

  const [expense, dispatchExpense] = useReducer(
    expenseReducer,
    computeDerivedExpense({ ...INITIAL_EXPENSE_STATE })
  );

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Init when opened
  useEffect(() => {
    if (!open) return;

    setValidationErrors({});
    storeDispatch({ type: "RESET_ERROR", resource: "expenses" });

    if (isEdit && expenseToEdit?._id) {
      dispatchExpense({
        type: "INIT",
        payload: computeDerivedExpense({ ...INITIAL_EXPENSE_STATE, ...expenseToEdit }),
      });
      return;
    }

    if (!isDelete) {
      dispatchExpense({
        type: "RESET",
        payload: computeDerivedExpense({ ...INITIAL_EXPENSE_STATE }),
      });
    }
  }, [open, isEdit, isDelete, expenseToEdit?._id, storeDispatch]);

  const setExpense = useCallback((updater) => {
    dispatchExpense({
      type: "SET",
      payload: (prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        return computeDerivedExpense(next);
      },
    });
  }, []);

  const resetForm = useCallback(() => {
    dispatchExpense({
      type: "RESET",
      payload: computeDerivedExpense({ ...INITIAL_EXPENSE_STATE }),
    });
    setValidationErrors({});
    storeDispatch({ type: "RESET_ERROR", resource: "expenses" });
  }, [storeDispatch]);

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      const url = isEdit ? `${API_EXPENSES}/${editId}` : API_EXPENSES;
      const method = isEdit ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, payload);
      if (error) throw new Error(error.message || "Lagring feilet");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await sendRequest(`${API_EXPENSES}/${id}`, "DELETE");
      if (error) throw new Error(error.message || "Sletting feilet");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPENSES_QUERY_KEY });
    },
  });

  const handleSaveExpense = useCallback(async () => {
    setValidationErrors({});
    storeDispatch({ type: "RESET_ERROR", resource: "expenses" });

    try {
      // Format the three “mapped” fields the same way you do elsewhere
      const formatted = {
        ...expense,
        productName: formatComponentFields(expense.productName, "expense", "productName"),
        brandName: formatComponentFields(expense.brandName, "expense", "brandName"),
        shopName: formatComponentFields(expense.shopName, "expense", "shopName"),
        purchaseDate: expense.purchased ? expense.purchaseDate : null,
        registeredDate: !expense.purchased ? expense.registeredDate : null,
      };

      await addExpenseValidationSchema.validate(formatted, { abortEarly: false });

      const saved = await saveMutation.mutateAsync(formatted);

      return {
        ...saved,
        productName: saved?.productName || formatted.productName || "Ukjent produkt",
      };
    } catch (err) {
      if (!isMounted.current) return false;

      if (err?.name === "ValidationError") {
        const errors = {};
        err.inner?.forEach((e) => {
          if (!e.path) return;
          errors[e.path] = e.message;
        });
        setValidationErrors(errors);
        return false;
      }

      return false;
    }
  }, [expense, saveMutation, storeDispatch]);

  const handleDeleteExpense = useCallback(
    async (id) => {
      try {
        await deleteMutation.mutateAsync(id);
        return true;
      } catch {
        return false;
      }
    },
    [deleteMutation]
  );

  const isFormValid = useMemo(() => {
    const required = ["productName", "brandName", "shopName"];
    const okStrings = required.every((k) => expense?.[k] && String(expense[k]).trim().length > 0);
    const okNumbers = Number(expense.price) > 0 && Number(expense.volume) > 0;
    const noErrors = Object.keys(validationErrors).length === 0;
    return okStrings && okNumbers && noErrors;
  }, [expense, validationErrors]);

  const loading = httpLoading || saveMutation.isPending || deleteMutation.isPending;

  return {
    expense,
    setExpense,
    resetForm,
    loading,
    isFormValid,
    validationErrors,
    handleSaveExpense,
    handleDeleteExpense,
  };
};
