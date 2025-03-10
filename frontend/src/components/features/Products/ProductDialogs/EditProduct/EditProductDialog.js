import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button, CircularProgress, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ProductForm from "../commons/ProductForm";
import useProductDialog from "../../UseProduct/useProductDialog";

import { fetchBrands } from "../../../../commons/Utils/apiUtils";

const EditProductDialog = ({
  selectedProduct,
  open,
  onClose,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  // Memoize the selectedProduct for stability across renders
  const memoizedSelectedProduct = useMemo(
    () => selectedProduct,
    [selectedProduct]
  );

  // Custom hook for product dialog state management
  const {
    product,
    setProduct,
    loading,
    handleSaveProduct,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useProductDialog(memoizedSelectedProduct);

  // Query to fetch brand options
  const {
    data: brandData = { brands: [] },
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery({
    queryKey: ["brands"], // <-- Fixed query key format
    queryFn: ({ signal }) => fetchBrands({ signal }), // <-- Fixed query function
  });

  const brandOptionsArray = brandData?.brands || [];

  // Local state for selected brands and measures

  const [measures, setMeasures] = useState([]); // State to manage measures input

  // Sync selected product and reset state on open
  useEffect(() => {
    if (open && brandData.brands) { // Ensure brandData is available
      // Normalize brands to an array of IDs (assuming selectedProduct.brand contains IDs)
      let brandIds = [];
      if (Array.isArray(selectedProduct.brand)) {
        brandIds = selectedProduct.brand;
      } else if (typeof selectedProduct.brand === 'string') {
        brandIds = selectedProduct.brand.split(',').map((b) => b.trim());
      }
  
      // Convert brand IDs to names using fetched brandData
      const brandsArray = brandIds.map((id) => {
        const foundBrand = brandData.brands.find((brand) => brand.id === id);
        return foundBrand ? foundBrand.name : id; // Fallback to ID if not found
      });
  
      // Convert measures to strings for consistent handling
      const measuresArray = selectedProduct.measures
        ? selectedProduct.measures.map((m) => m.toString())
        : [];
  
      setProduct({
        ...selectedProduct,
        brands: brandsArray,
        measures: measuresArray,
      });
      resetFormAndErrors();
    }
  }, [selectedProduct, open, setProduct, resetFormAndErrors, brandData])

  const handleNameChange = useCallback(
    (name) => {
      setProduct({ ...product, name });
      resetValidationErrors();
      resetServerError();
    },
    [product, setProduct, resetValidationErrors, resetServerError]
  );

  const handleBrandChange = useCallback(
    (selectedOptions) => {
      setProduct({
        ...product,
        brands: selectedOptions ? selectedOptions.map((opt) => opt.value) : [],
      });
      resetValidationErrors();
      resetServerError();
    },
    [product, setProduct, resetValidationErrors, resetServerError]
  );

  const handleBrandCreate = useCallback(
    (inputValue) => {
      const trimmed = inputValue.trim();
      if (trimmed) {
        setProduct((prevProduct) => ({
          ...prevProduct,
          brands: [...(prevProduct.brands || []), trimmed],
        }));
        resetValidationErrors();
        resetServerError();
      }
    },
    [setProduct, resetValidationErrors, resetServerError]
  );

  const handleProductTypeChange = useCallback(
    (selectedOption) => {
      setProduct({ ...product, type: selectedOption?.value || "" });
      resetValidationErrors();
      resetServerError();
    },
    [product, setProduct, resetValidationErrors, resetServerError]
  );

  const handleMeasurementUnitChange = useCallback(
    (selectedOption) => {
      setProduct({ ...product, measurementUnit: selectedOption?.value || "" });
      resetValidationErrors();
      resetServerError();
    },
    [product, setProduct, resetValidationErrors, resetServerError]
  );

  const handleMeasuresChange = useCallback(
    (newValues) => {
      const updatedMeasures = newValues
        ? newValues.map((option) => option.value)
        : [];
      setMeasures(updatedMeasures);
      setProduct({ ...product, measures: updatedMeasures });
      resetValidationErrors();
      resetServerError();
    },
    [product, setProduct, resetValidationErrors, resetServerError]
  );

  const handleMeasureCreate = useCallback(
    (inputValue) => {
      const trimmed = inputValue.trim();
      if (/^\d+(\.\d+)?$/.test(trimmed)) {
        setMeasures((prev) => [...prev, trimmed]);
        setProduct({
          ...product,
          measures: [...(product.measures || []), trimmed],
        });
        resetValidationErrors();
        resetServerError();
      }
    },
    [product, setProduct, resetValidationErrors, resetServerError]
  );

  // Handle brand query loading state
  if (brandLoading) {
    return <CircularProgress />;
  }

  // Handle brand query error state
  if (brandError) {
    return <div>Error loading brands</div>;
  }

  // Submit handler for saving the product
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
      const updatedProduct = {
        ...product,
        brands: product.brands, // ensure brands array is set
        measures: measures.map((m) => parseFloat(m)), // convert measures to numbers
      };
      const success = await handleSaveProduct(onClose, updatedProduct);
      if (success) {
        onUpdateSuccess(selectedProduct);
      } else {
        onUpdateFailure();
      }
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose();
      }}
      dialogTitle="Edit Product"
    >
      <form onSubmit={handleSubmit}>
        <ProductForm
          product={product}
          onNameChange={handleNameChange}
          onBrandChange={handleBrandChange}
          onBrandCreate={handleBrandCreate}
          onProductTypeChange={handleProductTypeChange}
          onMeasurementUnitChange={handleMeasurementUnitChange}
          onMeasuresChange={handleMeasuresChange}
          onMeasureCreate={handleMeasureCreate}
          brandOptions={brandOptionsArray}
          selectStyles={{}}
          loading={loading}
          validationError={validationError}
          displayError={displayError}
        />
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ ml: 2 }}
          >
            Avbryt
          </Button>
        </Grid>
      </form>
    </BasicDialog>
  );
};

EditProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedProduct: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditProductDialog;
