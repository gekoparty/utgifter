import { useState, useEffect, useContext, useCallback } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { addBrandValidationSchema } from "../../../validation/validationSchema";
import { StoreContext } from "../../../Store/Store";



const useBrandDialog = (initialBrand = null) => {
  const [brandName, setBrandName] = useState(initialBrand?.name || "");
  const { sendRequest, loading } = useCustomHttp("/api/brands");
  const { dispatch, state } = useContext(StoreContext);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });
  }, [dispatch]);

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "brands" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setBrandName(initialBrand?.name || "");
    dispatch({ type: "RESET_ERROR", resource: "brands" });
    resetValidationErrors();
  }, [dispatch, initialBrand, resetValidationErrors]);

  useEffect(() => {
    if (initialBrand) {
      setBrandName(initialBrand.name);
    } else {
      resetFormAndErrors();
    }
  }, [initialBrand, resetFormAndErrors, dispatch]);



  const handleSaveBrand = async (onClose) => {
    if (typeof brandName !== "string" || brandName.trim().length === 0) {
      return; // Prevent submitting invalid or empty brand name
    }

    try {
      await addBrandValidationSchema.validate({ brandName });
    } catch (validationError) {
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "brands",
        validationErrors: {
          brandName: { show: true, message: "Navnet må være minst 2 tegn" },
        },
        showError: true,
      });
      return; // Exit the function if validation fails
    }

    const formattedBrandName = formatComponentFields(brandName, "brand");

    console.log("formattedBrandName",formattedBrandName)

    try {
      let url = "/api/brands";
      let method = "POST";

      if (initialBrand) {
        url = `/api/brands/${initialBrand._id}`;
        method = "PUT";
      }

      const { error: addDataError } = await sendRequest(
        url,
        method,
        formattedBrandName
      );

      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "brands",
          showError: true,
        });
      } else {
        setBrandName("");
        dispatch({ type: "RESET_ERROR", resource: "brands" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });

        onClose();
        return true; // Note: Don't close the dialog here, do it in the respective components
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "/api/brands",
        showError: true,
      });
    }
  };

  const handleDeleteBrand = async (
    selectedBrand,
    onDeleteSuccess,
    onDeleteFailure
  ) => {
    try {
      const response = await sendRequest(
        `/api/brands/${selectedBrand?._id}`,
        "DELETE"
      );
      if (response.error) {
        onDeleteFailure(selectedBrand);
        return false; // Indicate deletion failure
      } else {
        onDeleteSuccess(selectedBrand);
        return true;
      }
    } catch (error) {
      onDeleteFailure(selectedBrand);
      return false; // Indicate deletion failure
    }
  };

  const displayError = state.error?.brands;
  const validationError = state.validationErrors?.brands?.brandName;

  const isFormValid = () => {
    return (
      typeof brandName === "string" &&
      brandName.trim().length > 0 &&
      !validationError
    );
  };

  return {
    brandName,
    setBrandName,
    loading,
    handleSaveBrand, // Make sure to keep these functions accessible
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    handleDeleteBrand, // Make sure to keep these functions accessible
    resetFormAndErrors,
  };
};

useBrandDialog.propTypes = {
  initialBrand: PropTypes.object, // initialBrand is optional and should be an object
};

export default useBrandDialog;
