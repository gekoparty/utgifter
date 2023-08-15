import { useState, useEffect, useContext, useCallback } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { addCategoryValidationSchema } from "../../../validation/validationSchema";
import { StoreContext } from "../../../Store/Store";



const UseCategoryDialog = (initialCategory = null) => {
  const [categoryName, setCategoryName] = useState(initialCategory?.name || "");
  const { sendRequest, loading } = useCustomHttp(
    "/api/categories"
  );
  const { dispatch, state } = useContext(StoreContext);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "categories" });
  }, [dispatch]);

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "categories" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setCategoryName(initialCategory?.name || "");
    dispatch({ type: "RESET_ERROR", resource: "categories" });
    resetValidationErrors();
  }, [dispatch, initialCategory, resetValidationErrors]);

  useEffect(() => {
    if (initialCategory) {
      setCategoryName(initialCategory.name);
    } else {
      resetFormAndErrors();
    }
    return () => {
      // Cleanup function: Clear category related data from the store when the component is unmounted
      dispatch({
        type: "CLEAR_RESOURCE",
        resource: "categories",
      });
    };
  }, [initialCategory, resetFormAndErrors, dispatch])

  const handleSaveCategory = async (onClose) => {
    if (typeof categoryName !== "string" || categoryName.trim().length === 0) {
      return; // Prevent submitting invalid or empty brand name
    }

    try {

      console.log("Category name before validation:", categoryName);
      await addCategoryValidationSchema.validate({ categoryName });
      //resetValidationErrors();
    } catch (validationError) {
      console.log("Validation failed!", validationError);
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "categories",
        validationErrors: {
          categoryName: { show: true, message: "Navnet må være minst 2 tegn" },
        },
        showError: true,
      });
      return; // Exit the function if validation fails
    }

    console.log("categoryName", categoryName)
    const formattedCategoryName = formatComponentFields(categoryName, "category");
   

    try {
      let url = "/api/categories";
      let method = "POST";

      if (initialCategory) {
        url = `/api/categories/${initialCategory._id}`;
        method = "PUT";
      }

      const { data, error: addDataError } = await sendRequest(
        url,
        method,
        formattedCategoryName
      );

      if (addDataError) {
        console.log("value of addDataError", addDataError);
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "categories",
          showError: true,
        });
      } else {
        const payload = data;
        if (initialCategory) {
          dispatch({ type: "UPDATE_ITEM", resource: "categories", payload });
        } else {
          dispatch({ type: "ADD_ITEM", resource: "categories", payload });
        }
        setCategoryName("");
        dispatch({ type: "RESET_ERROR", resource: "categories" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "categories" });

        onClose();
        return true; // Note: Don't close the dialog here, do it in the respective components
      }
    } catch (fetchError) {
      console.log("value of fetchError", fetchError);
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "/api/categories",
        showError: true,
      });
    }
  };

  const handleDeleteCategory = async (
    selectedCategory,
    onDeleteSuccess,
    onDeleteFailure
  ) => {
    try {
      const response = await sendRequest(
        `/api/categories/${selectedCategory?._id}`,
        "DELETE"
      );
      if (response.error) {
        console.log("Error deleting category:", response.error);
        onDeleteFailure(selectedCategory);
        return false; // Indicate deletion failure
      } else {
        console.log("Category deleted successfully");
        onDeleteSuccess(selectedCategory);
        dispatch({
          type: "DELETE_ITEM",
          resource: "categories",
          payload: selectedCategory._id,
        });
        return true;
      }
    } catch (error) {
      console.log("Error deleting category:", error);
      onDeleteFailure(selectedCategory);
      return false; // Indicate deletion failure
    }
  };

  const displayError = state.error?.categories;
  const validationError = state.validationErrors?.categories?.categoryName;

  const isFormValid = () => {
    return (
      typeof categoryName === "string" &&
      categoryName.trim().length > 0 &&
      !validationError
    );
  };

  return {
    categoryName,
    setCategoryName,
    loading,
    handleSaveCategory,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    handleDeleteCategory,
    resetFormAndErrors,
  };
};

UseCategoryDialog.propTypes = {
  initialCategory: PropTypes.object, // initialBrand is optional and should be an object
};

export default UseCategoryDialog;