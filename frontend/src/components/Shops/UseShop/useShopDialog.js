import React, { useCallback, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
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

  const { sendRequest, loading } = useCustomHttp("/api/shops");
  const { dispatch, state, error } = useContext(StoreContext);

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

    try {
      await addShopValidationSchema.validate({
        name: shop.name,
        location: shop.location,
        category: shop.category,
      });
    } catch (validationError) {
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "shops",
        validationErrors: validationError.message,
        showError: true,
      });
      return;
    }

    const newShop = shop;

    try {
      let url = "/api/shops";
      let method = "POST";

      if (initialShop) {
        url = `/api/shops/${initialShop._id}`;
        method = "PUT";
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
        if (initialShop) {
          dispatch({ type: "UPDATE_ITEM", resource: "shops", payload });
        } else {
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
      const response = await sendRequest(`/api/shops/${selectedShop?._id}`, "DELETE")
      if(response.error) {
        console.log("error deleting shop", response.error)
        onDeleteFailure(selectedShop)
        return false
      } else {
        console.log("Delete success", selectedShop)
        onDeleteSuccess(selectedShop)
        dispatch({
          type: "DELETE_ITEM",
          resource: "shops",
          payload: selectedShop._id

        })
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
  };
};

useShopDialog.propTypes = {
  initialShop: PropTypes.object,
};

export default useShopDialog;
