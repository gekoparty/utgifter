import { useState, useEffect, useContext, useCallback } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../../hooks/useHttp";
import { formattedBrandName } from "../../Utils/BrandUtils";
import { addBrandValidationSchema } from "../../../../validation/validationSchema";
import { StoreContext } from "../../../../Store/Store";

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
  }, [initialBrand, resetFormAndErrors]);

  const handleSaveBrand = async (onClose) => {
    if (typeof brandName !== "string" || brandName.trim().length === 0) {
      return; // Prevent submitting invalid or empty brand name
    }

    try {
      await addBrandValidationSchema.validate({ brandName });
      resetValidationErrors();
    } catch (validationError) {
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "brands",
        validationErrors: { brandName: validationError.message },
        showError: true,
      });
      return; // Exit the function if validation fails
    }

    const formattedName = formattedBrandName(brandName);
    const newBrand = { name: formattedName };

    try {
      let url = "/api/brands";
      let method = "POST";

      if (initialBrand) {
        url = `/api/brands/${initialBrand._id}`;
        method = "PUT";
      }

      const { data, error: addDataError } = await sendRequest(
        url,
        method,
        newBrand
      );

      if (addDataError) {
        console.log("value of addDataError", addDataError);
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "brands",
          showError: true,
        });
      } else {
        const payload = data;
        if (initialBrand) {
          dispatch({ type: "UPDATE_ITEM", resource: "brands", payload });
        } else {
          dispatch({ type: "ADD_ITEM", resource: "brands", payload });
        }
        setBrandName("");
        dispatch({ type: "RESET_ERROR", resource: "brands" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });

        onClose();
        return true; // Note: Don't close the dialog here, do it in the respective components
      }
    } catch (fetchError) {
      console.log("value of fetchError", fetchError);
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
        console.log("Error deleting brand:", response.error);
        onDeleteFailure(selectedBrand);
        return false; // Indicate deletion failure
      } else {
        console.log("Brand deleted successfully");
        onDeleteSuccess(selectedBrand);
        dispatch({
          type: "DELETE_ITEM",
          resource: "brands",
          payload: selectedBrand._id,
        });
        return true;
      }
    } catch (error) {
      console.log("Error deleting brand:", error);
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
    handleSaveBrand,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    handleDeleteBrand,
    resetFormAndErrors,
  };
};

useBrandDialog.propTypes = {
    initialBrand: PropTypes.object, // initialBrand is optional and should be an object
  };
  

export default useBrandDialog;
