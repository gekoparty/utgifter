import { useCallback, useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addCategoryValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const useCategoryDialog = (initialCategory = null) => {
  // Memoize initial state
  const initialCategoryState = useMemo(
    () => ({
      name: "",
    }),
    []
  );

  // Initialize state
  const [category, setCategory] = useState(
    initialCategory ? initialCategory : { ...initialCategoryState }
  );

  // Custom HTTP hook
  const { sendRequest, loading } = useCustomHttp("/api/categories");

  // Store context
  const { dispatch, state } = useContext(StoreContext);

  // Error handling
  const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "categories",
    });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "categories",
    });
  }, [dispatch]);

  // Form reset
  const resetFormAndErrors = useCallback(() => {
    setCategory(initialCategory ? initialCategory : { ...initialCategoryState });
    resetServerError();
    resetValidationErrors();
  }, [initialCategory, initialCategoryState, resetServerError, resetValidationErrors]);

  // Effect for initial setup and cleanup
  useEffect(() => {
    if (initialCategory) {
      setCategory((prevCategory) => ({
        ...prevCategory,
        ...initialCategory,
      }));
    } else {
      resetFormAndErrors();
    }

    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "categories" });
    };
  }, [initialCategory, resetFormAndErrors, dispatch]);

  // Save handler
  const handleSaveCategory = async (onClose) => {
    if (!category.name.trim()) return;

    let formattedCategory = { ...category };
    let validationErrors = {};

    try {
      // Format and validate
      formattedCategory.name = formatComponentFields(category.name, "category", "name");
      await addCategoryValidationSchema.validate(formattedCategory, {
        abortEarly: false,
      });
    } catch (validationError) {
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
      }
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "categories",
        validationErrors: {
          ...state.validationErrors?.categories,
          ...validationErrors,
        },
        showError: true,
      });
      return;
    }

    try {
      // API call
      const url = initialCategory
        ? `/api/categories/${initialCategory._id}`
        : "/api/categories";
      const method = initialCategory ? "PUT" : "POST";

      const { data, error: apiError } = await sendRequest(url, method, formattedCategory);

      if (apiError) {
        dispatch({
          type: "SET_ERROR",
          error: data?.error || apiError,
          resource: "categories",
          showError: true,
        });
      } else {
        dispatch({ type: "RESET_ERROR", resource: "categories" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "categories" });
        setCategory({ ...initialCategoryState });
        onClose();
        return true;
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "categories",
        showError: true,
      });
    }
  };

  // Delete handler
  const handleDeleteCategory = async (selectedCategory, onDeleteSuccess, onDeleteFailure) => {
    try {
      const response = await sendRequest(
        `/api/categories/${selectedCategory?._id}`,
        "DELETE"
      );
      if (response.error) {
        onDeleteFailure(selectedCategory);
        return false;
      }
      onDeleteSuccess(selectedCategory);
      dispatch({
        type: "DELETE_ITEM",
        resource: "categories",
        payload: selectedCategory._id,
      });
      return true;
    } catch (error) {
      onDeleteFailure(selectedCategory);
      return false;
    }
  };

  // Validation state
  const displayError = state.error?.categories;
  const validationError = state.validationErrors?.categories;

  const isFormValid = () => {
    return category?.name?.trim().length > 0 && !validationError?.name;
  };

  return {
    isFormValid,
    loading,
    handleSaveCategory,
    handleDeleteCategory,
    displayError,
    validationError,
    category,
    setCategory,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

useCategoryDialog.propTypes = {
  initialCategory: PropTypes.object,
};

export default useCategoryDialog;