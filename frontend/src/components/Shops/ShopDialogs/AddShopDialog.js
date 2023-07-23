import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useShopDialog from "../UseShop/useShopDialog";

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

  const handleAddShop = async () => {
    // Call the handleSaveBrand function from the hook to save the new brand
    const success = await handleSaveShop(onClose);
    if (success) {
      onAdd({ name: shop.name }); // Trigger the onAdd function to show the success snackbar with the shop name
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose(); // Close the dialog after resetting the form and errors
      }}
      dialogTitle="Ny Butikk"
      confirmButton={
        <Button onClick={handleAddShop} disabled={loading || !isFormValid()}>
          {loading ? <CircularProgress size={24} /> : "Lagre"}
        </Button>
      }
      cancelButton={
        <Button
          onClick={() => {
            resetFormAndErrors(); // Reset the form and errors when the cancel button is clicked
            onClose(); // Close the dialog
          }}
        >
          Cancel
        </Button>
      }
    >
      
        <Grid item>
          <TextField
            sx={{ marginTop: 1,  }}
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
          <TextField
          size="small"
            label="Sted"
            value={shop?.location || ""} // Use optional chaining and provide a default value
            error={Boolean(validationError?.location)} // Use optional chaining
            onChange={(e) => {
              setShop({ ...shop, location: e.target.value });
              resetValidationErrors();
              resetServerError(); // Clear validation errors when input changes
            }}
          />
          {displayError || validationError ? (
        <ErrorHandling resource="shops" field="location" loading={loading} />
      ) : null}
        </Grid>
        <Grid item>
          <TextField
          size="small"
            label="Kategori"
            value={shop?.category || ""} // Use optional chaining and provide a default value
            error={Boolean(validationError?.category)} // Use optional chaining
            onChange={(e) => {
              setShop({ ...shop, category: e.target.value });
              resetValidationErrors();
              resetServerError(); // Clear validation errors when input changes
            }}
          />
          {displayError || validationError ? (
        <ErrorHandling resource="shops" field="category" loading={loading} />
      ) : null}
        </Grid>
      
      
    </BasicDialog>
  );
};

AddShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddShopDialog;
