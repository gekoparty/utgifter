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

  

  const slugifyFields = {
    POST: ["name", "brands"], // Slugify all three fields for POST method
    PUT: ["name", "brands"], // Slugify only the 'name' field for PUT method
  };

  const { sendRequest, loading } = useCustomHttp("/api/products", slugifyFields);
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
    if (initialProduct) {
      setProduct(initialProduct);
    } else {
      resetFormAndErrors();
    }
  }, [initialProduct, resetFormAndErrors]);

  const handleSaveProduct = async (onClose) => {
    
  if (!product.name.trim() || product.brands.length === 0) {
    return;
  }

    console.log("Before formatting:", product); // Add this log
  
    let formattedProduct = {};
    let validationErrors = {};
    let formattedBrands;
  
    try {
      formattedBrands = product.brands.map((brand) => {
        console.log("Original brand:", brand);
        const formattedBrand = {
          name: formatComponentFields(brand.name, "brand").name,
        };
        console.log("Formatted brand:", formattedBrand);
        return formattedBrand;
      });
      
      console.log("formattedBrands", formattedBrands)

      formattedProduct = {
        ...formatComponentFields(product.name, "product"),
        brands: formattedBrands,
        measurementUnit: product.measurementUnit,
      };
  
      console.log("formattedProduct", formattedProduct); // Add this log
  
      await addProductValidationSchema.validate(formattedProduct, {
        abortEarly: false,
      });

      console.log("Validation successful"); // Add this log

    } catch (validationError) {
      console.log("Validation error:", validationError);
      validationError.inner.forEach((err) => {
        //validationErrors[err.path] = { show: true, message: err.message };
         console.log("Validation error message:", err.message);
    console.log("Validation error path:", err.path);
      });
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
  
    
    console.log("newProduct:", formattedProduct);
  
    try {
      let url = "/api/products";
      let method = "POST";
  
      if (initialProduct) {
        url = `/api/products/${initialProduct._id}`;
        method = "PUT";
      } else {
        if (initialProduct === undefined) {
          formattedProduct.brands = [product.brand]; // Convert single brand to array
        } else {
          formattedProduct.brands = formattedBrands;
        }
      }
      
      const { data, error: addDataError } = await sendRequest(
        url,
        method,
        formattedProduct
      );
  
      console.log("Response from the server:", data); // Add this log
  
      if (addDataError) {
        console.log("adddataError", addDataError)
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

      console.log("Error in handleSaveProduct:", fetchError); // Add this log
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
        console.log("error deleting product", response.error);
        onDeleteFailure(selectedProduct);
        return false;
      } else {
        console.log("Delete success", selectedProduct);
        onDeleteSuccess(selectedProduct);
        dispatch({
          type: "DELETE_ITEM",
          resource: "products",
          payload: selectedProduct._id,
        });
        return true;
      }
    } catch (error) {
      console.log("Error deleting Product:", error);
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