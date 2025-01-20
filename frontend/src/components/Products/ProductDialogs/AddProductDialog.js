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

const measurementUnitOptions = [
  { value: "l", label: "Litres (l)" },
  { value: "kg", label: "Kilos (kg)" },
  { value: "stk", label: "Stykk (stk" },
  // Add more measurement unit options as needed
];

// State to store selected brands

const predefinedTypes = [
  "Matvare",
  "Medesin",
  "Elektronikk",
  "Hobby",
  "Katt",
  "Alkohol",
  "Gambling",
  "Bil",
  "Soverom",
  "Båt/Fiske",
  "Hus",
  "Kjøkken",
  "Hage",
  "Datautstyr",
  "Gave",
  "Ferje",
  "Reise",
  "Hår/Hud",
  "Ferdigmat",
  "Brev/Pakke",
  "Jernvare",
  "Elektronikk",
  "Bil",
  "Artikler",
  "Klær",
  "Verktøy",
  "Tobakk",
];

// Add your predefined types here

// Memoized components
const MemoizedBasicDialog = React.memo(BasicDialog);
const MemoizedErrorHandling = React.memo(ErrorHandling);
const MemoizedCreatableSelect = React.memo(CreatableSelect);
const MemoizedSelect = React.memo(Select);

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

  // Memoize the formatted brands to avoid recalculating on each render
  const formattedBrands = useMemo(
    () => product?.brands?.map((brand) => ({ name: brand })) || [],
    [product?.brands]
  );

  useEffect(() => {
    if (open) {
      resetFormAndErrors(); // Reset form and errors using the hook
      setSelectedBrands([]); // Reset selected brands
    }
  }, [open]);

  const {
    data: brandOptions,
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery(["brands"], fetchBrands);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    // Call the handleSaveShop function from the hook to save the new shop
    if (isFormValid()) {
      const success = await handleSaveProduct(onClose, {
        ...product,
        brands: selectedBrands.map((brand) => brand.name), // Set brand as an array of brand names
      });
      if (success) {
        onAdd({ name: product.name }); // Trigger the onAdd function to show the success snackbar with the shop name
      }
    }
  };

  const handleBrandChange = (selectedOptions) => {
    setSelectedBrands(selectedOptions);
    setProduct({
      ...product,
      brands: selectedOptions.map((brand) => brand.name), // Set brands as an array of brand names
    });
    resetValidationErrors();
    resetServerError();
  };

  return (
    <Fade in={open} timeout={300}>
      <Box>
        <MemoizedBasicDialog
          open={open}
          onClose={() => {
            resetFormAndErrors();
            onClose(); // Close the dialog after resetting the form and errors
          }}
          dialogTitle="Nytt Produkt"
        >
          <form onSubmit={handleSubmit}>
            <Grid container direction="column" spacing={2}>
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
              <Grid item>
                <MemoizedCreatableSelect
                
                  styles={commonSelectStyles}
                  options={brandOptions}
                  size="small"
                  label="Merke"
                  isMulti
                  value={formattedBrands} // Use memoized brands here// Map brands to objects for CreatableSelect
                  error={Boolean(validationError?.brand)} // Use optional chaining
                  onChange={handleBrandChange}
                  getOptionLabel={(option) => option.name} // Set the label for each option
                  getOptionValue={(option) => option.name} // Set the value for each option
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
                      brands: [...prevProduct.brands, newBrand.name], // Update brands directly
                    }));
                    resetValidationErrors();
                    resetServerError();
                  }}
                  isClearable
                  formatCreateLabel={(inputValue) => `Nytt sted: ${inputValue}`}
                />
                {brandLoading && <LinearProgress />}
                {displayError || validationError ? (
                  <MemoizedErrorHandling
                    resource="products"
                    field="brand"
                    loading={loading}
                  />
                ) : null}
              </Grid>
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
              <Grid item>
                <MemoizedCreatableSelect
                  styles={commonSelectStyles}
                  options={[]} // No predefined options
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
                  getOptionLabel={(option) => option.label} // Set the label for each option
                  getOptionValue={(option) => option.value} // Set the value for each option
                  placeholder="Legg til mål..."
                  // This isValidNewOption will validate numbers, including decimals
                  isValidNewOption={(inputValue) => {
                    // Check if the input is a valid number (integer or decimal)
                    const numberPattern = /^\d+(\.\d+)?$/; // RegEx pattern to allow integers and decimals
                    return numberPattern.test(inputValue.trim());
                  }}
                  getNewOptionData={(inputValue) => ({
                    value: inputValue.trim(),
                    label: inputValue.trim(),
                  })}
                  onCreateOption={(inputValue) => {
                    const trimmedValue = inputValue.trim();
                    const numberPattern = /^\d+(\.\d+)?$/; // RegEx to allow integers and decimals
                    if (numberPattern.test(trimmedValue)) {
                      setProduct((prevProduct) => ({
                        ...prevProduct,
                        measures: [
                          ...(prevProduct.measures || []),
                          trimmedValue,
                        ], // Add valid numeric measure (integer or decimal)
                      }));
                      resetValidationErrors();
                      resetServerError();
                    } else {
                      // Handle invalid input (though this should not happen due to isValidNewOption)
                      console.error(
                        "Invalid measure input. It must be a valid number."
                      );
                    }
                  }}
                  isClearable
                />
              </Grid>
            </Grid>
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

AddProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddProductDialog;
