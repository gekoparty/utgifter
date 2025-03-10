// src/components/Expenses/ProductDialogs/AddProductDialog/AddProductDialog.js
import React, { useState, useEffect, useCallback } from "react";
import { Grid, Box, Button, Fade, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import useProductDialog from "../../UseProduct/useProductDialog";
import commonSelectStyles from "../../../../commons/Styles/SelectStyles";
import { useQuery } from "@tanstack/react-query";
import { fetchBrands } from "../../../../commons/Utils/apiUtils";
import ProductForm from "../commons/ProductForm";
import LinearProgress from "@mui/material/LinearProgress";

// Import our split components


const AddProductDialog = ({ open, onClose, onAdd }) => {
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
  } = useProductDialog();

  const [selectedBrands, setSelectedBrands] = useState([]);

  

  useEffect(() => {
    if (open) {
      resetFormAndErrors();
      setSelectedBrands([]);
    }
  }, [open, resetFormAndErrors]);

  // Fetch brand options
  const { data: brandData = { brands: [] }, isLoading: brandLoading, isError: brandError } = useQuery({
    queryKey: ["brands"],
    queryFn: ({ signal }) => fetchBrands({ signal }),
  });
  const brandOptions = brandData.brands;

  // Handlers
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveProduct(onClose, {
        ...product,
        brands: selectedBrands.map((brand) => brand.name),
      });
      if (success) {
        onAdd({ name: product.name });
      }
    }
  };

  const handleBrandChange = useCallback((selectedOptions) => {
    setSelectedBrands(selectedOptions);
    setProduct({
      ...product,
      // Extract the brand values from the selected options:
      brands: selectedOptions ? selectedOptions.map((brand) => brand.value) : [],
    });
    resetValidationErrors();
    resetServerError();
  }, [product, resetValidationErrors, resetServerError, setProduct]);
  
  // Update handleBrandCreate to add a new brand in the same shape:
  const handleBrandCreate = useCallback((inputValue) => {
    const trimmedValue = inputValue.trim();
    if (trimmedValue !== "") {
      const newBrand = { label: trimmedValue, value: trimmedValue };
      setSelectedBrands((prev) => [...prev, newBrand]);
      setProduct((prevProduct) => ({
        ...prevProduct,
        // Append the new brand value
        brands: [...(prevProduct.brands || []), trimmedValue],
      }));
      resetValidationErrors();
      resetServerError();
    }
  }, [setProduct, resetValidationErrors, resetServerError]);

  const handleNameChange = (name) => {
    setProduct({ ...product, name });
    resetValidationErrors();
    resetServerError();
  };

  const handleProductTypeChange = (selectedOption) => {
    setProduct({ ...product, type: selectedOption?.value || "" });
    resetValidationErrors();
    resetServerError();
  };

  const handleMeasurementUnitChange = (selectedOption) => {
    setProduct({ ...product, measurementUnit: selectedOption?.value || "" });
    resetValidationErrors();
    resetServerError();
  };

  const handleMeasuresChange = (selectedOptions) => {
    const selectedMeasures = selectedOptions.map(option => option.value);
    setProduct({ ...product, measures: selectedMeasures });
    resetValidationErrors();
    resetServerError();
  };

  const handleMeasureCreate = (inputValue) => {
    const trimmedValue = inputValue.trim();
    const numberPattern = /^\d+(\.\d+)?$/;
    if (numberPattern.test(trimmedValue)) {
      setProduct((prevProduct) => ({
        ...prevProduct,
        measures: [...(prevProduct.measures || []), trimmedValue],
      }));
      resetValidationErrors();
      resetServerError();
    } else {
      console.error("Invalid measure input. It must be a valid number.");
    }
  };

  return (
    <Fade in={open} timeout={300}>
      <Box>
        <BasicDialog
          open={open}
          onClose={() => {
            resetFormAndErrors();
            onClose();
          }}
          dialogTitle="Nytt Produkt"
        >
          {(loading || brandLoading) && <LinearProgress />}
          {brandError && <div>Error loading brands</div>}
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
              brandOptions={brandOptions}
              selectStyles={commonSelectStyles}
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
      </Box>
    </Fade>
  );
};

AddProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddProductDialog;

