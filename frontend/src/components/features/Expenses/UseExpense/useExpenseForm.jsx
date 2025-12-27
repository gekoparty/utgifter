import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
  useRef,
  use, // React 19: Replaces useContext
  useTransition, // React 19: For non-blocking UI updates
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
// Reducer
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
    default:
      return state;
  }
};

// ----------------------------------------------------------------------------
// Standard expense state
// ----------------------------------------------------------------------------
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
};

// ----------------------------------------------------------------------------
// Helper: Optimized Batch Fetcher (Pure Function)
// ----------------------------------------------------------------------------
const fetchShopsDataOptimized = async (data, locationsEndpoint) => {
  const shops = Array.isArray(data) ? data : data?.shops || [];
  if (shops.length === 0) return [];
console.log (shops)
  try {
    const locationIds = [...new Set(shops.map((s) => s.location).filter(Boolean))];

    if (locationIds.length === 0) return shops;

    const res = await fetch(`${locationsEndpoint}?ids=${locationIds.join(",")}`);
    console.log (res)
    
    let locationMap = {};
    if (res.ok) {
      const json = await res.json();
      console.log (json)
      const locations = Array.isArray(json) ? json : json.locations || [];
      
      locationMap = locations.reduce((acc, loc) => {
        if (loc._id) acc[loc._id] = loc.name;
        return acc;
      }, {});
    }

    

    return shops.map((shop) => ({
      ...shop,
      locationName: locationMap[shop.location] || "N/A",
    }));
  } catch (error) {
    console.error("Feil ved henting av butikksteder (batch):", error);
    return shops;
  }
};

// ----------------------------------------------------------------------------
// Custom hook: useExpenseForm
// ----------------------------------------------------------------------------
const useExpenseForm = (initialExpense = null, expenseId = null) => {
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  
  // React 19: useTransition for smoother validation handling
  const [isPending, startTransition] = useTransition();

  // --------------------------------------------------------------------------
  // Initial State
  // --------------------------------------------------------------------------
  const initialFormState = useMemo(() => 
    initialExpense || { ...INITIAL_EXPENSE_STATE }, 
  [initialExpense]);

  const [expense, dispatchExpense] = useReducer(expenseReducer, initialFormState);
  const [validationErrors, setValidationErrors] = useState({});

  // --------------------------------------------------------------------------
  // HTTP and Global Store
  // --------------------------------------------------------------------------
  const { sendRequest, loading: httpLoading } = useCustomHttp(API_ENDPOINTS.expenses);
  
  // React 19: 'use' API instead of 'useContext'
  const { dispatch: storeDispatch } = use(StoreContext);

  const setExpense = useCallback((updateFn) => {
    dispatchExpense({ type: "SET_EXPENSE", payload: updateFn });
  }, []);

  // --------------------------------------------------------------------------
  // Data Fetching
  // --------------------------------------------------------------------------
  const fetchConfig = { staleTime: 5 * 60 * 1000 };

  const { data: products } = useFetchData("products", API_ENDPOINTS.products, null, fetchConfig);
  const { data: brands } = useFetchData("brands", API_ENDPOINTS.brands, null, fetchConfig);
  
  const { data: shops } = useFetchData(
    "shops",
    API_ENDPOINTS.shops,
    (data) => fetchShopsDataOptimized(data, API_ENDPOINTS.locations),
    fetchConfig
  );


  const { data: expenseData } = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: () => sendRequest(`${API_ENDPOINTS.expenses}/${expenseId}`),
    enabled: Boolean(expenseId && !initialExpense),
    initialData: initialExpense,
    staleTime: 0,
  });

  // Sync fetched expense data
  useEffect(() => {
    if (expenseData) {
      dispatchExpense({ type: "INIT", payload: expenseData });
    }
  }, [expenseData]);

  // Cleanup safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // --------------------------------------------------------------------------
  // Form Operations
  // --------------------------------------------------------------------------
  const resetForm = useCallback(() => {
    dispatchExpense({ type: "RESET", initialState: { ...INITIAL_EXPENSE_STATE } });
    storeDispatch({ type: "RESET_ERROR", resource: "expenses" });
    setValidationErrors({});
  }, [storeDispatch]); // React Compiler will optimize this dependency automatically

  // ----------------------------------------------------------------------------
  // Mutations
  // ----------------------------------------------------------------------------
  const saveExpenseMutation = useMutation({
    mutationFn: async (payload) => {
      const method = initialExpense ? "PUT" : "POST";
      const url = initialExpense
        ? `${API_ENDPOINTS.expenses}/${initialExpense._id}`
        : API_ENDPOINTS.expenses;
      const { data, error } = await sendRequest(url, method, payload);
      if (error) throw new Error(error.message || "Lagring feilet");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      storeDispatch({
        type: "SET_ERROR",
        resource: "expenses",
        error: { message: "Kunne ikke lagre utgift. Vennligst prøv igjen." },
      });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await sendRequest(`${API_ENDPOINTS.expenses}/${id}`, "DELETE");
      if (error) throw new Error("Sletting feilet");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
    },
    onError: () => {
      storeDispatch({
        type: "SET_ERROR",
        resource: "expenses",
        error: { message: "Kunne ikke slette utgift." },
      });
    },
  });

  // ----------------------------------------------------------------------------
  // Handlers
  // ----------------------------------------------------------------------------
  const handleSaveExpense = useCallback(async () => {
    // Clear previous errors immediately
    setValidationErrors({});

    try {
      const payload = {
        ...expense,
        purchaseDate: expense.purchased ? expense.purchaseDate : null,
        registeredDate: !expense.purchased ? expense.registeredDate : null,
      };

      // Validation Step
      await addExpenseValidationSchema.validate(payload, { abortEarly: false });

      // Execute Mutation
      const result = await saveExpenseMutation.mutateAsync(payload);
      
      return {
        ...result,
        productName: result.productName || expense.productName || "Ukjent produkt",
      };
    } catch (error) {
      if (!isMountedRef.current) return;

      if (error.name === "ValidationError") {
        // React 19: Wrap state updates in transition if they might suspend 
        // (Not strictly necessary for local state, but good practice for responsiveness)
        startTransition(() => {
          const errors = error.inner.reduce(
            (acc, err) => ({ ...acc, [err.path]: err.message }),
            {}
          );
          setValidationErrors(errors);
        });
      } else {
        console.error("Save error:", error);
      }
      throw error;
    }
  }, [expense, saveExpenseMutation]);

  const handleDeleteExpense = useCallback(async (id) => {
    try {
      await deleteExpenseMutation.mutateAsync(id);
      return true;
    } catch (error) {
      return false;
    }
  }, [deleteExpenseMutation]);

  // ----------------------------------------------------------------------------
  // Validation Check
  // ----------------------------------------------------------------------------
  const isFormValid = useMemo(() => {
    const requiredFields = ["productName", "brandName", "shopName"];
    const fieldsFilled = requiredFields.every(field => expense[field] && expense[field].trim() !== "");
    const numbersValid = expense.price > 0 && expense.volume > 0;
    const noErrors = Object.keys(validationErrors).length === 0;
    
    return fieldsFilled && numbersValid && noErrors;
  }, [expense, validationErrors]);

  // Combine loading states
  const isLoading = httpLoading || saveExpenseMutation.isPending || deleteExpenseMutation.isPending || isPending;

  // React 19: 
  // If you are using the React Compiler, this useMemo on the return object 
  // is technically redundant, but we keep it to guarantee "No Breaking Changes" 
  // for consumers expecting stable references.
  return useMemo(() => ({
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
  }), [
    isFormValid,
    expense,
    isLoading,
    products,
    brands,
    shops,
    validationErrors,
    handleDeleteExpense,
    handleSaveExpense,
    resetForm,
    setExpense,
  ]);
};

export default useExpenseForm;
