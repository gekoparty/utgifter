import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useShopDialog from "../UseShop/useShopDialog";
import { fetchCategories, fetchLocations } from "../../commons/Utils/apiUtils";

const EditShopDialog = ({
  selectedShop,
  open,
  onClose,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
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
  } = useShopDialog(selectedShop);


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

  if (locationLoading) {
    // Return a loading indicator while brands are being fetched
    return <CircularProgress />;
  }

  if (locationError) {
    // Handle error state when fetching brands fails
    return <div>Error loading Locations</div>;
  }

  if (categoryLoading) {
    // Return a loading indicator while brands are being fetched
    return <CircularProgress />;
  }

  if (categoryError) {
    // Handle error state when fetching brands fails
    return <div>Error loading categories</div>;
  }

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    // Call the handleSaveShop function from the hook to save the updated shop
    if (isFormValid()) {
      const success = await handleSaveShop(onClose);
      if (success) {
        onUpdateSuccess(selectedShop);
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
      dialogTitle="Edit Shop"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={1}>
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
            {/* Use CreatableSelect for the brand */}
            <CreatableSelect
            sx={{ marginTop: 2 }}
              className="custom-select"
              options={locationOptions}
              size="small"
              label="Lokasjon"
              value={
                shop?.location
                  ? locationOptions.find((location) => location.name === shop.location)
                  : null
              }
              error={Boolean(validationError?.location)}
              onChange={(selectedOption) => {
                setShop({ ...shop, location: selectedOption?.name || "" });
                resetValidationErrors();
                resetServerError();
              }}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.name}
              placeholder="Velg Lokasjon..."
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
                const newShop = { name: inputValue.trim() };
                setShop({ ...shop, location: newShop.name || "" });
                locationOptions.push(newShop);
              }}
              isClearable
              formatCreateLabel={(inputValue) => `Ny Lokasjon: ${inputValue}`}
            />
            </Grid>
            <Grid item>
            {/* Use CreatableSelect for the brand */}
            <CreatableSelect
              className="custom-select"
              options={categoryOptions}
              size="small"
              label="Kategori"
              value={
                shop?.category
                  ? categoryOptions.find((category) => category.name === shop.category)
                  : null
              }
              error={Boolean(validationError?.category)}
              onChange={(selectedOption) => {
                setShop({ ...shop, category: selectedOption?.name || "" });
                resetValidationErrors();
                resetServerError();
              }}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.name}
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

EditShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedShop: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditShopDialog;
