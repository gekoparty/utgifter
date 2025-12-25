import { useCallback, useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addCategoryValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const INITIAL_CATEGORY_STATE = { name: "" };

const useCategoryDialog = (initialCategory = null) => {
  const queryClient = useQueryClient();
  const { sendRequest, loading } = useCustomHttp("/api/categories");
  const { dispatch, state } = useContext(StoreContext);

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  const [category, setCategory] = useState(
    initialCategory
      ? { ...INITIAL_CATEGORY_STATE, ...initialCategory }
      : { ...INITIAL_CATEGORY_STATE }
  );

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "categories" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "categories" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setCategory(
      initialCategory
        ? { ...INITIAL_CATEGORY_STATE, ...initialCategory }
        : { ...INITIAL_CATEGORY_STATE }
    );
    resetServerError();
    resetValidationErrors();
  }, [initialCategory, resetServerError, resetValidationErrors]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (initialCategory) {
      setCategory({ ...INITIAL_CATEGORY_STATE, ...initialCategory });
    } else {
      setCategory({ ...INITIAL_CATEGORY_STATE });
    }

    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "categories" });
    };
  }, [initialCategory, dispatch]);

  // --------------------------------------------------------------------------
  // Mutation: Save (Create/Update)
  // --------------------------------------------------------------------------
  const saveCategoryMutation = useMutation({
    mutationFn: async (formattedCategory) => {
      const url = initialCategory
        ? `/api/categories/${initialCategory._id}`
        : "/api/categories";
      const method = initialCategory ? "PUT" : "POST";
      
      const { data, error } = await sendRequest(url, method, formattedCategory);
      if (error) throw new Error(data?.error || error);
      return data;
    },
    onSuccess: (savedData) => {
      resetServerError();
      resetValidationErrors();
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      // Return data for handleSaveCategory to use
      return savedData;
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "categories",
        showError: true,
      });
    },
  });

  // --------------------------------------------------------------------------
  // Mutation: Delete (New implementation)
  // --------------------------------------------------------------------------
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId) => {
      const { error } = await sendRequest(`/api/categories/${categoryId}`, "DELETE");
      if (error) throw new Error("Could not delete category");
      return categoryId;
    },
    onSuccess: (deletedId) => {
      dispatch({
        type: "DELETE_ITEM",
        resource: "categories",
        payload: deletedId,
      });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => {
      // Error handling is often done in the UI callback, but global state can be set here too
    }
  });

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleSaveCategory = async (onClose) => {
    if (!category.name.trim()) return false;

    resetServerError();
    resetValidationErrors();

    try {
      // 1. Format
      const formattedCategory = {
        ...category,
        name: formatComponentFields(category.name, "category", "name"),
      };

      // 2. Validate
      await addCategoryValidationSchema.validate(formattedCategory, { abortEarly: false });

      // 3. Mutate
      const data = await saveCategoryMutation.mutateAsync(formattedCategory);
      
      // 4. Cleanup
      setCategory({ ...INITIAL_CATEGORY_STATE });
      onClose && onClose();
      
      // Return the saved data so the calling component can use it (e.g. updating a list immediately)
      return data;

    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = {};
        error.inner.forEach((err) => {
          errors[err.path] = { show: true, message: err.message };
        });

        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: "categories",
          validationErrors: {
            ...state.validationErrors?.categories,
            ...errors,
          },
          showError: true,
        });
      }
      return false;
    }
  };

  const handleDeleteCategory = async (selectedCategory, onDeleteSuccess, onDeleteFailure) => {
    try {
      await deleteCategoryMutation.mutateAsync(selectedCategory._id);
      onDeleteSuccess(selectedCategory);
      return true;
    } catch (error) {
      onDeleteFailure(selectedCategory);
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // Return
  // --------------------------------------------------------------------------
  const displayError = state.error?.categories;
  const validationError = state.validationErrors?.categories;

  const isFormValid = () => {
    const hasRequired = category?.name?.trim().length > 0;
    const hasNoErrors = !validationError?.name;
    return hasRequired && hasNoErrors;
  };

  const isLoading = loading || saveCategoryMutation.isPending || deleteCategoryMutation.isPending;

  return {
    isFormValid,
    loading: isLoading,
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
