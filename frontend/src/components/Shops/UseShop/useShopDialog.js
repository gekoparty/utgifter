import { useCallback,useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import useLocationDialog from "../../Locations/UseLocation/useLocationDialog";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../Store/Store";
import { addShopValidationSchema } from "../../../validation/validationSchema";

const useShopDialog = (initialShop = null) => {
  // Memoize the initial shop state to prevent unnecessary recalculations.
  const initialShopState = useMemo(
    () => ({
      name: "",
      location: "",
      category: "",
    }),
    []
  );

  // Initialize the shop state using the initial shop passed in (if any)
  const [shop, setShop] = useState(
    initialShop ? initialShop : { ...initialShopState }
  );

    // Custom HTTP hook for shops.
  const { sendRequest, loading } = useCustomHttp("/api/shops");

  // Global store context.
  const { dispatch, state } = useContext(StoreContext);

   // Reset server error for shops.
   const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "shops",
    });
  }, [dispatch]);

  // Reset validation errors for shops.
  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "shops",
    });
  }, [dispatch]);


  // Reset the form and clear all errors (mirroring useProductDialog)
  const resetFormAndErrors = useCallback(() => {
    setShop(initialShop ? initialShop : { ...initialShopState });
    resetServerError();
    resetValidationErrors();
  }, [initialShop, initialShopState, resetServerError, resetValidationErrors]);


 // Initialize or reset the form when initialShop changes.
 useEffect(() => {
  if (initialShop) {
    setShop((prevShop) => ({
      ...prevShop,
      ...initialShop,
    }));
  } else {
    resetFormAndErrors();
  }
  // Cleanup: Clear resources for shops (and related options if needed)
  return () => {
    dispatch({ type: "CLEAR_RESOURCE", resource: "categories" });
    dispatch({ type: "CLEAR_RESOURCE", resource: "locations" });
  };
}, [initialShop, resetFormAndErrors, dispatch]);

  // Save the shop (create or update) using similar formatting and validation logic.
  const handleSaveShop = async (onClose) => {
    // Ensure required fields are not empty.
    if (!shop.name.trim() || !shop.location.trim() || !shop.category.trim()) {
      return;
    }

    let formattedShop = { ...shop };
    let validationErrors = {};

    try {
      // Format fields for consistency.
      formattedShop.name = formatComponentFields(shop.name, "shop", "name");
      formattedShop.location = formatComponentFields(shop.location, "shop", "location");
      formattedShop.category = formatComponentFields(shop.category, "shop", "category");

      // Validate the shop using the schema.
      await addShopValidationSchema.validate(formattedShop, {
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
        resource: "shops",
        validationErrors: {
          ...state.validationErrors?.shops,
          ...validationErrors,
        },
        showError: true,
      });
      return;
    }

    try {
      // Determine the correct URL and method.
      const url = initialShop
        ? `/api/shops/${initialShop._id}`
        : "/api/shops";
      const method = initialShop ? "PUT" : "POST";

      const { data, error: addDataError } = await sendRequest(
        url,
        method,
        formattedShop
      );

      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: data?.error || addDataError,
          resource: "shops",
          showError: true,
        });
      } else {
        dispatch({ type: "RESET_ERROR", resource: "shops" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "shops" });
        // Reset form after saving.
        setShop({ ...initialShopState });
        onClose();
        return true;
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "shops",
        showError: true,
      });
    }
  };

  // Delete a shop.
  const handleDeleteShop = async (selectedShop, onDeleteSuccess, onDeleteFailure) => {
    try {
      const response = await sendRequest(
        `/api/shops/${selectedShop?._id}`,
        "DELETE"
      );
      if (response.error) {
        onDeleteFailure(selectedShop);
        return false;
      } else {
        onDeleteSuccess(selectedShop);
        dispatch({
          type: "DELETE_ITEM",
          resource: "shops",
          payload: selectedShop._id,
        });
        return true;
      }
    } catch (error) {
      onDeleteFailure(selectedShop);
      return false;
    }
  };

  // Get error and validation info from the global store.
  const displayError = state.error?.shops;
  const validationError = state.validationErrors?.shops;

  // Check if the form is valid.
  const isFormValid = () => {
    return (
      !validationError?.name &&
      !validationError?.location &&
      !validationError?.category &&
      shop?.name?.trim().length > 0 &&
      shop?.location?.trim().length > 0 &&
      shop?.category?.trim().length > 0
    );
  };

  return {
    isFormValid,
    loading,
    handleSaveShop,
    handleDeleteShop,
    displayError,
    validationError,
    shop,
    setShop,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

useShopDialog.propTypes = {
  initialShop: PropTypes.object,
};

export default useShopDialog;