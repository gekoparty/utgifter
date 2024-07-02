import { useState, useEffect, useCallback, useContext } from "react";
import dayjs from "dayjs";
import { formatComponentFields } from '../commons/Utils/FormatUtil'
import { StoreContext } from "../../Store/Store";
import { addExpenseValidationSchema } from "../../validation/validationSchema"
import useCustomHttp from "../../hooks/useHttp";

const useExpenseForm = (initialExpense = null) => {
    const initialExpenseState = {
      productName: "",
      shopName: "",
      brandName: "",
      locationName: "",
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
        let formattedExpense = { ...expense };
        let validationErrors = {};
      
        try {
          // Format fields before saving
          formattedExpense = {
            ...formattedExpense,
            productName: formatComponentFields(expense.productName, "expense", "productName"),
            brandName: formatComponentFields(expense.brandName, "expense", "brandName"),
            shopName: formatComponentFields(expense.shopName, "expense", "shopName"),
          };
      
          await addExpenseValidationSchema.validate(formattedExpense, {
            abortEarly: false,
          });
        } catch (validationError) {
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
          return;
        }
      
        try {
          const url = initialExpense ? `/api/expenses/${initialExpense._id}` : "/api/expenses";
          const method = initialExpense ? "PUT" : "POST";
          const { data, error: addDataError } = await sendRequest(url, method, formattedExpense);
      
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
            resource: "expenses",
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