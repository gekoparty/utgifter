import React from "react";
import { Button, TextField, CircularProgress, Box } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useLocationDialog from "../UseLocation/useLocationDialog";

const AddLocationDialog = ({ open, onClose, onAdd }) => {
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

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Call the handleSaveLocation function from the hook to save the new location
    if (isFormValid()) {
      const success = await handleSaveLocation(onClose);
      if (success) {
        onAdd({ name: locationName }); // Trigger the onAdd function to show the success snackbar with the location name
      }
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose(); // Close the dialog after resetting the form and errors
      }}
      dialogTitle="Nytt sted"
    >
      <form id="addLocationForm" onSubmit={handleSubmit}>
        <TextField
          size="small"
          sx={{ marginTop: 2 }}
          label="Sted"
          value={locationName}
          error={Boolean(validationError)}
          onChange={(e) => {
            setLocationName(e.target.value);
            resetValidationErrors();
            resetServerError(); // Clear validation errors when input changes
          }}
        />
        {displayError || validationError ? (
          <ErrorHandling
            resource="locations"
            field="locationName"
            loading={loading}
          />
        ) : null}

        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          
          <Button
            onClick={() => {
              resetFormAndErrors(); // Reset the form and errors when the cancel button is clicked
              onClose(); // Close the dialog
            }}
            sx={{ marginLeft: 2 }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
        </Box>
      </form>
    </BasicDialog>
  );
};

AddLocationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddLocationDialog;
