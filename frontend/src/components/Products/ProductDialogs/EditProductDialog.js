import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import Select from "react-select";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useProductDialog from "../UseProducts/useProductDialog";

const measurementUnitOptions = [
  { value: "l", label: "Litres (l)" },
  { value: "kg", label: "Kilos (kg)" },
  // Add more measurement unit options as needed
];

const EditProductDialog = ({
  selectedProduct,
  open,
  onClose,
  onUpdateSuccess,
  onUpdateFailure,
  brands,
  brandLoading,
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

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    
    if (isFormValid()) {
      const success = await handleSaveProduct(onClose);
      if (success) {
        onUpdateSuccess(selectedProduct);
      } else {
        onUpdateFailure();
      }
    }
    
  };

  console.log("Brands in EditProductDialog:", brands);

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
              value={product?.name || ""} // Use optional chaining and provide a default value
              error={Boolean(validationError?.name)} // Use optional chaining
              onChange={(e) => {
                setProduct({ ...product, name: e.target.value });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
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
  id="brands"
  options={
    brands
      ? brands.map((brand) => ({
          value: brand.name,
          label: brand.name,
        }))
      : []
  }
  isMulti
  value={
    product?.brands
      ? product.brands
          .split(", ")
          .map((brand) => ({ value: brand.trim(), label: brand.trim() }))
      : []
  }
  onChange={(selectedOptions) => {
    const selectedBrands = selectedOptions.map((option) => option.value);
    setProduct({ ...product, brands: selectedBrands.join(", ") });
    resetValidationErrors();
    resetServerError();
  }}
  isClearable
  formatCreateLabel={(inputValue) => `Create new brand: ${inputValue}`}
/>

  {displayError || validationError ? (
    <ErrorHandling resource="products" field="brands" loading={loading} />
  ) : null}
          </Grid>

          <Grid item>
            <Select
              id="measurementUnit"
              label="Måleenhet"
              options={measurementUnitOptions}
              value={
                measurementUnitOptions.find(
                  (option) => option.value === product?.measurementUnit
                ) || null
              }
              onChange={(selectedOption) => {
                setProduct({
                  ...product,
                  measurementUnit: selectedOption.value,
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
