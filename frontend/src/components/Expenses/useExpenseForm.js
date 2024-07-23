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
    purchased: true,
    purchaseDate: dayjs().format(),
    registeredDate: null,
  };

  const [expense, setExpense] = useState(
    initialExpense ? initialExpense : { ...initialExpenseState }
  );

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
  }, [initialExpense, resetServerError, resetValidationErrors]);

  useEffect(() => {
    let isUnmounted = false;
    if (initialExpense) {
      setExpense((prevExpense) => ({
        ...prevExpense,
        ...initialExpense,
      }));
    } else {
      resetFormAndErrors();
    }
    return () => {
      isUnmounted = true;

      if (!isUnmounted) {
        dispatch({
          type: "CLEAR_RESOURCE",
          resource: "expenses",
        });
      }
    };
  }, [initialExpense, resetFormAndErrors, dispatch]);

  const handleFieldChange = (field, value) => {
    console.log("handleFieldChange called with:", { field, value });
    setExpense((prevExpense) => ({ ...prevExpense, [field]: value }));
  };

  const handleSaveExpense = async (onClose) => {
    if (!expense.productName.trim() || expense.brandName.length === 0) {
      return; // Handle empty product name or empty brands array
    }

    let formattedExpense;
    let validationErrors = {};

    console.log("Expense before formatting:", expense);

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

      // Extract the categoryName from product details if needed

      console.log("expense", expense);
      formattedExpense = {
        ...expense,
        productName: formattedProductName,
        brandName: formattedBrandName,
        shopName: formattedShopName,
      };

      console.log("Formatted Expense:", formattedExpense);

      await addExpenseValidationSchema.validate(formattedExpense, {
        abortEarly: false, // This ensures Yup collects all field errors
      });
    } catch (validationError) {
      validationError.inner.forEach((err) => {
        validationErrors[err.path] = { show: true, message: err.message };
      });
      console.log("Field-specific errors:", validationErrors);
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "expenses",
        validationErrors: {
          ...state.validationErrors?.expenses,
          ...validationErrors,
        },
        showError: true,
      });
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
        console.log(data);
        if (initialExpense) {
          dispatch({ type: "UPDATE_ITEM", resource: "expenses", payload });
        } else {
          // For new Products, add the brand to the store if it doesn't exist
          const existingBrand = state.brands.find(
            (bra) => bra.name === newExpense.brandName
          );
          if (!existingBrand) {
            dispatch({
              type: "ADD_ITEM",
              resource: "brands",
              payload: newExpense.brand,
            });
          }

          dispatch({ type: "ADD_ITEM", resource: "expenses", payload });
          setExpense({});
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
      !state.validationErrors?.expenses?.productName &&
      !state.validationErrors?.expenses?.brandName &&
      !state.validationErrors?.expenses?.shopName &&
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
