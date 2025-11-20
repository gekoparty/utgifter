import { useCallback, useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addBrandValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const useBrandDialog = (initialBrand = null) => {
  // Memoize initial state
  const initialBrandState = useMemo(() => ({ name: "" }), []);

  // Initialize state
  const [brand, setBrand] = useState(
    initialBrand ? initialBrand : { ...initialBrandState }
  );

  // Custom HTTP hook
  const { sendRequest, loading } = useCustomHttp("/api/brands");

  // Global store context
  const { dispatch, state } = useContext(StoreContext);

  // React Query client
  const queryClient = useQueryClient();

  // Error and validation reset functions
  const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "brands",
    });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "brands",
    });
  }, [dispatch]);

  // Form reset: resets the state and errors
  const resetFormAndErrors = useCallback(() => {
    setBrand(initialBrand ? initialBrand : { ...initialBrandState });
    resetServerError();
    resetValidationErrors();
  }, [initialBrand, initialBrandState, resetServerError, resetValidationErrors]);

  // Effect to update state when initialBrand changes and cleanup on unmount
  useEffect(() => {
    if (initialBrand) {
      setBrand((prevBrand) => ({
        ...prevBrand,
        ...initialBrand,
      }));
    } else {
      resetFormAndErrors();
    }

    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "brands" });
    };
  }, [initialBrand, resetFormAndErrors, dispatch]);

  // Mutation for saving brand with optimistic update and cache invalidation
  const saveBrandMutation = useMutation({
    mutationFn: async (formattedBrand) => {
      const url = initialBrand
        ? `/api/brands/${initialBrand._id}`
        : "/api/brands";
      const method = initialBrand ? "PUT" : "POST";
      const { data, error: apiError } = await sendRequest(url, method, formattedBrand);
      if (apiError) {
        throw new Error(data?.error || apiError);
      }
      return data;
    },
    onMutate: async (formattedBrand) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["brands"] });
      // Snapshot previous value
      const previousBrands = queryClient.getQueryData(["brands"]);
      // Optionally update the cache optimistically here (for add or update)
      return { previousBrands };
    },
    onError: (error, formattedBrand, context) => {
      if (context?.previousBrands) {
        queryClient.setQueryData(["brands"], context.previousBrands);
      }
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "brands",
        showError: true,
      });
    },
    onSuccess: () => {
      // Reset errors and validation
      dispatch({ type: "RESET_ERROR", resource: "brands" });
      dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });
      // Invalidate queries so the list can refresh
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  // Save handler: validates, triggers the mutation, and resets the form
  const handleSaveBrand = async (onClose) => {
    if (!brand.name.trim()) return;

    let formattedBrand = { ...brand };
    let validationErrors = {};

    try {
      // Format the field and validate the brand object
      formattedBrand.name = formatComponentFields(brand.name, "brand", "name");
      await addBrandValidationSchema.validate(formattedBrand, { abortEarly: false });
    } catch (validationError) {
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
      }
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "brands",
        validationErrors: {
          ...state.validationErrors?.brands,
          ...validationErrors,
        },
        showError: true,
      });
      return;
    }

    try {
      await saveBrandMutation.mutateAsync(formattedBrand);
      // Reset the form and close on success
      setBrand({ ...initialBrandState });
      onClose();
      return true;
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError.message,
        resource: "brands",
        showError: true,
      });
    }
  };

  // Delete handler with cache invalidation
  const handleDeleteBrand = async (selectedBrand, onDeleteSuccess, onDeleteFailure) => {
    try {
      const response = await sendRequest(`/api/brands/${selectedBrand?._id}`, "DELETE");
      if (response.error) {
        onDeleteFailure(selectedBrand);
        return false;
      }
      onDeleteSuccess(selectedBrand);
      dispatch({
        type: "DELETE_ITEM",
        resource: "brands",
        payload: selectedBrand._id,
      });
      // Invalidate the brands queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["brands", "paginated"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      return true;
    } catch (error) {
      onDeleteFailure(selectedBrand);
      return false;
    }
  };

  // Expose error and validation states
  const displayError = state.error?.brands;
  const validationError = state.validationErrors?.brands;

  const isFormValid = () => {
    return brand?.name?.trim().length > 0 && !validationError?.name;
  };

  return {
    isFormValid,
    loading: loading || saveBrandMutation.isLoading,
    handleSaveBrand,
    handleDeleteBrand,
    displayError,
    validationError,
    brand,
    setBrand,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

useBrandDialog.propTypes = {
  initialBrand: PropTypes.object,
};

export default useBrandDialog;