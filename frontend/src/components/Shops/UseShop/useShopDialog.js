import { useCallback,useMemo, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import useLocationDialog from "../../Locations/UseLocation/useLocationDialog";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../Store/Store";
import { addShopValidationSchema } from "../../../validation/validationSchema";

const useShopDialog = (initialShop = null) => {
  // Memoize the initialShopState
  const initialShopState = useMemo(() => ({
    name: "",
    location: "",
    category: "",
  }), []);

  const [shop, setShop] = useState(initialShop ? initialShop : { ...initialShopState });

  const { sendRequest, loading } = useCustomHttp("/api/shops");
  const { dispatch, state } = useContext(StoreContext);
  const { loading: locationLoading, locations } = useLocationDialog();

  const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "shops",
    });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "shops",
    });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    const newShop = initialShop || initialShopState;
    setShop(newShop);
    resetServerError();
    resetValidationErrors();
  }, [initialShop, initialShopState, resetServerError, resetValidationErrors]);

  useEffect(() => {
    if (initialShop) {
      setShop(initialShop);
    } else {
      resetFormAndErrors();
    }
  }, [initialShop, resetFormAndErrors, dispatch]);

  useEffect(() => {
    return () => {
      dispatch({
        type: "CLEAR_RESOURCE",
        resource: "categories",
      });
      dispatch({
        type: "CLEAR_RESOURCE",
        resource: "locations",
      });
    };
  }, [dispatch]);

  const handleSaveShop = async (onClose) => {
    if (!shop.name.trim() || !shop.location.trim() || !shop.category.trim()) {
      return;
    }
  
    let formattedShop = { ...shop };
    let validationErrors = {};
  
    try {
      formattedShop.name = formatComponentFields(shop.name, "shop", "name");
      formattedShop.location = formatComponentFields(shop.location, "shop", "location");
      formattedShop.category = formatComponentFields(shop.category, "shop", "category");
  
      await addShopValidationSchema.validate(formattedShop, {
        abortEarly: false,
      });
    } catch (validationError) {
      if (validationError.inner) {
        validationError.inner.forEach((err) => {
          validationErrors[err.path] = { show: true, message: err.message };
        });
      }
      console.log("Field-specific errors:", validationErrors);
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
      let url = "/api/shops";
      let method = "POST";
  
      if (initialShop) {
        url = `/api/shops/${initialShop._id}`;
        method = "PUT";
      }
  
      const { data, error: addDataError } = await sendRequest(url, method, formattedShop);
  
      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "shops",
          showError: true,
        });
      } else {
        // Use the returned data
        console.log("Response from the server:", data);
        setShop(initialShopState); // Reset form after saving
        dispatch({ type: "RESET_ERROR", resource: "shops" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "shops" });
        
        // Pass the saved data to the onClose callback, if needed
        onClose(data);
        return true;
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "/api/shops",
        showError: true,
      });
    }
  };

  const handleDeleteShop = async (
    selectedShop,
    onDeleteSuccess,
    onDeleteFailure
  ) => {
    try {
      const response = await sendRequest(
        `/api/shops/${selectedShop?._id}`,
        "DELETE"
      );
      if (response.error) {
        console.log("error deleting shop", response.error);
        onDeleteFailure(selectedShop);
        return false;
      } else {
        console.log("Delete success", selectedShop);
        onDeleteSuccess(selectedShop);
        dispatch({
          type: "DELETE_ITEM",
          resource: "shops",
          payload: selectedShop._id,
        });
        return true;
      }
    } catch (error) {
      console.log("Error deleting Shop:", error);
      onDeleteFailure(selectedShop);
      return false; // Indicate deletion failure
    }
  };

  const displayError = state.error?.shops;
  const validationError = state.validationErrors?.shops;

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
    locationLoading,
    locations,
  };
};

useShopDialog.propTypes = {
  initialShop: PropTypes.object,
};

export default useShopDialog;
