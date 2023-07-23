import React from "react";
import { Button, TextField, CircularProgress } from "@mui/material";
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

  const handleUpdateLocation = async () => {
    const success = await handleSaveLocation(onClose);
    if (success) {
      onUpdateSuccess(selectedLocation); // Trigger the onUpdateSuccess function to show the success snackbar with the brand data
    } else {
      onUpdateFailure(); // Trigger the onUpdateFailure function to show the error snackbar
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose(); // Close the dialog after resetting the form and errors
      }}
      dialogTitle="Edit Location"
      confirmButton={
        <Button
          onClick={handleUpdateLocation}
          disabled={loading || !isFormValid()}
        >
          {loading ? <CircularProgress size={24} /> : "Save"}
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
        <ErrorHandling resource="locations" field="locationName" loading={loading} />
      ) : null}
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