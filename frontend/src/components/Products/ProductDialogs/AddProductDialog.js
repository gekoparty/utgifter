import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import Select from "react-select";
import CreatableSelect from 'react-select/creatable';
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useProductDialog from "../UseProducts/useProductDialog";

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

    // Call the handleSaveProdct function from the hook to save the new product
    if (isFormValid()) {
      const success = await handleSaveProduct(onClose);
      if (success) {
        onAdd({ name: product.name }); // Trigger the onAdd function to show the success snackbar with the shop name
      }
    }
  };

  const brandOptions = brands || []; // Use locations or an empty array if it's null
  //const categoryOptions = categories || []; // Use categories or an empty array if it's null


  


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
              value={product?.name || ""} // Use optional chaining and provide a default value
              error={Boolean(validationError?.name)} // Use optional chaining
              onChange={(e) => {
                setProduct({ ...product, name: e.target.value });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
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
              label="Sted"
              value={
                product?.brand
                  ? brandOptions.find((bra) => bra.name === product.brand)
                  : null
              } // Use optional chaining to handle empty product brand
              error={Boolean(validationError?.brand)} // Use optional chaining
              onChange={(selectedOption) => {
                setProduct({ ...product, brand: selectedOption?.name || "" });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
              }}
              getOptionLabel={(option) => option.name} // Set the label for each option
              getOptionValue={(option) => option.name} // Set the value for each option
              placeholder="Velg Merke..."
              isValidNewOption={(inputValue, selectValue, selectOptions) => {
                return (
                  inputValue.trim() !== "" &&
                  !selectOptions.find((option) => option.name === inputValue.trim())
                );
              }}
              getNewOptionData={(inputValue, optionLabel) => ({
                name: inputValue.trim(),
              })}
              onCreateOption={(inputValue) => {
                const newBrand = { name: inputValue.trim() };
                setProduct({ ...product, location: newBrand.name || "" });
                brandOptions.push(newBrand);
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="products" field="brand" loading={loading} />
            ) : null}
          </Grid>
          <Grid item>
          {/* <CreatableSelect
              options={categoryOptions}
              size="small"
              label="Kategori"
              value={
                shop?.category
                  ? categoryOptions.find((cat) => cat.name === shop.category)
                  : null
              }
              error={Boolean(validationError?.category)} // Use optional chaining
              onChange={(selectedOption) => {
                setShop({ ...shop, category: selectedOption?.name || "" });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
              }}
              getOptionLabel={(option) => option.name} // Set the label for each option
              getOptionValue={(option) => option.name} // Set the value for each option
              placeholder="Velg Kategori..."
              isValidNewOption={(inputValue, selectValue, selectOptions) => {
                return (
                  inputValue.trim() !== "" &&
                  !selectOptions.find((option) => option.name === inputValue.trim())
                );
              }}
              getNewOptionData={(inputValue, optionLabel) => ({
                name: inputValue.trim(),
              })}
              onCreateOption={(inputValue) => {
                const newCategory = { name: inputValue.trim() };
                setShop({ ...shop, category: newCategory.name || "" });
                categoryOptions.push(newCategory);
              }}
            /> */}
            {displayError || validationError ? (
              <ErrorHandling resource="products" field="category" loading={loading} />
            ) : null}
          </Grid>
        </Grid>
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors(); // Reset the form and errors when the cancel button is clicked
              onClose(); // Close the dialog
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