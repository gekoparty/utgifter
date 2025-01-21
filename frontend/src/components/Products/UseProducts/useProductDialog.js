import { useCallback, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../Store/Store";
import { addProductValidationSchema } from "../../../validation/validationSchema";

const useProductDialog = (initialProduct = null) => {
  // Initialize product state with memoization to prevent unnecessary recalculations
  const initialProductState = useMemo(
    () => ({
      name: "",
      brands: [], // Initialize brands as an empty array
      measures: [], // Ensure measures is an array
      measurementUnit: "",
      type: "",
    }),
    []
  );

  // Local state to manage the product form
  const [product, setProduct] = useState(
    initialProduct ? initialProduct : { ...initialProductState }
  );

  // Custom hook for HTTP requests
  const { sendRequest, loading } = useCustomHttp("/api/products");

  // Context for global store management
  const { dispatch, state } = useContext(StoreContext);

  // Reset server errors in the global store
  const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "products",
    });
  }, [dispatch]);

  // Reset validation errors in the global store
  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "products",
    });
  }, [dispatch]);

  // Reset the form and clear all errors
  const resetFormAndErrors = useCallback(() => {
    setProduct(initialProduct ? initialProduct : initialProductState);
    resetServerError();
    resetValidationErrors();
  }, [
    initialProduct,
    initialProductState,
    resetServerError,
    resetValidationErrors,
  ]);

  // Initialize or reset the form when `initialProduct` changes
  useEffect(() => {
    if (initialProduct) {
      setProduct((prevProduct) => ({
        ...prevProduct,
        ...initialProduct,
        measurementUnit: initialProduct.measurementUnit || "",
        measures: initialProduct.measures || [],
      }));
    } else {
      resetFormAndErrors();
    }

    // Cleanup: Clear product and brand resources in the global store
    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "products" });
      dispatch({ type: "CLEAR_RESOURCE", resource: "brands" });
    };
  }, [initialProduct, resetFormAndErrors, dispatch]);

  // Save the product (either create or update)
  const handleSaveProduct = async (onClose) => {
    if (!product.name.trim() || product.brands.length === 0) {
      return; // Ensure product name and brands are valid
    }

    let formattedProduct = { ...product };
    let validationErrors = {};

    try {
      // Format fields for consistency
      formattedProduct.name = formatComponentFields(
        product.name,
        "product",
        "name"
      );
      formattedProduct.brands = product.brands.map((brand) =>
        formatComponentFields(brand, "product", "brands")
      );
      formattedProduct.type = formatComponentFields(
        product.type,
        "product",
        "type"
      );

      // Validate the product using the schema
      await addProductValidationSchema.validate(formattedProduct, {
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
        resource: "products",
        validationErrors: {
          ...state.validationErrors?.products,
          ...validationErrors,
        },
        showError: true,
      });
      return;
    }

    try {
      const url = initialProduct
        ? `/api/products/${initialProduct._id}`
        : "/api/products";
      const method = initialProduct ? "PUT" : "POST";

      const { data, error: addDataError } = await sendRequest(
        url,
        method,
        formattedProduct
      );

      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "products",
          showError: true,
        });
      } else {
        dispatch({ type: "RESET_ERROR", resource: "products" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "products" });
        onClose();
        return true;
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "/api/products",
        showError: true,
      });
    }
  };

  // Delete a product
  const handleDeleteProduct = async (
    selectedProduct,
    onDeleteSuccess,
    onDeleteFailure
  ) => {
    try {
      const response = await sendRequest(
        `/api/products/${selectedProduct?._id}`,
        "DELETE"
      );
      if (response.error) {
        onDeleteFailure(selectedProduct);
        return false;
      } else {
        onDeleteSuccess(selectedProduct);
        dispatch({
          type: "DELETE_ITEM",
          resource: "products",
          payload: selectedProduct._id,
        });
        return true;
      }
    } catch (error) {
      onDeleteFailure(selectedProduct);
      return false;
    }
  };

  // Error and validation state from the global store
  const displayError = state.error?.products;
  const validationError = state.validationErrors?.products;

  // Check if the form is valid
  const isFormValid = () => {
    return (
      !validationError?.name &&
      !validationError?.brands &&
      !validationError?.measurementUnit &&
      !validationError?.type &&
      product?.name?.trim().length > 0 &&
      product?.brands?.length > 0 &&
      product?.measurementUnit?.trim().length > 0 &&
      product?.type?.length > 0
    );
  };

  return {
    isFormValid,
    loading,
    handleSaveProduct,
    handleDeleteProduct,
    displayError,
    validationError,
    product,
    setProduct,
    resetServerError,
    resetValidationErrors,
    resetFormAndErrors,
  };
};

useProductDialog.propTypes = {
  initialProduct: PropTypes.object, // Optional prop for initializing the product
};

export default useProductDialog;
