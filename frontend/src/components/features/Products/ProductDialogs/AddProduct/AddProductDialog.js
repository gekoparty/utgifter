// src/components/Expenses/ProductDialogs/AddProductDialog/AddProductDialog.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Grid, Box, Button, Fade, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import useProductDialog from "../../UseProduct/useProductDialog";
import commonSelectStyles from "../../../../commons/Styles/SelectStyles";
import { predefinedTypes, measurementUnitOptions } from "../../../../commons/Consts/constants";
import { useQuery } from "@tanstack/react-query";
import { fetchBrands } from "../../../../commons/Utils/apiUtils";
import LinearProgress from "@mui/material/LinearProgress";

// Import our split components
import ProductNameInput from "./ProductNameInput";
import BrandSelect from "./BrandSelect";
import ProductTypeSelect from "./ProductTypeSelect";
import MeasurementUnitSelect from "./MeasurementUnitSelect";
import MeasuresInput from "./MeasuresInput";

const MemoizedErrorHandling = React.memo(ErrorHandling);

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

  const formattedBrands = useMemo(
    () => product?.brands?.map((brand) => ({ name: brand })) || [],
    [product?.brands]
  );

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

  const handleBrandCreate = useCallback(
    (inputValue) => {
      const trimmedValue = inputValue.trim();
      if (trimmedValue !== "") {
        // Update product state with new brand
        setProduct((prevProduct) => ({
          ...prevProduct,
          brands: [...(prevProduct.brands || []), trimmedValue],
        }));
        resetValidationErrors();
        resetServerError();
      }
    },
    [setProduct, resetValidationErrors, resetServerError]
  );

  const handleBrandChange = useCallback((selectedOptions) => {
    setSelectedBrands(selectedOptions);
    setProduct({
      ...product,
      brands: selectedOptions.map((brand) => brand.name),
    });
    resetValidationErrors();
    resetServerError();
  }, [product, resetValidationErrors, resetServerError, setProduct]);

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
          onClose={() => { resetFormAndErrors(); onClose(); }}
          dialogTitle="Nytt Produkt"
        >
          {(loading || brandLoading) && <LinearProgress />}
          <form onSubmit={handleSubmit}>
            <Grid container direction="column" spacing={2}>
              {/* Product Name */}
              <Grid item>
                <ProductNameInput
                  value={product?.name || ""}
                  onChange={handleNameChange}
                  error={validationError?.name}
                />
                {(displayError || validationError) && (
                  <MemoizedErrorHandling resource="products" field="name" loading={loading} />
                )}
              </Grid>

              {/* Brand Selection */}
              <Grid item>
                <BrandSelect
                  options={brandOptions}
                  value={formattedBrands}
                  onCreateOption={handleBrandCreate} 
                  onChange={handleBrandChange}
                  isLoading={brandLoading}
                  error={brandError}
                  selectStyles={commonSelectStyles}
                />
                {(displayError || validationError) && (
                  <MemoizedErrorHandling resource="products" field="brand" loading={loading} />
                )}
              </Grid>

              {/* Product Type */}
              <Grid item>
                <ProductTypeSelect
                  options={predefinedTypes.map((type) => ({ value: type, label: type }))}
                  value={product?.type ? { value: product.type, label: product.type } : null}
                  onChange={handleProductTypeChange}
                  selectStyles={commonSelectStyles}
                />
              </Grid>

              {/* Measurement Unit */}
              <Grid item>
                <MeasurementUnitSelect
                  options={measurementUnitOptions}
                  value={measurementUnitOptions.find(
                    (option) => option.value === product?.measurementUnit
                  )}
                  onChange={handleMeasurementUnitChange}
                  selectStyles={commonSelectStyles}
                />
                {(displayError || validationError) && (
                  <MemoizedErrorHandling resource="products" field="measurementUnit" loading={loading} />
                )}
              </Grid>

              {/* Measures Input */}
              <Grid item>
                <MeasuresInput
                  options={[]} // you can pass predefined measures if any
                  value={
                    product?.measures?.map((measure) => ({ value: measure, label: measure })) || []
                  }
                  onChange={handleMeasuresChange}
                  onCreateOption={handleMeasureCreate}
                  selectStyles={commonSelectStyles}
                />
              </Grid>

              {/* Action Buttons */}
              <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button type="submit" disabled={loading || !isFormValid()}>
                  {loading ? <CircularProgress size={24} /> : "Lagre"}
                </Button>
                <Button onClick={() => { resetFormAndErrors(); onClose(); }} sx={{ ml: 2 }}>
                  Cancel
                </Button>
              </Grid>
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

