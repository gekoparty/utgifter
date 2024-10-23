import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import dayjs from "dayjs";
import { formatComponentFields } from "../commons/Utils/FormatUtil";
import { StoreContext } from "../../Store/Store";
import useFetchData from "../../hooks/useFetchData";
import { addExpenseValidationSchema } from "../../validation/validationSchema";
import useCustomHttp from "../../hooks/useHttp";

const useExpenseForm = (initialExpense = null, expenseId = null, onClose) => {
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
  const [error, setError] = useState(null);
  const { sendRequest, loading } = useCustomHttp("/api/expenses");
  const { dispatch, state } = useContext(StoreContext);

  // Fetch necessary data
  const { data: productsOptions, isLoading: productsLoading, refetch: refetchProducts  } = useFetchData(
    "products",
    "/api/products",
    null,
    { enabled: false } 
  );

  const { data: brandOptions, isLoading: brandsLoading, refetch: refetchBrands } = useFetchData(
    "brands",
    "/api/brands",
    null,
    { enabled: false } // Disable auto-fetching
  );

  const { data: shopOptions, isLoading: shopsLoading, refetch: refetchShops  } = useFetchData(
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
    },
    
  );

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
  
      // Ensure productsOptions is defined before accessing it
      if (productsOptions && productsOptions.length > 0) {
        const selectedProduct = productsOptions.find(product => product.name === normalizedExpense.productName);
        const productMeasures = selectedProduct?.measures || []; // Default to empty array if no measures
        
        console.log("Product measures:", productMeasures); // Debugging log
  
        setExpense((prevExpense) => ({
          ...prevExpense,
          ...normalizedExpense,
          measures: productMeasures,  // Add the measures to the expense state
        }));
      } else {
        console.warn("productsOptions is undefined or empty"); // Debugging log for when options are not available
      }
    } else {
      resetFormAndErrors();
    }
  
    return () => {
      dispatch({
        type: "CLEAR_RESOURCE",
        resource: "expenses",
      });
    };
  }, [initialExpense, resetFormAndErrors, dispatch, productsOptions]); 

  const validateField = useCallback((field, value) => {
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
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setExpense(prev => ({ ...prev, [field]: value }));
  
    // Ensure productsOptions is defined before accessing it
    if (field === 'productName' && productsOptions && productsOptions.length > 0) {
      const selectedProduct = productsOptions.find(product => product.name === value);
  
      // Add log to check if selectedProduct exists and has measures
      console.log("Selected product for field change:", selectedProduct);
      const productMeasures = selectedProduct?.measures || []; // Default to empty array if no measures
  
      // Debugging log
      console.log("Selected product measures for field change:", productMeasures);
  
      setExpense(prev => ({
        ...prev,
        measurementUnit: productMeasures.length > 0 ? productMeasures[0] : "", // Set default measure if available
        measures: productMeasures,  // Store the measures in the state
      }));
    } else if (field === 'productName') {
      console.warn("productsOptions is undefined or empty"); // Debugging log
    }
  
    validateField(field, value);
  }, [validateField, productsOptions]);


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
      console.log("Initial expense object:", expense);
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

      console.log("Sending request to:", url);
    console.log("Request method:", method);
    console.log("Payload being sent:", formattedExpense);
  
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
  
      console.log("Response from API:", data);
  
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

  const isFormValid = useCallback(() => {
    const hasErrors = Object.values(validationErrors).some(error => error);
    const hasRequiredFields = ["productName", "brandName", "shopName"].every(
      field => expense[field]?.trim().length > 0
    );
    const hasVolumeAndPrice = expense.volume > 0 && expense.price > 0;

    return !hasErrors && hasRequiredFields && hasVolumeAndPrice;
  }, [expense, validationErrors]);

  return {
    isFormValid,
    loading,
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
    brandOptions,
    brandsLoading,
    shopOptions,
    shopsLoading,
  };
};

export default useExpenseForm;