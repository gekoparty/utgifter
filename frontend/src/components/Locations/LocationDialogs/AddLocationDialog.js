import React from "react";
import { Button, TextField, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useLocationDialog from "../UseLocation/useLocationDialog";

const AddLocationDialog = ({ open,onClose, onAdd }) => {
  const {
    locationName,
    setLocationName,
    loading,
    handleSaveLocation,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors, 
  } = useLocationDialog();


  const handleAddLocation = async () => {
    // Call the handleSaveBrand function from the hook to save the new brand
    const success = await handleSaveLocation(onClose);
    if (success) {
      onAdd({ name: locationName }); // Trigger the onAdd function to show the success snackbar with the brand name
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
        <Button onClick={handleAddLocation} disabled={loading || !isFormValid()}>
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
      size="small"
        sx={{ marginTop: 2 }}
        label="Merke"
        value={locationName}
        error={Boolean(validationError)}
        onChange={(e) => {
          setLocationName(e.target.value);
          resetValidationErrors();
          resetServerError(); // Clear validation errors when input changes
        }}
      />
      {displayError || validationError ? (
        <ErrorHandling resource="locations" field="locationName" loading={loading} />
      ) : null}
    </BasicDialog>
  );
};

AddLocationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddLocationDialog;
