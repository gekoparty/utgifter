import { useCallback, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../Store/Store";
import { addProductValidationSchema } from "../../../validation/validationSchema";

const useProductDialog = (initialProduct = null) => {
  const initialProductState = {
    name: "",
    brands: [],
    measurementUnit: "",
    type: "",
  };

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProduct, resetServerError, resetValidationErrors]);

  useEffect(() => {
    let isUnmounted = false;
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
      isUnmounted = true;

      if (!isUnmounted) {
        // Clear product-related data from the store only when leaving the page
        dispatch({
          type: "CLEAR_RESOURCE",
          resource: "products",
        });
        dispatch({
          type: "CLEAR_RESOURCE",
          resource: "brands",
        });
      }
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
      if (validationError.inner) { // Ensure validationError.inner is defined
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

      const { data, error: addDataError } = await sendRequest(
        url,
        method,
        newProduct
      );

      console.log("Response from the server:", data);

      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "products",
          showError: true,
        });
      } else {
        const payload = data;
        console.log(data);
        if (initialProduct) {
          dispatch({ type: "UPDATE_ITEM", resource: "products", payload });
        } else {
          // For new Products, add the brand to the store if it doesn't exist
          const existingBrand = state.brands.find(
            (bra) => bra.name === newProduct.brands[0] // Assuming brands is an array
          );
          if (!existingBrand) {
            dispatch({
              type: "ADD_ITEM",
              resource: "brands",
              payload: newProduct.brands[0],
            });
          }

          dispatch({ type: "ADD_ITEM", resource: "products", payload });
          setProduct({});
        }
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
      !validationError?.brands && // Update this line to use 'brands'
      !validationError?.measurementUnit &&
      !validationError?.type && // Include type validation
      product?.name?.trim().length > 0 &&
      product?.brands?.length > 0 && // Update this line to use 'brands'
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
