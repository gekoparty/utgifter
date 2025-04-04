import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  useReducer,
  useRef,
} from "react";
import dayjs from "dayjs";
import { StoreContext } from "../../../../Store/Store";
import useFetchData from "../../../../hooks/useFetchData";
import { addExpenseValidationSchema } from "../../../../validation/validationSchema";
import useCustomHttp from "../../../../hooks/useHttp";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ----------------------------------------------------------------------------
// API-endepunkter
// ----------------------------------------------------------------------------
const API_ENDPOINTS = {
  products: "/api/products",
  brands: "/api/brands",
  shops: "/api/shops",
  expenses: "/api/expenses",
  locations: "/api/locations",
};

// ----------------------------------------------------------------------------
// Reducer for expense form handling
// ----------------------------------------------------------------------------
const expenseReducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return action.initialState;
    case "INIT":
      return { ...action.payload };
    case "SET_EXPENSE":
      return typeof action.payload === "function"
        ? action.payload(state)
        : action.payload;
    case "DELETE_EXPENSE":
      return {
        ...state,
        expenses: state.expenses.filter((exp) => exp._id !== action.payload),
      };
    default:
      return state;
  }
};

// ----------------------------------------------------------------------------
// Standard expense state
// ----------------------------------------------------------------------------
const createDefaultExpenseState = () => ({
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
});

// ----------------------------------------------------------------------------
// Helper function: fetch shop data with location name
// ----------------------------------------------------------------------------
const fetchShopsData = async (data, locationsEndpoint) => {
  const controller = new AbortController();
  const signal = controller.signal;

  try {
    const shops = Array.isArray(data) ? data : data?.shops || [];
    return await Promise.all(
      shops.map(async (shop) => {
        const res = await fetch(`${locationsEndpoint}/${shop.location}`, {
          signal,
        });
        if (!res.ok) throw new Error("Kunne ikke hente sted");
        const location = await res.json();
        return { ...shop, locationName: location.name };
      })
    );
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Feil ved henting av butikksteder:", error);
    }
    return [];
  }
};

// ----------------------------------------------------------------------------
// Custom hook: useExpenseForm
// ----------------------------------------------------------------------------
const useExpenseForm = (initialExpense = null, expenseId = null) => {
  const queryClient = useQueryClient();

  // --------------------------------------------------------------------------
  // Initial State Setup
  // --------------------------------------------------------------------------
  const defaultExpenseState = useMemo(createDefaultExpenseState, []);
  const initialFormState = initialExpense || defaultExpenseState;

  const [expense, dispatchExpense] = useReducer(expenseReducer, initialFormState);
  const [validationErrors, setValidationErrors] = useState({});

  // --------------------------------------------------------------------------
  // HTTP and Global Store Hooks
  // --------------------------------------------------------------------------
  const { sendRequest, loading } = useCustomHttp(API_ENDPOINTS.expenses);
  const { dispatch: storeDispatch } = useContext(StoreContext);

  // ----------------------------------------------------------------------------
  // Helper to update expense state
  // ----------------------------------------------------------------------------
  const setExpense = useCallback((updateFn) => {
    dispatchExpense({ type: "SET_EXPENSE", payload: updateFn });
  }, []);

  // --------------------------------------------------------------------------
  // Data Fetching Configuration
  // --------------------------------------------------------------------------
  const fetchConfig = useMemo(() => ({
    enabled: Boolean(expenseId && !initialExpense),
  }), [expenseId, initialExpense]);

  const { data: products } = useFetchData(
    "products",
    API_ENDPOINTS.products,
    null,
    fetchConfig
  );
  const { data: brands } = useFetchData(
    "brands",
    API_ENDPOINTS.brands,
    null,
    fetchConfig
  );
  const { data: shops } = useFetchData(
    "shops",
    API_ENDPOINTS.shops,
    (data) => fetchShopsData(data, API_ENDPOINTS.locations),
    fetchConfig
  );

  const { data: expenseData } = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: () => sendRequest(`${API_ENDPOINTS.expenses}/${expenseId}`),
    enabled: Boolean(expenseId && expenseId.trim() !== "" && !initialExpense),
    initialData: initialExpense,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });

  // Initialize form state with fetched expense data.
  useEffect(() => {
    if (expenseData) {
      dispatchExpense({ type: "INIT", payload: expenseData });
    }
  }, [expenseData]);

  // --------------------------------------------------------------------------
  // Form Operation Helpers
  // --------------------------------------------------------------------------
  const resetForm = useCallback(() => {
    dispatchExpense({ type: "RESET", initialState: defaultExpenseState });
    storeDispatch({ type: "RESET_ERROR", resource: "expenses" });
    setValidationErrors({});
  }, [defaultExpenseState, storeDispatch]);

  // --------------------------------------------------------------------------
  // Prevent state updates on unmounted components
  // --------------------------------------------------------------------------
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ----------------------------------------------------------------------------
  // Mutation for saving an expense with optimistic updates.
  // ----------------------------------------------------------------------------
  const saveExpenseMutation = useMutation({
    mutationFn: async (payload) => {
      const method = initialExpense ? "PUT" : "POST";
      const url = initialExpense
        ? `${API_ENDPOINTS.expenses}/${initialExpense._id}`
        : API_ENDPOINTS.expenses;
      const { data } = await sendRequest(url, method, payload);
      return data;
    },
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: ["expenses"] });
      const previousExpenses = queryClient.getQueryData(["expenses"]);
      if (previousExpenses) {
        queryClient.setQueryData(["expenses"], (old) => {
          if (initialExpense) {
            return old.map(exp =>
              exp._id === initialExpense._id ? { ...exp, ...newExpense } : exp
            );
          }
          return [...old, { ...newExpense, _id: `temp-${Date.now()}` }];
        });
      }
      return { previousExpenses };
    },
    onError: (error, newExpense, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(["expenses"], context.previousExpenses);
      }
      storeDispatch({
        type: "SET_ERROR",
        resource: "expenses",
        error: { message: "Kunne ikke lagre utgift. Vennligst prøv igjen." },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onSuccess: (result, newExpense) => {
      // Ensure the returned expense includes a valid productName.
      // If not, fallback to the current form state's productName.
      const updatedExpense = {
        ...result,
        productName: result.productName || expense.productName || "Ukjent produkt",
      };
      return updatedExpense;
    },
  });

  // ----------------------------------------------------------------------------
  // Mutation for deleting an expense with optimistic updates.
  // ----------------------------------------------------------------------------
  const deleteExpenseMutation = useMutation({
    mutationFn: async (expenseId) => {
      await sendRequest(`${API_ENDPOINTS.expenses}/${expenseId}`, "DELETE");
      return expenseId;
    },
    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: ["expenses"] });
      const previousExpenses = queryClient.getQueryData(["expenses"]);
      if (previousExpenses) {
        queryClient.setQueryData(["expenses"], (old) =>
          old.filter((exp) => exp._id !== expenseId)
        );
      }
      return { previousExpenses };
    },
    onError: (error, expenseId, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(["expenses"], context.previousExpenses);
      }
      storeDispatch({
        type: "SET_ERROR",
        resource: "expenses",
        error: { message: "Kunne ikke slette utgift. Vennligst prøv igjen." },
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
  });

  // ----------------------------------------------------------------------------
  // Expense Save and Delete Handlers
  // ----------------------------------------------------------------------------
  const handleSaveExpense = useCallback(async () => {
    try {
      const payload = {
        ...expense,
        purchaseDate: expense.purchased ? expense.purchaseDate : null,
        registeredDate: !expense.purchased ? expense.registeredDate : null,
      };

      await addExpenseValidationSchema.validate(payload, { abortEarly: false });

      const result = await saveExpenseMutation.mutateAsync(payload);
      // Return an object that always includes a proper productName.
      return {
        ...result,
        productName: result.productName || expense.productName || "Ukjent produkt",
      };
    } catch (error) {
      if (isMountedRef.current) {
        if (error.name === "ValidationError") {
          const errors = error.inner.reduce(
            (acc, err) => ({ ...acc, [err.path]: err.message }),
            {}
          );
          setValidationErrors(errors);
        } else {
          storeDispatch({
            type: "SET_ERROR",
            resource: "expenses",
            error: { message: "Kunne ikke lagre utgift. Vennligst prøv igjen." },
          });
        }
      }
      throw error;
    }
  }, [expense, saveExpenseMutation]);

  const handleDeleteExpense = useCallback(
    async (expenseId) => {
      try {
        await deleteExpenseMutation.mutateAsync(expenseId);
        return true;
      } catch (error) {
        return false;
      }
    },
    [deleteExpenseMutation]
  );

  // ----------------------------------------------------------------------------
  // Form Validation
  // ----------------------------------------------------------------------------
  const isFormValid = useMemo(() => {
    const requiredFields = ["productName", "brandName", "shopName"];
    const areRequiredFieldsFilled = requiredFields.every((field) =>
      expense[field]?.trim()
    );
    const hasValidNumbers = expense.price > 0 && expense.volume > 0;
    const noValidationErrors = Object.values(validationErrors).every(
      (error) => !error
    );
    return areRequiredFieldsFilled && hasValidNumbers && noValidationErrors;
  }, [expense, validationErrors]);

  // ----------------------------------------------------------------------------
  // Expose the Hook's API
  // ----------------------------------------------------------------------------
  const isLoading = loading || saveExpenseMutation.isLoading || deleteExpenseMutation.isLoading;

  return useMemo(
    () => ({
      isFormValid,
      expense,
      loading: isLoading,
      products,
      brands,
      shops,
      validationErrors,
      handleDeleteExpense,
      handleSaveExpense,
      resetForm,
      setExpense,
    }),
    [
      isFormValid,
      expense,
      isLoading,
      products,
      brands,
      shops,
      validationErrors,
      handleSaveExpense,
      handleDeleteExpense,
      resetForm,
      setExpense,
    ]
  );
};

export default useExpenseForm;

