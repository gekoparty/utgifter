import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useShopDialog from "../UseShop/useShopDialog";
import LinearProgress from '@mui/material/LinearProgress';
import { fetchLocations, fetchCategories } from "../../commons/Utils/apiUtils";

const AddShopDialog = ({ open, onClose, onAdd }) => {
  const {
    shop,
    setShop,
    loading,
    handleSaveShop,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useShopDialog();

  const {
    data: locationOptions,
    isLoading: locationLoading,
    isError: locationError,
  } = useQuery(["locations"], fetchLocations);

  const {
    data: categoryOptions,
    isLoading: categoryLoading,
    isError: categoryError,
  } = useQuery(["categories"], fetchCategories);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    // Call the handleSaveShop function from the hook to save the new shop
    if (isFormValid()) {
      const success = await handleSaveShop(onClose);
      if (success) {
        onAdd({ name: shop.name }); // Trigger the onAdd function to show the success snackbar with the shop name
      }
    }
  };

  //const locationOptions = locations || []; // Use locations or an empty array if it's null
  //const categoryOptions = categories || []; // Use categories or an empty array if it's null

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose(); // Close the dialog after resetting the form and errors
      }}
      dialogTitle="Ny Butikk"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <TextField
              sx={{ marginTop: 2 }}
              size="small"
              label="Butikk"
              value={shop?.name || ""} // Use optional chaining and provide a default value
              error={Boolean(validationError?.name)} // Use optional chaining
              onChange={(e) => {
                setShop({ ...shop, name: e.target.value });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="shops" field="name" loading={loading} />
            ) : null}
          </Grid>
          <Grid item>
            <CreatableSelect
              className="custom-select"
              options={locationOptions}
              size="small"
              label="Sted"
              value={
                shop?.location
                  ? locationOptions.find((loc) => loc.name === shop.location)
                  : null
              } // Use optional chaining to handle empty shop location
              error={Boolean(validationError?.location)} // Use optional chaining
              onChange={(selectedOption) => {
                setShop({ ...shop, location: selectedOption?.name || "" });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
              }}
              getOptionLabel={(option) => option.name} // Set the label for each option
              getOptionValue={(option) => option.name} // Set the value for each option
              placeholder="Velg Sted..."
              isValidNewOption={(inputValue, selectValue, selectOptions) => {
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
                const newLocation = { name: inputValue.trim() };
                setShop({ ...shop, location: newLocation.name || "" });
                locationOptions.push(newLocation);
              }}
              isClearable
              formatCreateLabel={(inputValue) => `Nytt sted: ${inputValue}`}
              
            />
            {locationLoading && <LinearProgress />}
            {displayError || validationError ? (
              <ErrorHandling
                resource="shops"
                field="location"
                loading={loading}
              />
            ) : null}
          </Grid>
          <Grid item>
            <CreatableSelect
              options={categoryOptions}
              size="small"
              label="Kategori"
              value={
                shop?.category
                  ? categoryOptions?.find((cat) => cat.name === shop.category)
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
                  !selectOptions.find(
                    (option) => option.name === inputValue.trim()
                  )
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
              isClearable
              formatCreateLabel={(inputValue) => `Ny Kategori: ${inputValue}`}
            />
            {categoryLoading && <LinearProgress />}
            {displayError || validationError ? (
              <ErrorHandling
                resource="shops"
                field="category"
                loading={loading}
              />
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

AddShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddShopDialog;
