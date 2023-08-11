import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import CreatableSelect from 'react-select/creatable';
import Select from 'react-select';
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useProductDialog from "../UseProducts/useProductDialog";


const measurementUnitOptions = [
  { value: "l", label: "Litres (l)" },
  { value: "kg", label: "Kilos (kg)" },
  // Add more measurement unit options as needed
];

const AddProductDialog = ({ open, onClose, onAdd, brands }) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior
    console.log("handleSubmit triggered"); // Add this line
    // Call the handleSaveProduct function from the hook to save the new product
    if (isFormValid()) {
      const success = await handleSaveProduct(onClose);
      if (success) {
        onAdd({ name: product.name }); // Trigger the onAdd function to show the success snackbar with the product name
      }
    }
  };

  const brandOptions = brands || [];

  return (
    <BasicDialog
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
              <ErrorHandling resource="products" field="name" loading={loading} />
            ) : null}
          </Grid>
          <Grid item>
          <CreatableSelect
              className="custom-select"
              options={brandOptions}
              size="small"
              label="Merke"
              value={product?.brands || []}
              error={Boolean(validationError?.brands)}
              onChange={(selectedOptions) => {
      setProduct({ ...product, brands: selectedOptions || [] });
      resetValidationErrors();
      resetServerError();
    }}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.name}
              placeholder="Velg Merke..."
              isMulti
              isValidNewOption={(inputValue, selectValue, selectOptions) => {
                return (
                  inputValue.trim() !== "" &&
                  !selectOptions.find((option) => option.name === inputValue.trim())
                );
              }}
              getNewOptionData={(inputValue) => ({
                name: inputValue.trim(),
              })}
              onCreateOption={(inputValue) => {
                const newBrand = { name: inputValue.trim() };
                setProduct({ ...product, brands: [...product.brands, newBrand] });
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="products" field="brands" loading={loading} />
            ) : null}
          </Grid>
          <Grid item>
          <Select
              id="measurementUnit"
              options={measurementUnitOptions}
              value={measurementUnitOptions.find(option => option.value === product?.measurementUnit)}
              onChange={(selectedOption) => {
                setProduct({ ...product, measurementUnit: selectedOption?.value || '' });
                resetValidationErrors();
                resetServerError();
              }}
              isClearable
            />
            {displayError || validationError ? (
              <ErrorHandling resource="products" field="measurementUnit" loading={loading} />
            ) : null}
            {console.log("Measurement Unit:", product?.measurementUnit)}
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
    </BasicDialog>
  );
};

AddProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddProductDialog;