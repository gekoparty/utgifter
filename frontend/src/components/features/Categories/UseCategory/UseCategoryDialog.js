import { useCallback, useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addCategoryValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const useCategoryDialog = (initialCategory = null) => {
  // Memoize initial state
  const initialCategoryState = useMemo(() => ({ name: "" }), []);

  // Initialize state
  const [category, setCategory] = useState(
    initialCategory ? initialCategory : { ...initialCategoryState }
  );

  // Custom HTTP hook
  const { sendRequest, loading } = useCustomHttp("/api/categories");

  // Global store context
  const { dispatch, state } = useContext(StoreContext);

  // React Query client
  const queryClient = useQueryClient();

  // Error and validation reset functions
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

  // Form reset: resets the state and errors
  const resetFormAndErrors = useCallback(() => {
    setCategory(initialCategory ? initialCategory : { ...initialCategoryState });
    resetServerError();
    resetValidationErrors();
  }, [initialCategory, initialCategoryState, resetServerError, resetValidationErrors]);

  // Effect to update state when initialCategory changes and cleanup on unmount
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

  // Mutation for saving category with optimistic update and cache invalidation
  const saveCategoryMutation = useMutation({
    mutationFn: async (formattedCategory) => {
      const url = initialCategory
        ? `/api/categories/${initialCategory._id}`
        : "/api/categories";
      const method = initialCategory ? "PUT" : "POST";
      const { data, error: apiError } = await sendRequest(url, method, formattedCategory);
      if (apiError) {
        throw new Error(data?.error || apiError);
      }
      return data;
    },
    onMutate: async (formattedCategory) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      // Snapshot previous value
      const previousCategories = queryClient.getQueryData(["categories"]);
      // Optionally update the cache optimistically here (for add or update)
      return { previousCategories };
    },
    onError: (error, formattedCategory, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(["categories"], context.previousCategories);
      }
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "categories",
        showError: true,
      });
    },
    onSuccess: () => {
      // Reset errors and validation
      dispatch({ type: "RESET_ERROR", resource: "categories" });
      dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "categories" });
      // Invalidate queries so the list can refresh
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
  });

  // Save handler: validates, triggers the mutation, and resets the form
  const handleSaveCategory = async (onClose) => {
    if (!category.name.trim()) return;

    let formattedCategory = { ...category };
    let validationErrors = {};

    try {
      // Format the field and validate the category object
      formattedCategory.name = formatComponentFields(category.name, "category", "name");
      await addCategoryValidationSchema.validate(formattedCategory, { abortEarly: false });
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
      await saveCategoryMutation.mutateAsync(formattedCategory);
      // Reset the form and close on success
      setCategory({ ...initialCategoryState });
      onClose();
      return true;
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError.message,
        resource: "categories",
        showError: true,
      });
    }
  };

  // Delete handler (unchanged)
  const handleDeleteCategory = async (selectedCategory, onDeleteSuccess, onDeleteFailure) => {
    try {
      const response = await sendRequest(`/api/categories/${selectedCategory?._id}`, "DELETE");
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
      queryClient.invalidateQueries({ queryKey: ["categories", "paginated"] });
      return true;
    } catch (error) {
      onDeleteFailure(selectedCategory);
      return false;
    }
  };

  // Expose error and validation states
  const displayError = state.error?.categories;
  const validationError = state.validationErrors?.categories;

  const isFormValid = () => {
    return category?.name?.trim().length > 0 && !validationError?.name;
  };

  return {
    isFormValid,
    loading: loading || saveCategoryMutation.isLoading,
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
