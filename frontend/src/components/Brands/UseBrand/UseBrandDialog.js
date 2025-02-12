import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { addBrandValidationSchema } from "../../../validation/validationSchema";
import { StoreContext } from "../../../Store/Store";

const useBrandDialog = (initialBrand = null) => {
  // Memoize the initial state to prevent unnecessary recalculations.
  const initialBrandState = useMemo(
    () => ({
      name: "",
    }),
    []
  );

  // Initialize the brand state using the initial brand (if provided) or the default state.
  const [brand, setBrand] = useState(initialBrand ? initialBrand : { ...initialBrandState });

  // Custom HTTP hook for brands.
  const { sendRequest, loading } = useCustomHttp("/api/brands");

  // Global store context.
  const { dispatch, state } = useContext(StoreContext);

  // Reset server error for brands.
  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "brands" });
  }, [dispatch]);

  // Reset validation errors for brands.
  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });
  }, [dispatch]);

  // Reset the form state and clear all errors.
  const resetFormAndErrors = useCallback(() => {
    setBrand(initialBrand ? initialBrand : { ...initialBrandState });
    resetServerError();
    resetValidationErrors();
  }, [initialBrand, initialBrandState, resetServerError, resetValidationErrors]);

  // Initialize or reset the form when initialBrand changes.
  useEffect(() => {
    if (initialBrand) {
      setBrand((prevBrand) => ({ ...prevBrand, ...initialBrand }));
    } else {
      resetFormAndErrors();
    }
    // (Optional cleanup can be added here if needed.)
  }, [initialBrand, resetFormAndErrors]);

  // Save the brand (create or update) using formatting and validation.
  const handleSaveBrand = async (onClose) => {
    // Prevent submission if the brand name is empty.
    if (!brand.name.trim()) {
      return;
    }

    try {
      // Validate the brand using the validation schema.
      await addBrandValidationSchema.validate({ name: brand.name });
    } catch (validationError) {
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "brands",
        validationErrors: {
          name: { show: true, message: "Navnet må være minst 2 tegn" },
        },
        showError: true,
      });
      return;
    }

    // Format the brand name for consistency.
    const formattedBrand = {
      name: formatComponentFields(brand.name, "brand", "name"),
    };

    try {
      // Determine the correct URL and method based on whether we're updating or creating.
      let url = "/api/brands";
      let method = "POST";
      if (initialBrand) {
        url = `/api/brands/${initialBrand._id}`;
        method = "PUT";
      }

      const { error: addDataError } = await sendRequest(url, method, formattedBrand);

      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "brands",
          showError: true,
        });
      } else {
        // Reset errors and clear the form after successful save.
        dispatch({ type: "RESET_ERROR", resource: "brands" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });
        setBrand({ ...initialBrandState });
        onClose();
        return true;
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "brands",
        showError: true,
      });
    }
  };

  // Delete a brand.
  const handleDeleteBrand = async (selectedBrand, onDeleteSuccess, onDeleteFailure) => {
    try {
      const response = await sendRequest(`/api/brands/${selectedBrand?._id}`, "DELETE");
      if (response.error) {
        onDeleteFailure(selectedBrand);
        return false;
      } else {
        onDeleteSuccess(selectedBrand);
        return true;
      }
    } catch (error) {
      onDeleteFailure(selectedBrand);
      return false;
    }
  };

  // Extract any errors and validation info from the store.
  const displayError = state.error?.brands;
  const validationError = state.validationErrors?.brands?.name;

  // Check if the form is valid.
  const isFormValid = () => {
    return (
      typeof brand.name === "string" &&
      brand.name.trim().length > 0 &&
      !validationError
    );
  };

  return {
    isFormValid,
    loading,
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
  initialBrand: PropTypes.object, // initialBrand is optional.
};

export default useBrandDialog;
