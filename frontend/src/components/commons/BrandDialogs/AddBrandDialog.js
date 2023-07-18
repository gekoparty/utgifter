import React from "react";
import { Button, TextField, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../BasicDialog/BasicDialog";
import ErrorHandling from "../ErrorHandling/ErrorHandling";
import useBrandDialog from "./UseBrand/UseBrandDialog";

const AddBrandDialog = ({ open,onClose, onAdd }) => {
  const {
    brandName,
    setBrandName,
    loading,
    handleSaveBrand,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors, 
  } = useBrandDialog();


  const handleAddBrand = async () => {
    // Call the handleSaveBrand function from the hook to save the new brand
    const success = await handleSaveBrand(onClose);
    if (success) {
      onAdd({ name: brandName }); // Trigger the onAdd function to show the success snackbar with the brand name
    }
  };



  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose(); // Close the dialog after resetting the form and errors
      }}
      dialogTitle="Nytt Merke"
      confirmButton={
        <Button onClick={handleAddBrand} disabled={loading || !isFormValid()}>
          {loading ? <CircularProgress size={24} /> : "Lagre"}
        </Button>
      }
      cancelButton={
        <Button onClick={() => {
          resetFormAndErrors(); // Reset the form and errors when the cancel button is clicked
          onClose(); // Close the dialog
        }}>
          Cancel
        </Button>
      }
    >
      <TextField
        sx={{ marginTop: 1 }}
        label="Merke"
        value={brandName}
        error={Boolean(validationError)}
        onChange={(e) => {
          setBrandName(e.target.value);
          resetValidationErrors();
          resetServerError(); // Clear validation errors when input changes
        }}
      />
      {displayError || validationError ? (
        <ErrorHandling resource="brands" loading={loading} />
      ) : null}
    </BasicDialog>
  );
};

AddBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddBrandDialog;
