import { useCallback, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import useBrandDialog from '../../Brands/UseBrand/UseBrandDialog';
import { formatComponentFields } from "../../commons/Utils/FormatUtil";
import { StoreContext } from "../../../Store/Store";
import { addProductValidationSchema } from "../../../validation/validationSchema";

const useProductDialog = (initialProduct = null) => {
  const initialProductState = {
    name: "",
    brands: [],
    measurementUnit: "",
  };

 

  const [product, setProduct] = useState(
    initialProduct ? initialProduct : { ...initialProductState }
  );
  

  const { sendRequest, loading } = useCustomHttp("/api/products");
  const { dispatch, state } = useContext(StoreContext);
  const { loading: brandLoading, brands } = useBrandDialog();

  

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
    console.log("Brands in useProductDialog:", brands); // Add this line
    let isUnmounted = false;
    if (initialProduct) {
      setProduct(initialProduct);
    } else {
      resetFormAndErrors();
    }
    return () => {
      isUnmounted = true;

      if (!isUnmounted) {
        // Clear product related data from the store only when leaving the page
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
    console.log(product)
    
  if (!product.name.trim() || product.brands.length === 0) {
    return;
  }

   
  
    let formattedProduct = {};
    let validationErrors = {};
    let formattedBrands;
  
    try {
      const brandNames = product.brands.split(", ").map((brand) => brand.trim());
      formattedBrands = brandNames.map((brand) => ({
        name: formatComponentFields(brand, "brand").name,
      }));

      formattedProduct = {
        ...formatComponentFields(product.name, "product"),
        brands: formattedBrands,
        measurementUnit: product.measurementUnit,
      };
  
  
      
  
      await addProductValidationSchema.validate(formattedProduct, {
        abortEarly: false,
      });

     

    } catch (validationError) {
      console.log("Validation error:", validationError);
      validationError.inner.forEach((err) => {
        
         
      });
      
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
      let url = "/api/products";
      let method = "POST";

      if (initialProduct) {
        url = `/api/products/${initialProduct._id}`;
        method = "PUT";
      } else {
        if (initialProduct === undefined) {
          formattedProduct.brands = [product.brand];
        } else {
          formattedProduct.brands = formattedBrands;
        }
      }
      
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
        const payload = data;
       
        if (initialProduct) {
          dispatch({ type: "UPDATE_ITEM", resource: "products", payload });
        } else {
          // For new shops, add the location to the store if it doesn't exist
          const existingBrand = state.brands.find(
            (bra) => bra.name === formattedProduct.brand
          );
          if (!existingBrand) {
            dispatch({
              type: "ADD_ITEM",
              resource: "brands",
              payload: formattedProduct.brand,
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
      !validationError?.brands &&
      !validationError?.measurementUnit &&
      product?.name?.trim().length > 0 &&
      product?.brands?.length > 0 &&
      product?.measurementUnit?.trim().length > 0
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
    brandLoading,
    brands,
  };
};

useProductDialog.propTypes = {
  initialProduct: PropTypes.object,
};

export default useProductDialog;