import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import dayjs from "dayjs";
import { formatComponentFields } from "../commons/Utils/FormatUtil";
import { StoreContext } from "../../Store/Store";
import useFetchData from "../../hooks/useFetchData";
import { addExpenseValidationSchema } from "../../validation/validationSchema";
import useCustomHttp from "../../hooks/useHttp";

const useExpenseForm = (initialExpense = null, expenseId = null, onClose) => {
  // Memoize the initial expense state for consistency
  const initialExpenseState = useMemo(
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

  // Expense state and validation/error states
  const [expense, setExpense] = useState(
    initialExpense ? initialExpense : { ...initialExpenseState }
  );
  const [validationErrors, setValidationErrors] = useState({});
  const [error, setError] = useState(null);

  // Custom HTTP hook for expenses
  const { sendRequest, loading } = useCustomHttp("/api/expenses");

  // Global store context
  const { dispatch, state } = useContext(StoreContext);

  // Fetch options for products, brands, and shops
  const {
    data: productsOptions,
    isLoading: productsLoading,
    refetch: refetchProducts,
  } = useFetchData("products", "/api/products", null, { enabled: false });

  const {
    data: brandOptions,
    isLoading: brandsLoading,
    refetch: refetchBrands,
  } = useFetchData("brands", "/api/brands", null, { enabled: false });

  const {
    data: shopOptions,
    isLoading: shopsLoading,
    refetch: refetchShops,
  } = useFetchData(
    "shopsWithLocations",
    "/api/shops",
    async (data) => {
      // Check if data is already an array; if not, assume it is an object with a "shops" key.
      const shops = Array.isArray(data) ? data : data.shops;
      if (!Array.isArray(shops)) {
        // If still not an array, return an empty array to avoid errors.
        return [];
      }
      return Promise.all(
        shops.map(async (shop) => {
          const locationResponse = await fetch(`/api/locations/${shop.location}`);
          const location = await locationResponse.json();
          return { ...shop, locationName: location.name };
        })
      );
    }
  );
  
  // If an expenseId is provided, fetch the expense details
  useEffect(() => {
    if (expenseId) {
      const fetchExpenseById = async () => {
        try {
          const response = await fetch(`/api/expenses/${expenseId}`);
          const data = await response.json();
          setExpense((prevExpense) => ({
            ...prevExpense,
            ...data,
          }));
        } catch (fetchError) {
          console.error("Error fetching expense:", fetchError);
          setError(fetchError.message || "Error fetching expense details");
        }
      };
      fetchExpenseById();
    }
  }, [expenseId]);

  // Reset server and validation errors
  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "expenses" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "expenses" });
    setValidationErrors({});
  }, [dispatch]);

  // Reset the form and clear all errors
  const resetFormAndErrors = useCallback(() => {
    setExpense(initialExpense ? initialExpense : { ...initialExpenseState });
    resetServerError();
    resetValidationErrors();
  }, [initialExpense, initialExpenseState, resetServerError, resetValidationErrors]);

  // Update the expense state when initialExpense changes (with field normalization)
  useEffect(() => {
    if (initialExpense) {
      const normalizedExpense = {
        ...initialExpense,
        productName:
          typeof initialExpense.productName === "object"
            ? initialExpense.productName.name
            : initialExpense.productName,
        brandName:
          typeof initialExpense.brandName === "object"
            ? initialExpense.brandName.name
            : initialExpense.brandName,
        shopName:
          typeof initialExpense.shopName === "object"
            ? initialExpense.shopName.name
            : initialExpense.shopName,
        locationName:
          typeof initialExpense.locationName === "object"
            ? initialExpense.locationName.name
            : initialExpense.locationName,
      };

      // If product options exist, update measures from the selected product
      if (productsOptions && productsOptions.length > 0) {
        const selectedProduct = productsOptions.find(
          (product) => product.name === normalizedExpense.productName
        );
        const productMeasures = selectedProduct?.measures || [];
        setExpense((prevExpense) => ({
          ...prevExpense,
          ...normalizedExpense,
          measures: productMeasures,
        }));
      } else {
        console.warn("productsOptions is undefined or empty");
      }
    } else {
      resetFormAndErrors();
    }

    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "expenses" });
    };
  }, [initialExpense, resetFormAndErrors, dispatch, productsOptions]);

  // Validate a single field and update the validation errors state
  const validateField = useCallback((field, value) => {
    try {
      addExpenseValidationSchema.validateSyncAt(field, { [field]: value });
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    } catch (err) {
      setValidationErrors((prev) => ({ ...prev, [field]: err.message }));
    }
  }, []);

  // Handle field changes and update related state (e.g. measures for productName)
  const handleFieldChange = useCallback(
    (field, value) => {
      setExpense((prev) => ({ ...prev, [field]: value }));

      if (field === "productName" && productsOptions && productsOptions.length > 0) {
        const selectedProduct = productsOptions.find(
          (product) => product.name === value
        );
        const productMeasures = selectedProduct?.measures || [];
        setExpense((prev) => ({
          ...prev,
          measurementUnit: productMeasures.length > 0 ? productMeasures[0] : "",
          measures: productMeasures,
        }));
      } else if (field === "productName") {
        console.warn("productsOptions is undefined or empty");
      }
      validateField(field, value);
    },
    [validateField, productsOptions]
  );

  // Save the expense (create or update) after formatting and validating the fields
  const handleSaveExpense = async (onClose) => {
    console.log("Expense data before validation:", expense);
    if (!expense || !expense.productName || !expense.brandName) {
      console.error("Missing required fields in expense:", expense);
      return;
    }

    let formattedExpense;
    let errors = {};

    try {
      formattedExpense = {
        ...expense,
        productName: formatComponentFields(expense.productName, "expense", "productName"),
        brandName: formatComponentFields(expense.brandName, "expense", "brandName"),
        shopName: formatComponentFields(expense.shopName, "expense", "shopName"),
        locationName: formatComponentFields(expense.locationName, "expense", "locationName"),
        type: formatComponentFields(expense.type, "expense", "type"),
        purchaseDate: expense.purchased ? expense.purchaseDate : null,
        registeredDate: !expense.purchased ? expense.registeredDate : null,
      };
      console.log("Formatted expense before Yup validation:", formattedExpense);
      // Validate using the schema (abortEarly false to collect all errors)
      await addExpenseValidationSchema.validate(formattedExpense, { abortEarly: false });
    } catch (validationError) {
      console.error("Validation errors:", validationError.errors);
    console.error("Validation error details:", validationError.inner);
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          console.log(`Field ${err.path} failed with: ${err.message}`);
          errors[err.path] = { show: true, message: err.message };
        });
        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: "expenses",
          validationErrors: {
            ...state.validationErrors?.expenses,
            ...errors,
          },
          showError: true,
        });
      }
      console.log("Final validation errors state:", errors);
      return;
    }

    try {
      let url = "/api/expenses";
      let method = "POST";
      if (initialExpense) {
        url = `/api/expenses/${initialExpense._id}`;
        method = "PUT";
      }
      const { data, error: apiError } = await sendRequest(url, method, formattedExpense);
      if (apiError) {
        dispatch({
          type: "SET_ERROR",
          error: apiError,
          resource: "expenses",
          showError: true,
        });
        return;
      } else {
        dispatch({ type: "RESET_ERROR", resource: "expenses" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "expenses" });
        setExpense({ ...initialExpenseState });
        resetFormAndErrors();
        return data;  // Simply return the data
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "expenses",
        showError: true,
      });
    }
  };

  // Delete an expense
  const handleDeleteExpense = async (expenseToDelete, onSuccess, onFailure) => {
    try {
      const { error: deleteError } = await sendRequest(
        `/api/expenses/${expenseToDelete._id}`,
        "DELETE"
      );
      if (deleteError) {
        onFailure(expenseToDelete);
        return false;
      } else {
        onSuccess(expenseToDelete);
        await refetchProducts();
        return true;
      }
    } catch (err) {
      onFailure(expenseToDelete);
      return false;
    }
  };

  // Check if the form is valid
  const isFormValid = useCallback(() => {
    const hasErrors = Object.values(validationErrors).some((err) => err);
    const hasRequiredFields = ["productName", "brandName", "shopName"].every(
      (field) => expense[field]?.trim().length > 0
    );
    const hasVolumeAndPrice = expense.volume > 0 && expense.price > 0;
    return !hasErrors && hasRequiredFields && hasVolumeAndPrice;
  }, [expense, validationErrors]);

  return {
    isFormValid,
    error,
    handleSaveExpense,
    handleDeleteExpense,
    expense,
    setExpense,
    handleFieldChange,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
    productsOptions,
    productsLoading,
    brandsLoading,
    shopsLoading,
    brandOptions,
    refetchProducts,
    refetchBrands,
    refetchShops,
    shopOptions,
    loading,
  };
};

export default useExpenseForm;
