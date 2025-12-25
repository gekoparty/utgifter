import { useCallback, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addBrandValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const INITIAL_BRAND_STATE = { name: "" };

const useBrandDialog = (initialBrand = null) => {
  const queryClient = useQueryClient();
  const { sendRequest, loading } = useCustomHttp("/api/brands");
  const { dispatch, state } = useContext(StoreContext);

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  const [brand, setBrand] = useState(
    initialBrand
      ? { ...INITIAL_BRAND_STATE, ...initialBrand }
      : { ...INITIAL_BRAND_STATE }
  );

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "brands" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setBrand(
      initialBrand
        ? { ...INITIAL_BRAND_STATE, ...initialBrand }
        : { ...INITIAL_BRAND_STATE }
    );
    resetServerError();
    resetValidationErrors();
  }, [initialBrand, resetServerError, resetValidationErrors]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (initialBrand) {
      setBrand({ ...INITIAL_BRAND_STATE, ...initialBrand });
    } else {
      setBrand({ ...INITIAL_BRAND_STATE });
    }

    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "brands" });
    };
  }, [initialBrand, dispatch]);

  // --------------------------------------------------------------------------
  // Mutation: Save (Create/Update)
  // --------------------------------------------------------------------------
  const saveBrandMutation = useMutation({
    mutationFn: async (formattedBrand) => {
      const url = initialBrand
        ? `/api/brands/${initialBrand._id}`
        : "/api/brands";
      const method = initialBrand ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, formattedBrand);
      if (error) throw new Error(data?.error || error);
      return data;
    },
    onSuccess: (savedData) => {
      resetServerError();
      resetValidationErrors();
      // Invalidate queries so the list can refresh
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands", "paginated"] });
      return savedData;
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "brands",
        showError: true,
      });
    },
  });

  // --------------------------------------------------------------------------
  // ✅ NEW Mutation: Delete
  // --------------------------------------------------------------------------
  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId) => {
      const { error } = await sendRequest(`/api/brands/${brandId}`, "DELETE");
      if (error) throw new Error("Could not delete brand");
      return brandId;
    },
    onSuccess: (deletedId) => {
      dispatch({
        type: "DELETE_ITEM",
        resource: "brands",
        payload: deletedId,
      });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      queryClient.invalidateQueries({ queryKey: ["brands", "paginated"] });
    },
  });

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleSaveBrand = async (onClose) => {
    if (!brand.name.trim()) return false;

    resetServerError();
    resetValidationErrors();

    try {
      // 1. Format
      const formattedBrand = {
        ...brand,
        name: formatComponentFields(brand.name, "brand", "name"),
      };

      // 2. Validate
      await addBrandValidationSchema.validate(formattedBrand, { abortEarly: false });

      // 3. Mutate
      const data = await saveBrandMutation.mutateAsync(formattedBrand);

      // 4. Cleanup
      setBrand({ ...INITIAL_BRAND_STATE });
      onClose && onClose();

      return data;

    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = {};
        error.inner.forEach((err) => {
          errors[err.path] = { show: true, message: err.message };
        });

        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: "brands",
          validationErrors: {
            ...state.validationErrors?.brands,
            ...errors,
          },
          showError: true,
        });
      }
      return false;
    }
  };

  const handleDeleteBrand = async (selectedBrand, onDeleteSuccess, onDeleteFailure) => {
    try {
      await deleteBrandMutation.mutateAsync(selectedBrand._id);
      onDeleteSuccess(selectedBrand);
      return true;
    } catch (error) {
      onDeleteFailure(selectedBrand);
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // Return
  // --------------------------------------------------------------------------
  const displayError = state.error?.brands;
  const validationError = state.validationErrors?.brands;

  const isFormValid = () => {
    return brand?.name?.trim().length > 0 && !validationError?.name;
  };

  const isLoading = loading || saveBrandMutation.isPending || deleteBrandMutation.isPending;

  return {
    isFormValid,
    loading: isLoading,
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