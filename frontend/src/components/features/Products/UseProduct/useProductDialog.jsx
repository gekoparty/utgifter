import { useCallback, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import useCustomHttp from "../../../../hooks/useHttp";
import { formatComponentFields } from "../../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../../Store/Store";
import { addProductValidationSchema } from "../../../../validation/validationSchema";

const INITIAL_PRODUCT_STATE = {
  name: "",
  brands: [],
  measures: [],
  measurementUnit: "",
  type: "",
};

const useProductDialog = (initialProduct = null) => {
  const queryClient = useQueryClient();
  const { sendRequest, loading } = useCustomHttp("/api/products");
  const { dispatch, state } = useContext(StoreContext);

  // --------------------------------------------------------------------------
  // State Management
  // --------------------------------------------------------------------------
  // Initialize state merging default structure with passed initial data
  const [product, setProduct] = useState(
    initialProduct
      ? { ...INITIAL_PRODUCT_STATE, ...initialProduct }
      : { ...INITIAL_PRODUCT_STATE }
  );

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------
  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "products" });
  }, [dispatch]);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "products" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setProduct(
      initialProduct
        ? { ...INITIAL_PRODUCT_STATE, ...initialProduct }
        : { ...INITIAL_PRODUCT_STATE }
    );
    resetServerError();
    resetValidationErrors();
  }, [initialProduct, resetServerError, resetValidationErrors]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------
  // Sync state when initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setProduct({
        ...INITIAL_PRODUCT_STATE,
        ...initialProduct,
        measurementUnit: initialProduct.measurementUnit || "",
        measures: initialProduct.measures || [],
      });
    } else {
      setProduct({ ...INITIAL_PRODUCT_STATE });
    }

    // Cleanup resources on unmount
    return () => {
      dispatch({ type: "CLEAR_RESOURCE", resource: "products" });
      dispatch({ type: "CLEAR_RESOURCE", resource: "brands" });
      queryClient.removeQueries({ queryKey: ["brands"] });
    };
  }, [initialProduct, dispatch, queryClient]);

  // --------------------------------------------------------------------------
  // Mutation: Save (Create/Update)
  // --------------------------------------------------------------------------
  const saveProductMutation = useMutation({
    mutationFn: async (formattedProduct) => {
      const url = initialProduct
        ? `/api/products/${initialProduct._id}`
        : "/api/products";
      const method = initialProduct ? "PUT" : "POST";

      const { data, error } = await sendRequest(url, method, formattedProduct);
      if (error) throw new Error(data?.error || error);
      return data;
    },
    onSuccess: () => {
      resetServerError();
      resetValidationErrors();
      // Invalidate to fetch fresh data
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
    onError: (error) => {
      dispatch({
        type: "SET_ERROR",
        error: error.message,
        resource: "products",
        showError: true,
      });
    },
  });

  // --------------------------------------------------------------------------
  // Mutation: Delete (New implementation)
  // --------------------------------------------------------------------------
  const deleteProductMutation = useMutation({
    mutationFn: async (productId) => {
      const { error } = await sendRequest(`/api/products/${productId}`, "DELETE");
      if (error) throw new Error("Could not delete product");
      return productId;
    },
    onSuccess: (deletedId) => {
      dispatch({
        type: "DELETE_ITEM",
        resource: "products",
        payload: deletedId,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error) => { // <-- ADDED for consistency
         console.error("Delete product failed:", error);
         
    }
  });

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------
  const handleSaveProduct = async (onClose, onSuccessCallback) => {
    if (!product.name.trim() || product.brands.length === 0) {
      return false;
    }

    resetServerError();
    resetValidationErrors();

    try {
      // 1. Format
      const formattedProduct = {
        ...product,
        name: formatComponentFields(product.name, "product", "name"),
        brands: product.brands.map((brand) =>
          formatComponentFields(brand, "product", "brands")
        ),
        type: formatComponentFields(product.type, "product", "type"),
      };

      // 2. Validate
      await addProductValidationSchema.validate(formattedProduct, {
        abortEarly: false,
      });

      // 3. Mutate
      const data = await saveProductMutation.mutateAsync(formattedProduct);
      
      onSuccessCallback && onSuccessCallback(data); // <-- ADDED: Execute success callback
        setProduct({ ...INITIAL_PRODUCT_STATE }); // <-- CLEANUP: Reset product state 
        onClose && onClose();
        return true;

    } catch (error) {
      if (error.name === "ValidationError") {
        const errors = {};
        error.inner.forEach((err) => {
          errors[err.path] = { show: true, message: err.message };
        });

        dispatch({
          type: "SET_VALIDATION_ERRORS",
          resource: "products",
          validationErrors: {
            ...state.validationErrors?.products,
            ...errors,
          },
          showError: true,
        });
      }
      return false;
    }
  };

  const handleDeleteProduct = async (selectedProduct, onDeleteSuccess, onDeleteFailure) => {
    try {
      await deleteProductMutation.mutateAsync(selectedProduct._id);
      onDeleteSuccess(selectedProduct);
      return true;
    } catch (error) {
      onDeleteFailure(selectedProduct);
      return false;
    }
  };

  // --------------------------------------------------------------------------
  // Validation Check & Return
  // --------------------------------------------------------------------------
  const displayError = state.error?.products;
  const validationError = state.validationErrors?.products;

  const isFormValid = () => {
    const hasRequiredFields = 
        product?.name?.trim().length > 0 &&
        product?.brands?.length > 0 &&
        product?.measurementUnit?.trim().length > 0 &&
        product?.type?.length > 0;
    
    const hasNoValidationErrors = 
        !validationError?.name &&
        !validationError?.brands &&
        !validationError?.measurementUnit &&
        !validationError?.type;

    return hasRequiredFields && hasNoValidationErrors;
  };

  // Combine loading states
  const isLoading = loading || saveProductMutation.isPending || deleteProductMutation.isPending;

  return {
    isFormValid,
    loading: isLoading,
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
  initialProduct: PropTypes.object,
};

export default useProductDialog;
