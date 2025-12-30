import { useContext, useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addCategoryValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const INITIAL_CATEGORY_STATE = { name: "" };
const CATEGORIES_QUERY_KEY = ["categories", "paginated"]; // ✅ match your screens if you use paginated queries

const useCategoryDialog = (initialCategory = null) => {
  const queryClient = useQueryClient();
  const { sendRequest, loading: httpLoading } = useCustomHttp(
    "/api/categories",
    { auto: false }
  );
  const { dispatch, state } = useContext(StoreContext);

  const isEditMode = Boolean(initialCategory && initialCategory._id);

  const [category, setCategory] = useState(INITIAL_CATEGORY_STATE);

  // Sync when selected record changes
  useEffect(() => {
    setCategory(
      initialCategory?._id
        ? { ...INITIAL_CATEGORY_STATE, ...initialCategory }
        : { ...INITIAL_CATEGORY_STATE }
    );
 }, [isEditMode, initialCategory?._id]);

  // Helpers
  const resetServerError = () => {
    dispatch({ type: "RESET_ERROR", resource: "categories" });
  };

  const resetValidationErrors = () => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "categories" });
  };

  const resetFormAndErrors = () => {
    setCategory(
      isEditMode
        ? { ...INITIAL_CATEGORY_STATE, ...initialCategory }
        : { ...INITIAL_CATEGORY_STATE }
    );
    resetServerError();
    resetValidationErrors();
  };

  // Mutations
  const saveCategoryMutation = useMutation({
    mutationFn: async (formattedCategory) => {
      const url = isEditMode
        ? `/api/categories/${initialCategory._id}`
        : "/api/categories";

      const method = isEditMode ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, formattedCategory);
      if (error) throw new Error(data?.error || error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
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

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId) => {
      const { error } = await sendRequest(
        `/api/categories/${categoryId}`,
        "DELETE"
      );
      if (error) throw new Error("Could not delete category");
      return categoryId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
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

  // Handlers
  const handleSaveCategory = async () => {
    if (!category.name.trim()) return false;
    resetServerError();
    resetValidationErrors();

    try {
      const formattedCategory = {
        ...category,
        name: formatComponentFields(category.name, "category", "name"),
      };

      await addCategoryValidationSchema.validate(formattedCategory, {
        abortEarly: false,
      });

      const data = await saveCategoryMutation.mutateAsync(formattedCategory);

      // Only clear form in ADD mode (matches Brand hook)
      if (!isEditMode) {
        setCategory({ ...INITIAL_CATEGORY_STATE });
      }

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

  const handleDeleteCategory = async (categoryToDelete) => {
    if (!categoryToDelete?._id) return false;

    resetServerError();
    resetValidationErrors();

    try {
      await deleteCategoryMutation.mutateAsync(categoryToDelete._id);
      return true;
    } catch {
      return false;
    }
  };

  // State selectors
  const displayError = state.error?.categories;
  const validationError = state.validationErrors?.categories;

  const isFormValid = () =>
    category?.name?.trim().length > 0 && !validationError?.name;

  const loading =
    httpLoading ||
    saveCategoryMutation.isPending ||
    deleteCategoryMutation.isPending;

  return {
    category,
    setCategory,
    isFormValid,
    loading,
    displayError,
    validationError,
    handleSaveCategory,
    handleDeleteCategory,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

export default useCategoryDialog;
