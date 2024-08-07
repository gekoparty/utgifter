import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import dayjs from "dayjs";
import { formatComponentFields } from "../commons/Utils/FormatUtil";
import { StoreContext } from "../../Store/Store";
import useFetchData from "../../hooks/useFetchData";
import { addExpenseValidationSchema } from "../../validation/validationSchema";
import useCustomHttp from "../../hooks/useHttp";

const useExpenseForm = (initialExpense = null) => {
  const initialExpenseState = useMemo(() => ({
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
  }), []);

  const [expense, setExpense] = useState(initialExpense ? initialExpense : { ...initialExpenseState });
  const [validationErrors, setValidationErrors] = useState({});

  const { sendRequest, loading } = useCustomHttp("/api/expenses");
  const { dispatch, state } = useContext(StoreContext);

  // Fetch necessary data
  const { data: productsOptions, isLoading: productsLoading } = useFetchData(
    "products",
    "/api/products"
  );

  const { data: brandOptions, isLoading: brandsLoading } = useFetchData(
    "brands",
    "/api/brands"
  );

  const { data: shopOptions, isLoading: shopsLoading } = useFetchData(
    "shopsWithLocations",
    "/api/shops",
    async (shops) => {
      return Promise.all(
        shops.map(async (shop) => {
          const locationResponse = await fetch(
            `/api/locations/${shop.location}`
          );
          const location = await locationResponse.json();
          return { ...shop, locationName: location.name };
        })
      );
    }
  );

  const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "expenses",
    });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "expenses",
    });
    setValidationErrors({});
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setExpense(initialExpense ? initialExpense : initialExpenseState);
    resetServerError();
    resetValidationErrors();
  }, [initialExpense, initialExpenseState, resetServerError, resetValidationErrors]);

  useEffect(() => {
    if (initialExpense) {
      const normalizedExpense = {
        ...initialExpense,
        productName: typeof initialExpense.productName === 'object' ? initialExpense.productName.name : initialExpense.productName,
        brandName: typeof initialExpense.brandName === 'object' ? initialExpense.brandName.name : initialExpense.brandName,
        shopName: typeof initialExpense.shopName === 'object' ? initialExpense.shopName.name : initialExpense.shopName,
        locationName: typeof initialExpense.locationName === 'object' ? initialExpense.locationName.name : initialExpense.locationName,
      };
      
      setExpense((prevExpense) => ({
        ...prevExpense,
        ...normalizedExpense,
      }));
    } else {
      resetFormAndErrors();
    }
  
    return () => {
      dispatch({
        type: "CLEAR_RESOURCE",
        resource: "expenses",
      });
    };
  }, [initialExpense, resetFormAndErrors, dispatch]);

  const validateField = (field, value) => {
    try {
      addExpenseValidationSchema.validateSyncAt(field, { [field]: value });
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        [field]: null,
      }));
    } catch (validationError) {
      setValidationErrors((prevErrors) => ({
        ...prevErrors,
        [field]: validationError.message,
      }));
    }
  };

  const handleFieldChange = (field, value) => {
    setExpense((prevExpense) => ({ ...prevExpense, [field]: value }));
    validateField(field, value);
  };

  const handleSaveExpense = async (onClose) => {
    console.log("handleSaveExpense called with expense:", expense);
  
    if (!expense) {
      console.error("Expense is undefined");
      return;
    }
  
    if (!expense.productName || !expense.brandName) {
      console.error("Product name or Brand name is missing:", expense);
      return;
    }
  
    let formattedExpense;
    let validationErrors = {};
  
    try {
      formattedExpense = {
        ...expense,
        productName: formatComponentFields(expense.productName, "expense", "productName"),
        brandName: formatComponentFields(expense.brandName, "expense", "brandName"),
        shopName: formatComponentFields(expense.shopName, "expense", "shopName"),
        locationName: formatComponentFields(expense.locationName, "expense", "locationName"),
        type: formatComponentFields(expense.type, "expense", "type"),
      };
  
      console.log("Formatted expense:", formattedExpense);
  
      // Perform validation before saving
      await addExpenseValidationSchema.validate(formattedExpense, { abortEarly: false });
      console.log("Validation passed");
    } catch (validationError) {
      console.error("Validation error:", validationError);
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: "expenses",
          validationErrors: {
            ...state.validationErrors?.expenses,
            ...validationErrors,
          },
          showError: true,
        });
      } else {
        console.error("Unknown validation error:", validationError);
      }
      return; // Exit if validation fails
    }
  
    try {
      let url = "/api/expenses";
      let method = "POST";
  
      if (initialExpense) {
        url = `/api/expenses/${initialExpense._id}`;
        method = "PUT";
      }
  
      const { data, error: addDataError } = await sendRequest(url, method, formattedExpense);
  
      if (addDataError) {
        console.error("API error:", addDataError);
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "expenses",
          showError: true,
        });
        return;
      }
  
      console.log("Expense saved successfully:", data);
  
      // Reset the form and errors after saving
      setExpense(initialExpenseState);
      resetFormAndErrors();
  
      if (Array.isArray(data)) {
        data.forEach(expenseItem => onClose(expenseItem)); // Handle array of expenses
      } else {
        onClose(data);
      }
  
      return data;
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "/api/expenses",
        showError: true,
      });
    }
  };

  const handleDeleteExpense = async (
    selectedExpense,
    onDeleteSuccess,
    onDeleteFailure
  ) => {
    try {
      console.log("Attempting to delete expense:", selectedExpense);
  
      const response = await sendRequest(
        `/api/expenses/${selectedExpense?._id}`,
        "DELETE"
      );
  
      if (response.error) {
        console.error("Failed to delete expense:", response.error);
        onDeleteFailure(selectedExpense);
        return false;
      } else {
        console.log("Expense deleted successfully:", selectedExpense);
        onDeleteSuccess(selectedExpense);
        return true;
      }
    } catch (error) {
      console.error("Error during delete request:", error);
      onDeleteFailure(selectedExpense);
      return false;
    }
  };

  const isFormValid = () => {
    // Log the values of productName, brandName, and shopName before trimming
  console.log("Before trim:", {
    productName: expense.productName,
    brandName: expense.brandName,
    shopName: expense.shopName,
  });
    const hasErrors = Object.values(validationErrors).some((error) => error);
    const hasProductName = expense.productName.trim().length > 0;
    const hasBrandName = expense.brandName.trim().length > 0;
    const hasShopName = expense.shopName.trim().length > 0;
    const hasVolume = expense.volume > 0;
    const hasPrice = expense.price > 0;
  
    console.log("Validation status:", {
      hasErrors,
      hasProductName,
      hasBrandName,
      hasShopName,
      hasVolume,
      hasPrice,
      validationErrors,
    });
  
    return (
      !hasErrors &&
      hasProductName &&
      hasBrandName &&
      hasShopName &&
      hasVolume &&
      hasPrice
    );
  };

  return {
    isFormValid,
    loading,
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
    brandOptions,
    brandsLoading,
    shopOptions,
    shopsLoading,
  };
};

export default useExpenseForm;