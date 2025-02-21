// Import statements
import React, { useState, useEffect, useMemo } from "react";
import {
  Button,
  TextField,
  CircularProgress,
  Grid,
  Fade,
  Box,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import PropTypes from "prop-types";
import LinearProgress from "@mui/material/LinearProgress";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useProductDialog from "../UseProducts/useProductDialog";
import commonSelectStyles from "../../commons/Styles/SelectStyles";
import { fetchBrands } from "../../commons/Utils/apiUtils";
import {
  measurementUnitOptions,
  predefinedTypes,
} from "../../commons/Consts/constants";

// Memoized components
const MemoizedBasicDialog = React.memo(BasicDialog);
const MemoizedErrorHandling = React.memo(ErrorHandling);
const MemoizedCreatableSelect = React.memo(CreatableSelect);
const MemoizedSelect = React.memo(Select);

// Main component definition
const AddProductDialog = ({ open, onClose, onAdd }) => {
  // Custom hook for product dialog logic
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

  // State for selected brands
  const [selectedBrands, setSelectedBrands] = useState([]);

  // Memoized formatted brands for performance
  const formattedBrands = useMemo(
    () => product?.brands?.map((brand) => ({ name: brand })) || [],
    [product?.brands]
  );

  // Reset form and brands when dialog opens
  useEffect(() => {
    if (open) {
      resetFormAndErrors();
      setSelectedBrands([]);
    }
  }, [open, resetFormAndErrors]);

  // Fetch brand options using React Query
  const {
    data: brandData = { brands: [] },
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery(["brands"], ({ signal }) => fetchBrands({ signal }))

  const brandOptions = brandData.brands;

  // Handle form submission
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

  // Handle changes to the brand selection
  const handleBrandChange = (selectedOptions) => {
    setSelectedBrands(selectedOptions);
    setProduct({
      ...product,
      brands: selectedOptions.map((brand) => brand.name),
    });
    resetValidationErrors();
    resetServerError();
  };

  // Render the component
  return (
    <Fade in={open} timeout={300}>
      <Box>
        {/* Dialog Wrapper */}
        <MemoizedBasicDialog
          open={open}
          onClose={() => {
            resetFormAndErrors();
            onClose();
          }}
          dialogTitle="Nytt Produkt"
        >
          <form onSubmit={handleSubmit}>
            <Grid container direction="column" spacing={2}>
              {/* Product Name Input */}
              <Grid item>
                <TextField
                  sx={{ marginTop: 2 }}
                  size="small"
                  label="Produkt"
                  value={product?.name || ""}
                  error={Boolean(validationError?.name)}
                  onChange={(e) => {
                    setProduct({ ...product, name: e.target.value });
                    resetValidationErrors();
                    resetServerError();
                  }}
                />
                {displayError || validationError ? (
                  <MemoizedErrorHandling
                    resource="products"
                    field="name"
                    loading={loading}
                  />
                ) : null}
              </Grid>

              {/* Brand Selection */}
              <Grid item>
                <MemoizedCreatableSelect
                  styles={commonSelectStyles}
                  options={brandOptions}
                  size="small"
                  label="Merke"
                  isMulti
                  value={formattedBrands}
                  onChange={handleBrandChange}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.name}
                  placeholder="Velg Merke..."
                  isValidNewOption={(
                    inputValue,
                    selectValue,
                    selectOptions
                  ) => {
                    return (
                      inputValue.trim() !== "" &&
                      !selectOptions.find(
                        (option) => option.name === inputValue.trim()
                      )
                    );
                  }}
                  getNewOptionData={(inputValue, optionLabel) => ({
                    name: inputValue.trim(),
                  })}
                  onCreateOption={(inputValue) => {
                    const newBrand = { name: inputValue.trim() };
                    setProduct((prevProduct) => ({
                      ...prevProduct,
                      brands: [...prevProduct.brands, newBrand.name],
                    }));
                    resetValidationErrors();
                    resetServerError();
                  }}
                  isClearable
                  formatCreateLabel={(inputValue) => `Nytt sted: ${inputValue}`}
                />

                {/* Show LinearProgress when brand is loading */}
                {brandLoading && <LinearProgress sx={{ mt: 2 }} />}

                {/* Displaying brand fetch error */}
                {brandError && (
                  <MemoizedErrorHandling
                    resource="brands"
                    field="brand"
                    loading={brandLoading}
                  />
                )}

                {/* Displaying form validation or other errors */}
                {(displayError || validationError) && (
                  <MemoizedErrorHandling
                    resource="products"
                    field="brand"
                    loading={loading}
                  />
                )}
              </Grid>

              {/* Product Type Selection */}
              <Grid item>
                <MemoizedSelect
                  styles={commonSelectStyles}
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
                />
              </Grid>

              {/* Measurement Unit Selection */}
              <Grid item>
                <MemoizedSelect
                  styles={commonSelectStyles}
                  id="measurementUnit"
                  options={measurementUnitOptions}
                  value={measurementUnitOptions.find(
                    (option) => option.value === product?.measurementUnit
                  )}
                  onChange={(selectedOption) => {
                    setProduct({
                      ...product,
                      measurementUnit: selectedOption?.value || "",
                    });
                    resetValidationErrors();
                    resetServerError();
                  }}
                  isClearable
                />
                {displayError || validationError ? (
                  <MemoizedErrorHandling
                    resource="products"
                    field="measurementUnit"
                    loading={loading}
                  />
                ) : null}
              </Grid>

              {/* Measures Input */}
              <Grid item>
                <MemoizedCreatableSelect
                  styles={commonSelectStyles}
                  options={[]}
                  isMulti
                  value={
                    product?.measures?.map((measure) => ({
                      value: measure,
                      label: measure,
                    })) || []
                  }
                  onChange={(selectedOptions) => {
                    const selectedMeasures = selectedOptions.map(
                      (option) => option.value
                    );
                    setProduct({ ...product, measures: selectedMeasures });
                    resetValidationErrors();
                    resetServerError();
                  }}
                  getOptionLabel={(option) => option.label}
                  getOptionValue={(option) => option.value}
                  placeholder="Legg til mål..."
                  isValidNewOption={(inputValue) => {
                    const numberPattern = /^\d+(\.\d+)?$/;
                    return numberPattern.test(inputValue.trim());
                  }}
                  getNewOptionData={(inputValue) => ({
                    value: inputValue.trim(),
                    label: inputValue.trim(),
                  })}
                  onCreateOption={(inputValue) => {
                    const trimmedValue = inputValue.trim();
                    const numberPattern = /^\d+(\.\d+)?$/;
                    if (numberPattern.test(trimmedValue)) {
                      setProduct((prevProduct) => ({
                        ...prevProduct,
                        measures: [
                          ...(prevProduct.measures || []),
                          trimmedValue,
                        ],
                      }));
                      resetValidationErrors();
                      resetServerError();
                    } else {
                      console.error(
                        "Invalid measure input. It must be a valid number."
                      );
                    }
                  }}
                  isClearable
                />
              </Grid>
            </Grid>

            {/* Action Buttons */}
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
                Cancel
              </Button>
            </Grid>
          </form>
        </MemoizedBasicDialog>
      </Box>
    </Fade>
  );
};

// Prop types validation
AddProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddProductDialog;
