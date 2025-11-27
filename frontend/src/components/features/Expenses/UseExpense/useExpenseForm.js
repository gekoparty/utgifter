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
// Reducer (Cleaned up)
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
// ✅ OPTIMIZED: Helper function to fetch shop data with location name (Batching)
// ----------------------------------------------------------------------------
const fetchShopsDataOptimized = async (data, locationsEndpoint) => {
  const shops = Array.isArray(data) ? data : data?.shops || [];
  if (shops.length === 0) return [];

  try {
    // 1. Collect unique location IDs
    const locationIds = [...new Set(shops.map((s) => s.location).filter(Boolean))];

    if (locationIds.length === 0) return shops;

    // 2. Batch fetch locations (Single Request)
    const res = await fetch(`${locationsEndpoint}?ids=${locationIds.join(",")}`);
    
    let locationMap = {};
    if (res.ok) {
      const json = await res.json();
      const locations = Array.isArray(json) ? json : json.locations || [];
      
      // Create Lookup Map: { [id]: "Location Name" }
      locationMap = locations.reduce((acc, loc) => {
        if (loc._id) acc[loc._id] = loc.name;
        return acc;
      }, {});
    }

    // 3. Map names to shops
    return shops.map((shop) => ({
      ...shop,
      locationName: locationMap[shop.location] || "N/A",
    }));
  } catch (error) {
    console.error("Feil ved henting av butikksteder (batch):", error);
    // Return shops without location names on error, rather than crashing
    return shops;
  }
};

// ----------------------------------------------------------------------------
// Custom hook: useExpenseForm
// ----------------------------------------------------------------------------
const useExpenseForm = (initialExpense = null, expenseId = null) => {
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);

  // --------------------------------------------------------------------------
  // Initial State Setup
  // --------------------------------------------------------------------------
  const initialFormState = useMemo(() => 
    initialExpense || { ...INITIAL_EXPENSE_STATE }, 
  [initialExpense]);

  const [expense, dispatchExpense] = useReducer(expenseReducer, initialFormState);
  const [validationErrors, setValidationErrors] = useState({});

  // --------------------------------------------------------------------------
  // HTTP and Global Store Hooks
  // --------------------------------------------------------------------------
  const { sendRequest, loading } = useCustomHttp(API_ENDPOINTS.expenses);
  const { dispatch: storeDispatch } = useContext(StoreContext);

  const setExpense = useCallback((updateFn) => {
    dispatchExpense({ type: "SET_EXPENSE", payload: updateFn });
  }, []);

  // --------------------------------------------------------------------------
  // Data Fetching Configuration
  // --------------------------------------------------------------------------
  // Only fetch extra lists if we are loading an existing expense ID or just general form use
  const fetchConfig = useMemo(() => ({
    staleTime: 5 * 60 * 1000, // Cache for 5 mins
  }), []);

  const { data: products } = useFetchData("products", API_ENDPOINTS.products, null, fetchConfig);
  const { data: brands } = useFetchData("brands", API_ENDPOINTS.brands, null, fetchConfig);
  
  // Use the optimized batch fetcher here
  const { data: shops } = useFetchData(
    "shops",
    API_ENDPOINTS.shops,
    (data) => fetchShopsDataOptimized(data, API_ENDPOINTS.locations),
    fetchConfig
  );

  // Fetch specific expense if editing
  const { data: expenseData } = useQuery({
    queryKey: ["expense", expenseId],
    queryFn: () => sendRequest(`${API_ENDPOINTS.expenses}/${expenseId}`),
    enabled: Boolean(expenseId && !initialExpense),
    initialData: initialExpense,
    staleTime: 0, // Always fetch fresh data for edit
  });

  // Sync fetched expense data to form state
  useEffect(() => {
    if (expenseData) {
      dispatchExpense({ type: "INIT", payload: expenseData });
    }
  }, [expenseData]);

  // Mount/Unmount safety
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // --------------------------------------------------------------------------
  // Form Operation Helpers
  // --------------------------------------------------------------------------
  const resetForm = useCallback(() => {
    dispatchExpense({ type: "RESET", initialState: { ...INITIAL_EXPENSE_STATE } });
    storeDispatch({ type: "RESET_ERROR", resource: "expenses" });
    setValidationErrors({});
  }, [storeDispatch]);

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
    onError: (error) => {
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
    try {
      const payload = {
        ...expense,
        purchaseDate: expense.purchased ? expense.purchaseDate : null,
        registeredDate: !expense.purchased ? expense.registeredDate : null,
      };

      await addExpenseValidationSchema.validate(payload, { abortEarly: false });

      const result = await saveExpenseMutation.mutateAsync(payload);
      
      // Return guaranteed productName for UI feedback
      return {
        ...result,
        productName: result.productName || expense.productName || "Ukjent produkt",
      };
    } catch (error) {
      if (!isMountedRef.current) return;

      if (error.name === "ValidationError") {
        const errors = error.inner.reduce(
          (acc, err) => ({ ...acc, [err.path]: err.message }),
          {}
        );
        setValidationErrors(errors);
      } else {
        // Allow mutation onError to handle server errors, or handle here if strictly needed
        console.error("Save error:", error);
      }
      throw error; // Re-throw so component knows it failed
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
    // Using loose equality to catch undefined/null/empty string
    const fieldsFilled = requiredFields.every(field => expense[field] && expense[field].trim() !== "");
    const numbersValid = expense.price > 0 && expense.volume > 0;
    const noErrors = Object.keys(validationErrors).length === 0;
    
    return fieldsFilled && numbersValid && noErrors;
  }, [expense, validationErrors]);

  const isLoading = loading || saveExpenseMutation.isPending || deleteExpenseMutation.isPending;

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

