import React, {useState, useEffect} from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useProductDialog from "../UseProducts/useProductDialog";
import { fetchBrands } from "../../commons/Utils/apiUtils";
import { measurementUnitOptions, predefinedTypes } from "../../commons/Consts/constants"



const EditProductDialog = ({
  selectedProduct,
  open,
  onClose,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
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
  } = useProductDialog(selectedProduct);

  const {
    data: brandOptions,
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery(["brands"], fetchBrands);

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [measures, setMeasures] = useState([]); // State for handling measures

  console.log("selectedProduct:", selectedProduct);
  // Effect for handling selected product changes
  useEffect(() => {
    if (open) {
      const initialBrands = Array.isArray(selectedProduct.brand)
        ? selectedProduct.brand.map((brand) => ({ label: brand, value: brand }))
        : typeof selectedProduct.brand === 'string'
        ? selectedProduct.brand.split(',').map((brand) => ({ label: brand.trim(), value: brand.trim() }))
        : [];
  
      setSelectedBrands(initialBrands);
  
      // Also make sure product.brands is set correctly when the dialog opens
      setProduct({
        ...selectedProduct,
        brands: initialBrands.map((brand) => brand.value),
      });
  
      // Handle measures
      if (Array.isArray(selectedProduct.measures)) {
        setMeasures(selectedProduct.measures.map((measure) => measure.toString()));
      } else {
        setMeasures([]);
      }
    }
  }, [selectedProduct, open]);

  if (brandLoading) {
    // Return a loading indicator while brands are being fetched
    return <CircularProgress />;
  }

  if (brandError) {
    // Handle error state when fetching brands fails
    return <div>Error loading brands</div>;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    if (isFormValid()) {
      const updatedProduct = {
        ...product,
        brands: product.brands, // Make sure product.brands is properly set
        measures: measures.map((measure) => parseFloat(measure)), // Convert to float
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
              <ErrorHandling
                resource="products"
                field="name"
                loading={loading}
              />
            ) : null}
          </Grid>

          <Grid item>
  <CreatableSelect
    className="custom-select"
    options={brandOptions?.map((brand) => ({ label: brand.name, value: brand.name })) || []}
    value={selectedBrands}
    isMulti
    onChange={(selectedOptions) => {
      setSelectedBrands(selectedOptions || []);
      setProduct({
        ...product,
        brands: (selectedOptions || []).map(option => option.value), // Update product with selected brand values
      });
      resetValidationErrors();
      resetServerError();
    }}
    getOptionLabel={(option) => option.label}
    getOptionValue={(option) => option.value}
    placeholder="Velg Merke..."
    isClearable
    formatCreateLabel={(inputValue) => `Nytt merke: ${inputValue}`}
    onCreateOption={(inputValue) => {
      const newBrand = { label: inputValue.trim(), value: inputValue.trim() };
      setSelectedBrands([...selectedBrands, newBrand]);
      setProduct({ 
        ...product, 
        brands: [...(product.brands || []), newBrand.value] 
      });
    }}
  />
</Grid>
          <Grid item>
            <Select
              label="Type"
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
            {displayError || validationError ? (
              <ErrorHandling
                resource="products"
                field="type"
                loading={loading}
              />
            ) : null}
          </Grid>

          <Grid item>
            <Select
              label="Målenhet"
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
            {displayError || validationError ? (
              <ErrorHandling
                resource="products"
                field="measurementUnit"
                loading={loading}
              />
            ) : null}
          </Grid>
          <Grid item>
            <CreatableSelect
              
              options={[]} // No predefined options
              isMulti
              value={measures.map((measure) => ({ value: measure, label: measure }))} // Map measures to objects for display
              onChange={(selectedOptions) => {
                const selectedMeasures = selectedOptions.map((option) => option.value);
                setMeasures(selectedMeasures);
                setProduct({ ...product, measures: selectedMeasures });
                resetValidationErrors();
                resetServerError();
              }}
              getOptionLabel={(option) => option.label} // Set the label for each option
              getOptionValue={(option) => option.value} // Set the value for each option
              placeholder="Legg til mål..."
              isValidNewOption={(inputValue) => {
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
                  setMeasures((prevMeasures) => [...prevMeasures, trimmedValue]); // Add valid numeric measure
                  setProduct((prevProduct) => ({
                    ...prevProduct,
                    measures: [...(prevProduct.measures || []), trimmedValue],
                  }));
                  resetValidationErrors();
                  resetServerError();
                } else {
                  console.error("Invalid measure input. It must be a valid number.");
                }
              }}
              isClearable
            />
          </Grid>
        </Grid>
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
