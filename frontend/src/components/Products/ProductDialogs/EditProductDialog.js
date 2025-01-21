import React, { useState, useEffect, useMemo } from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useProductDialog from "../UseProducts/useProductDialog";
import { fetchBrands } from "../../commons/Utils/apiUtils";
import {
  measurementUnitOptions,
  predefinedTypes,
} from "../../commons/Consts/constants";

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
    data: brandOptions,
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery(["brands"], fetchBrands);

  // Local state for selected brands and measures
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [measures, setMeasures] = useState([]); // State to manage measures input

  // Sync selected product and reset state on open
  useEffect(() => {
    if (open) {
      const initialBrands = Array.isArray(selectedProduct.brand)
        ? selectedProduct.brand.map((brand) => ({ label: brand, value: brand }))
        : typeof selectedProduct.brand === "string"
        ? selectedProduct.brand.split(",").map((brand) => ({
            label: brand.trim(),
            value: brand.trim(),
          }))
        : [];

      setSelectedBrands(initialBrands);
      setProduct({
        ...selectedProduct,
        brands: initialBrands.map((brand) => brand.value),
      });

      // Convert measures to string format for consistent input handling
      setMeasures(
        selectedProduct.measures
          ? selectedProduct.measures.map((measure) => measure.toString())
          : []
      );
    }
  }, [selectedProduct, open]);

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
        brands: product.brands, // Ensure brands array is correctly set
        measures: measures.map((measure) => parseFloat(measure)), // Convert measures to float
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
        <Grid container direction="column" spacing={1}>
          {/* Product Name Field */}
          <Grid item>
            <TextField
              sx={{ marginTop: 2 }}
              size="small"
              label="Product Name"
              value={product?.name || ""}
              error={Boolean(validationError?.name)}
              onChange={(e) => {
                setProduct({ ...product, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling
                resource="products"
                field="name"
                loading={loading}
              />
            ) : null}
          </Grid>

          {/* Brand Selector */}
          <Grid item>
            <CreatableSelect
              className="custom-select"
              options={
                brandOptions?.map((brand) => ({
                  label: brand.name,
                  value: brand.name,
                })) || []
              }
              value={selectedBrands}
              isMulti
              onChange={(selectedOptions) => {
                setSelectedBrands(selectedOptions || []);
                setProduct({
                  ...product,
                  brands: (selectedOptions || []).map((option) => option.value),
                });
                resetValidationErrors();
                resetServerError();
              }}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.value}
              placeholder="Select Brand..."
              isClearable
              formatCreateLabel={(inputValue) => `New Brand: ${inputValue}`}
              onCreateOption={(inputValue) => {
                const newBrand = {
                  label: inputValue.trim(),
                  value: inputValue.trim(),
                };
                setSelectedBrands([...selectedBrands, newBrand]);
                setProduct({
                  ...product,
                  brands: [...(product.brands || []), newBrand.value],
                });
              }}
            />
          </Grid>

          {/* Type Selector */}
          <Grid item>
            <Select
              options={predefinedTypes.map((type) => ({
                value: type,
                label: type,
              }))}
              value={
                product?.type
                  ? { value: product.type, label: product.type }
                  : null
              }
              onChange={(selectedOption) => {
                setProduct({
                  ...product,
                  type: selectedOption?.value || "",
                });
                resetValidationErrors();
                resetServerError();
              }}
              isClearable
              isSearchable
            />
          </Grid>

          {/* Measurement Unit Selector */}
          <Grid item>
            <Select
              options={measurementUnitOptions}
              value={
                measurementUnitOptions.find(
                  (option) => option.value === product?.measurementUnit
                ) || null
              }
              onChange={(selectedOption) => {
                setProduct({
                  ...product,
                  measurementUnit: selectedOption?.value || "",
                });
                resetValidationErrors();
                resetServerError();
              }}
              isClearable
              isSearchable
            />
          </Grid>

          {/* Measures Field */}
          <Grid item>
            <CreatableSelect
              options={[]}
              isMulti
              value={measures.map((measure) => ({
                value: measure,
                label: measure,
              }))}
              onChange={(selectedOptions) => {
                const selectedMeasures = selectedOptions.map(
                  (option) => option.value
                );
                setMeasures(selectedMeasures);
                setProduct({ ...product, measures: selectedMeasures });
                resetValidationErrors();
                resetServerError();
              }}
              isValidNewOption={(inputValue) =>
                /^\d+(\.\d+)?$/.test(inputValue.trim())
              }
              onCreateOption={(inputValue) => {
                const trimmedValue = inputValue.trim();
                if (/^\d+(\.\d+)?$/.test(trimmedValue)) {
                  setMeasures((prevMeasures) => [
                    ...prevMeasures,
                    trimmedValue,
                  ]);
                  setProduct((prevProduct) => ({
                    ...prevProduct,
                    measures: [...(prevProduct.measures || []), trimmedValue],
                  }));
                }
              }}
              placeholder="Add Measures..."
            />
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ ml: 2 }}
          >
            Cancel
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
