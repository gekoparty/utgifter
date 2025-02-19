import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useContext,
  useReducer,
  useRef
} from "react";
import dayjs from "dayjs";
import { StoreContext } from "../../Store/Store";
import useFetchData from "../../hooks/useFetchData";
import { addExpenseValidationSchema } from "../../validation/validationSchema";
import useCustomHttp from "../../hooks/useHttp";

const expenseReducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return action.initialState;
    case "INIT":
      return { ...action.payload };
    case "SET_EXPENSE":
      // Allow updater function or direct value
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

const useExpenseForm = (initialExpense = null, expenseId = null) => {
  // Memoize the initial expense state for consistency
  const defaultExpenseState = useMemo(
    () => ({
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
    }),
    []
  );

  const initialFormState = initialExpense || defaultExpenseState;
  // Expense state and validation/error states
  const [expense, dispatchExpense] = useReducer(
    expenseReducer,
    initialFormState
  );
  const [validationErrors, setValidationErrors] = useState({});
  // Custom HTTP hook for expenses
  const { sendRequest, loading } = useCustomHttp("/api/expenses");
  // Global store context
  const { dispatch: storeDispatch } = useContext(StoreContext);

  // Create a setExpense function that mimics a state setter
  const setExpense = useCallback((updateFn) => {
    dispatchExpense({ type: "SET_EXPENSE", payload: updateFn });
  }, []);

  // Memoized API endpoints
  const endpoints = useMemo(
    () => ({
      products: "/api/products",
      brands: "/api/brands",
      shops: "/api/shops",
      expenses: "/api/expenses",
      locations: "/api/locations",
    }),
    []
  );

  const fetchShopsData = useCallback(async (data) => {
    const controller = new AbortController();
    const signal = controller.signal;
  
    try {
      const shops = Array.isArray(data) ? data : data?.shops || [];
      return await Promise.all(
        shops.map(async (shop) => {
          const res = await fetch(`${endpoints.locations}/${shop.location}`, { signal });
          if (!res.ok) throw new Error("Failed to fetch location");
          const location = await res.json();
          return { ...shop, locationName: location.name };
        })
      );
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching shop locations:", error);
      }
      return [];
    }
  }, [endpoints.locations]);

  

  // Data fetching with enabled optimization
  const fetchConfig = useMemo(
    () => ({
      enabled: Boolean(expenseId || initialExpense),
    }),
    [expenseId, initialExpense]
  );

  const { data: products } = useFetchData(
    "products",
    endpoints.products,
    null,
    fetchConfig
  );
  const { data: brands } = useFetchData(
    "brands",
    endpoints.brands,
    null,
    fetchConfig
  );
  const { data: shops } = useFetchData(
    "shops",
    endpoints.shops,
    fetchShopsData,
    fetchConfig
  );

  // Fetch initial expense data
  useEffect(() => {
    const fetchExpense = async () => {
      if (initialExpense) return;
      if (!expenseId) return;

      try {
        const data = await sendRequest(`${endpoints.expenses}/${expenseId}`);
        dispatchExpense({ type: "INIT", payload: data });
      } catch (error) {
        storeDispatch({ type: "SET_ERROR", resource: "expenses", error });
      }
    };

    fetchExpense();
  }, [
    expenseId,
    initialExpense,
    sendRequest,
    storeDispatch,
    endpoints.expenses,
  ]);

  // Form operations
  const resetForm = useCallback(() => {
    dispatchExpense({ type: "RESET", initialState: defaultExpenseState });
    storeDispatch({ type: "RESET_ERROR", resource: "expenses" });
    setValidationErrors({});
  }, [defaultExpenseState, storeDispatch]);

  const validateField = useCallback((field, value) => {
    try {
      addExpenseValidationSchema.validateSyncAt(field, { [field]: value });
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
      return true;
    } catch (err) {
      setValidationErrors((prev) => ({ ...prev, [field]: err.message }));
      return false;
    }
  }, []);

  const handleFieldChange = useCallback(
    (field, value) => {
      dispatchExpense({ type: "SET_FIELD", field, value });
      validateField(field, value);

      if (field === "productName" && products) {
        const product = products.find((p) => p.name === value);
        if (product) {
          dispatchExpense({
            type: "SET_FIELD",
            field: "measures",
            value: product.measures,
          });
          dispatchExpense({
            type: "SET_FIELD",
            field: "measurementUnit",
            value: product.measures?.[0] || "",
          });
        }
      }
    },
    [products, validateField]
  );

  // Form submission handler
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const handleSaveExpense = useCallback(async () => {
    try {
      const payload = {
        ...expense,
        purchaseDate: expense.purchased ? expense.purchaseDate : null,
        registeredDate: !expense.purchased ? expense.registeredDate : null,
      };
  
      await addExpenseValidationSchema.validate(payload, { abortEarly: false });
  
      const method = initialExpense ? "PUT" : "POST";
      const url = initialExpense
        ? `${endpoints.expenses}/${initialExpense._id}`
        : endpoints.expenses;

      const { data } = await sendRequest(url, method, payload);
      return data;

    } catch (error) {
      if (isMountedRef.current) {
        if (error.name === "ValidationError") {
          const errors = error.inner.reduce(
            (acc, err) => ({ ...acc, [err.path]: err.message }),
            {}
          );
          setValidationErrors(errors);
        } else {
          storeDispatch({ type: "SET_ERROR", resource: "expenses", error });
        }
      }
      throw error;
    }
  }, [expense, initialExpense, sendRequest, storeDispatch, endpoints.expenses]);
  

  // Delete expense handler
  const handleDeleteExpense = useCallback(
    async (expenseId) => {
      try {
        await sendRequest(`${endpoints.expenses}/${expenseId}`, "DELETE");
        //storeDispatch({ type: "DELETE_EXPENSE", payload: expenseId });
        return true;
      } catch (error) {
        storeDispatch({ type: "SET_ERROR", resource: "expenses", error });
        return false;
      }
    },
    [sendRequest, storeDispatch, endpoints.expenses]
  );

  // Memoized form validity check
  const isFormValid = useMemo(() => {
    const requiredFields = ["productName", "brandName", "shopName"];
    return (
      requiredFields.every((field) => expense[field]?.trim()) &&
      expense.price > 0 &&
      expense.volume > 0 &&
      Object.values(validationErrors).every((error) => !error)
    );
  }, [expense, validationErrors]);

  // Memoized component API
  return useMemo(
    () => ({
      isFormValid,
      expense,
      loading,
      products,
      brands,
      shops,
      validationErrors,
      handleDeleteExpense,
      handleSaveExpense,
      handleFieldChange,
      resetForm,
      setExpense,
    }),
    [
      isFormValid,
      expense,
      loading,
      products,
      brands,
      shops,
      validationErrors,
      handleSaveExpense,
      handleDeleteExpense,
      handleFieldChange,
      resetForm,
      setExpense
    ]
  );
};

export default useExpenseForm;
