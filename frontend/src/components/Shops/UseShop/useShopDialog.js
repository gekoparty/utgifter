import { useCallback, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import useLocationDialog from "../../Locations/UseLocation/useLocationDialog";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../Store/Store";
import { addShopValidationSchema } from "../../../validation/validationSchema";

const useShopDialog = (initialShop = null) => {
  const initialShopState = {
    name: "",
    location: "",
    category: "",
  };

  const [shop, setShop] = useState(
    initialShop ? initialShop : { ...initialShopState }
  );

  const slugifyFields = {
    POST: ["name", "location", "category"], // Slugify all three fields for POST method
    PUT: ["name", "location", "category"], // Slugify only the 'name' field for PUT method
  };

  const { sendRequest, loading } = useCustomHttp("/api/shops", slugifyFields);
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
    setShop(initialShop ? initialShop : initialShopState);
    resetServerError();
    resetValidationErrors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialShop, resetServerError, resetValidationErrors]);

  useEffect(() => {
    if (initialShop) {
      setShop(initialShop);
    } else {
      resetFormAndErrors();
    }
  }, [initialShop, resetFormAndErrors]);

  const handleSaveShop = async (onClose) => {
    if (!shop.name.trim() || !shop.location.trim() || !shop.category.trim()) {
      return;
    }
  
    let formattedShop;
    let validationErrors = {};
  
    try {
      // Format the shop name, location, and category using the formatComponentFields function
      formattedShop = {
        ...shop,
        name: formatComponentFields(shop.name, "shop").name,
        location: formatComponentFields(shop.location, "shop").name,
        category: formatComponentFields(shop.category, "shop").name,
      };
  
      await addShopValidationSchema.validate(formattedShop, {
        abortEarly: false, // This ensures Yup collects all field errors
      });
    } catch (validationError) {
      validationError.inner.forEach((err) => {
        validationErrors[err.path] = { show: true, message: err.message };
      });
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
  
    const newShop = formattedShop;
  
    try {
      let url = "/api/shops";
      let method = "POST";
  
      if (initialShop) {
        url = `/api/shops/${initialShop._id}`;
        method = "PUT";
      } else {
        if (initialShop === undefined) {
          formattedShop.location = shop.location;
        } else {
          formattedShop.location = formatComponentFields(shop.location, "shop").name;
        }
      }
  
      const { data, error: addDataError } = await sendRequest(
        url,
        method,
        newShop
      );
  
      console.log("Response from the server:", data);
  
      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "shops",
          showError: true,
        });
      } else {
        const payload = data;
        console.log(data);
        if (initialShop) {
          dispatch({ type: "UPDATE_ITEM", resource: "shops", payload });
        } else {
          // For new shops, add the location to the store if it doesn't exist
          const existingLocation = state.locations.find(
            (loc) => loc.name === newShop.location
          );
          if (!existingLocation) {
            dispatch({
              type: "ADD_ITEM",
              resource: "locations",
              payload: newShop.location,
            });
          }
  
          dispatch({ type: "ADD_ITEM", resource: "shops", payload });
          setShop({});
        }
        dispatch({ type: "RESET_ERROR", resource: "shops" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "shops" });
        onClose();
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
