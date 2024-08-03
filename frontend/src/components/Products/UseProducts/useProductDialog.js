import { useCallback, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../Store/Store";
import { addProductValidationSchema } from "../../../validation/validationSchema";

const useProductDialog = (initialProduct = null) => {
  // Memoize the initialProductState
  const initialProductState = useMemo(() => ({
    name: "",
    brands: [], // Initialize brands as an empty array
    measurementUnit: "",
    type: "",
  }), []);

  const [product, setProduct] = useState(
    initialProduct ? initialProduct : { ...initialProductState }
  );

  const { sendRequest, loading } = useCustomHttp("/api/products");
  const { dispatch, state } = useContext(StoreContext);

  const resetServerError = useCallback(() => {
    dispatch({
      type: "RESET_ERROR",
      resource: "products",
    });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({
      type: "RESET_VALIDATION_ERRORS",
      resource: "products",
    });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setProduct(initialProduct ? initialProduct : initialProductState);
    resetServerError();
    resetValidationErrors();
  }, [initialProduct, initialProductState, resetServerError, resetValidationErrors]);

  useEffect(() => {
    if (initialProduct) {
      setProduct((prevProduct) => ({
        ...prevProduct,
        ...initialProduct,
        measurementUnit: initialProduct.measurementUnit || "", // Set to an empty string if not provided
      }));
      console.log("Initial Product:", initialProduct);
    } else {
      resetFormAndErrors();
    }

    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "products" });
      dispatch({ type: "CLEAR_RESOURCE", resource: "brands" });
    };
  }, [initialProduct, resetFormAndErrors, dispatch]);

  const handleSaveProduct = async (onClose) => {
    if (!product.name.trim() || product.brands.length === 0) {
      return; // Handle empty product name or empty brands array
    }

    let formattedProduct = { ...product };
    let validationErrors = {};

    console.log("Product before formatting:", product);

    try {
      // Format the product name
      formattedProduct.name = formatComponentFields(product.name, "product", "name");
      // Format the brands array correctly
      formattedProduct.brands = product.brands.map((brand) =>
        formatComponentFields(brand, "product", "brands")
      );
      formattedProduct.type = formatComponentFields(product.type, "product", "type");

      console.log("formattedProduct", formattedProduct);

      await addProductValidationSchema.validate(formattedProduct, {
        abortEarly: false, // This ensures Yup collects all field errors
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
        resource: "products",
        validationErrors: {
          ...state.validationErrors?.products,
          ...validationErrors,
        },
        showError: true,
      });
      return;
    }

    const newProduct = formattedProduct;
    console.log("newProduct", newProduct);

    try {
      let url = "/api/products";
      let method = "POST";

      if (initialProduct) {
        url = `/api/products/${initialProduct._id}`;
        method = "PUT";
      }

      const { data, error: addDataError } = await sendRequest(url, method, newProduct);

      console.log("Response from the server:", data);

      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "products",
          showError: true,
        });
      } else {
        // Handle success, but no need to update the store
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
      return false; // Indicate deletion failure
    }
  };

  const displayError = state.error?.products;
  const validationError = state.validationErrors?.products;

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
  initialProduct: PropTypes.object, // initialProduct is optional and should be an object
};

export default useProductDialog;
