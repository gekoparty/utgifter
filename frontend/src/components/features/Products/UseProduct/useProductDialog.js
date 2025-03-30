import { useCallback, useContext, useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../../Store/Store";
import { addProductValidationSchema } from "../../../../validation/validationSchema";

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

  const queryClient = useQueryClient();

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

    // Cleanup: clear products and brands resources and remove the brands cache
    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "products" });
      dispatch({ type: "CLEAR_RESOURCE", resource: "brands" });
      queryClient.removeQueries({ queryKey: ["brands"] });
    };
  }, [initialProduct, resetFormAndErrors, dispatch, queryClient]);

  // Define the mutation function for saving (create/update) a product.
  const saveProductMutation = useMutation({
    mutationFn: async (formattedProduct) => {
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
        throw new Error(data.error || addDataError);
      }
      return data;
    },
    onMutate: async (formattedProduct) => {
      await queryClient.cancelQueries(["products"]);
      const previousProducts = queryClient.getQueryData(["products"]);

      if (initialProduct) {
        queryClient.setQueryData(["products"], (oldProducts = []) =>
          oldProducts.map((p) =>
            p._id === initialProduct._id ? { ...p, ...formattedProduct } : p
          )
        );
      } else {
        queryClient.setQueryData(["products"], (oldProducts = []) => [
          ...oldProducts,
          {
            ...formattedProduct,
            _id: Math.random().toString(36).substr(2, 9),
          },
        ]);
      }
      return { previousProducts };
    },
    onError: (error, formattedProduct, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(["products"], context.previousProducts);
      }
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "products",
        showError: true,
      });
    },
    onSuccess: (data) => {
      dispatch({ type: "RESET_ERROR", resource: "products" });
      dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "products" });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });

  // Validate and handle product save (create/update)
  const handleSaveProduct = async (onClose) => {
    if (!product.name.trim() || product.brands.length === 0) {
      return false; // or throw an error if required
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
      return false;
    }

    try {
      // Use mutateAsync so we get a promise back and can check the result.
      const data = await saveProductMutation.mutateAsync(formattedProduct);
      setProduct(data);
      onClose && onClose();
      return true;
    } catch (error) {
      // Optionally, log or handle error here
      return false;
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
        queryClient.invalidateQueries({ queryKey: ["products"] });
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
    loading: loading || saveProductMutation.isPending,
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
