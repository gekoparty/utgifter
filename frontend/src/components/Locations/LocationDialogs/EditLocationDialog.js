import React from "react";
import { Button, TextField, CircularProgress, Box } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useLocationDialog from "../UseLocation/useLocationDialog";

const EditLocationDialog = ({
  open,
  onClose,
  selectedLocation,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
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
  } = useLocationDialog(selectedLocation);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    // Call the handleSaveLocation function from the hook to save the updated location
    if (isFormValid()) {
      const success = await handleSaveLocation(onClose);
      if (success) {
        onUpdateSuccess(selectedLocation);
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
      dialogTitle="Edit Location"
    >
      <form onSubmit={handleSubmit}>
          <TextField
            sx={{ marginTop: 2 }}
            size="small"
            label="Location Name"
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
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
            >
              {loading ? <CircularProgress size={24} /> : "Save"}
            </Button>
            <Button
              onClick={() => {
                resetFormAndErrors(); // Reset the form and errors when the cancel button is clicked
                onClose(); // Close the dialog
              }}
            >
              Cancel
            </Button>
          </Box>
      </form>
    </BasicDialog>
  );
};

EditLocationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedLocation: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditLocationDialog;