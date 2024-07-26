import { useState, useEffect, useCallback, useContext } from "react";
import dayjs from "dayjs";
import { formatComponentFields } from "../commons/Utils/FormatUtil";
import { StoreContext } from "../../Store/Store";
import { addExpenseValidationSchema } from "../../validation/validationSchema";
import useCustomHttp from "../../hooks/useHttp";

const useExpenseForm = (initialExpense = null) => {
  const initialExpenseState = {
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

  const [expense, setExpense] = useState(
    initialExpense ? initialExpense : { ...initialExpenseState }
  );
  const [validationErrors, setValidationErrors] = useState({});

  const { sendRequest, loading } = useCustomHttp("/api/expenses");
  const { dispatch, state } = useContext(StoreContext);

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
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setExpense(initialExpense ? initialExpense : initialExpenseState);
    resetServerError();
    resetValidationErrors();
    setValidationErrors({});
  }, [initialExpense, resetServerError, resetValidationErrors]);

  useEffect(() => {
    if (initialExpense) {
      setExpense((prevExpense) => ({
        ...prevExpense,
        ...initialExpense,
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
    if (!expense || !expense.productName.trim() || !expense.brandName.trim()) {
      console.error("Invalid expense:", expense);
      return; // Handle empty product name or empty brands array
    }
  
    let formattedExpense;
    let validationErrors = {};
  
    try {
      const formattedProductName = formatComponentFields(
          expense.productName,
          "expense",
          "productName"
      );
      const formattedBrandName = formatComponentFields(
          expense.brandName,
          "expense",
          "brandName"
      );
      const formattedShopName = formatComponentFields(
          expense.shopName,
          "expense",
          "shopName"
      );
      const formattedLocationName = formatComponentFields(
          expense.locationName,
          "expense",
          "locationName"
      );
      const formattedType = formatComponentFields(
          expense.type,
          "expense",
          "type"
      );

      formattedExpense = {
          ...expense,
          productName: formattedProductName,
          brandName: formattedBrandName,
          shopName: formattedShopName,
          locationName: formattedLocationName,
          type: formattedType,
      };
  
      await addExpenseValidationSchema.validate(formattedExpense, {
        abortEarly: false,
      });
    } catch (validationError) {
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
        console.error(validationError);
      }
      return;
    }
  
    const newExpense = formattedExpense;
    console.log("newExpense", newExpense);
  
    try {
      let url = "/api/expenses";
      let method = "POST";
  
      if (initialExpense) {
        url = `/api/expenses/${initialExpense._id}`;
        method = "PUT";
      }
  
      const { data, error: addDataError } = await sendRequest(
        url,
        method,
        newExpense
      );
  
      console.log("Response from the server:", data);
  
      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "expenses",
          showError: true,
        });
      } else {
        const payload = data;
  
        if (initialExpense) {
          dispatch({ type: "UPDATE_ITEM", resource: "expenses", payload });
        } else {
          dispatch({ type: 'ADD_ITEM', resource: 'expenses', payload: newExpense });
          setExpense(initialExpenseState)
        }
        dispatch({ type: "RESET_ERROR", resource: "expenses" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "expenses" });
        onClose();
        return true;
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "/api/expenses",
        showError: true,
      });
    }
  };

  const isFormValid = () => {
    return (
      !Object.values(validationErrors).some((error) => error) &&
      expense.productName.trim().length > 0 &&
      expense.brandName.trim().length > 0 &&
      expense.shopName.trim().length > 0 &&
      expense.volume > 0 &&
      expense.price > 0
    );
  };

  return {
    isFormValid,
    loading,
    handleSaveExpense,
    expense,
    setExpense,
    handleFieldChange,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

export default useExpenseForm;