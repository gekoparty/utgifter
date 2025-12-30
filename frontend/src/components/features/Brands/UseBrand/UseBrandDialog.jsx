import { useContext, useState, useEffect } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { addBrandValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

const INITIAL_BRAND_STATE = { name: "" };
const BRANDS_QUERY_KEY = ["brands", "paginated"];

const useBrandDialog = (initialBrand = null) => {
  const queryClient = useQueryClient();
  const { sendRequest, loading: httpLoading } = useCustomHttp("/api/brands", {
    auto: false,
  });
  const { dispatch, state } = useContext(StoreContext);

  const isEditMode = Boolean(initialBrand && initialBrand._id);

  // --------------------------------------------------------------------------
  // State
  // --------------------------------------------------------------------------
  const [brand, setBrand] = useState(INITIAL_BRAND_STATE);

  // --------------------------------------------------------------------------
  // Sync when mode changes
  // --------------------------------------------------------------------------
  useEffect(() => {
    setBrand(
      isEditMode
        ? { ...INITIAL_BRAND_STATE, ...initialBrand }
        : { ...INITIAL_BRAND_STATE }
    );
  }, [isEditMode, initialBrand?._id]);

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const resetServerError = () => {
    dispatch({ type: "RESET_ERROR", resource: "brands" });
  };

  const resetValidationErrors = () => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });
  };

  const resetFormAndErrors = () => {
    setBrand(
      isEditMode
        ? { ...INITIAL_BRAND_STATE, ...initialBrand }
        : { ...INITIAL_BRAND_STATE }
    );
    resetServerError();
    resetValidationErrors();
  };

  // --------------------------------------------------------------------------
  // Mutations
  // --------------------------------------------------------------------------
  const saveBrandMutation = useMutation({
    mutationFn: async (formattedBrand) => {
      const url = isEditMode
        ? `/api/brands/${initialBrand._id}`
        : "/api/brands";

      const method = isEditMode ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, formattedBrand);
      if (error) throw new Error(data?.error || error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY });
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

  const deleteBrandMutation = useMutation({
    mutationFn: async (brandId) => {
      const { error } = await sendRequest(`/api/brands/${brandId}`, "DELETE");
      if (error) throw new Error("Could not delete brand");
      return brandId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRANDS_QUERY_KEY });
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
  // Handlers
  // --------------------------------------------------------------------------
  const handleSaveBrand = async () => {
    if (!brand.name.trim()) return false;

    resetServerError();
    resetValidationErrors();

    try {
      const formattedBrand = {
        ...brand,
        name: formatComponentFields(brand.name, "brand", "name"),
      };

      await addBrandValidationSchema.validate(formattedBrand, {
        abortEarly: false,
      });

      const data = await saveBrandMutation.mutateAsync(formattedBrand);

      if (!isEditMode) {
        setBrand({ ...INITIAL_BRAND_STATE });
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

  const handleDeleteBrand = async (brandToDelete) => {
    try {
      await deleteBrandMutation.mutateAsync(brandToDelete._id);
      return true;
    } catch {
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // State selectors
  // --------------------------------------------------------------------------
  const displayError = state.error?.brands;
  const validationError = state.validationErrors?.brands;

  const isFormValid = () =>
    brand?.name?.trim().length > 0 && !validationError?.name;

  const loading =
    httpLoading || saveBrandMutation.isPending || deleteBrandMutation.isPending;

  return {
    brand,
    setBrand,
    isFormValid,
    loading,
    displayError,
    validationError,
    handleSaveBrand,
    handleDeleteBrand,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

export default useBrandDialog;
