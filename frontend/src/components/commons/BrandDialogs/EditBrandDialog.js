import React from "react";
import { Button, TextField, CircularProgress } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../BasicDialog/BasicDialog";
import ErrorHandling from "../ErrorHandling/ErrorHandling";
import useBrandDialog from "./UseBrand/UseBrandDialog";

const EditBrandDialog = ({
  open,
  onClose,
  selectedBrand,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
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
    resetFormAndErrors
  } = useBrandDialog(selectedBrand);

  // Note: You don't need to define the resetValidationErrors and resetServerError functions separately
  // They are already available through the useBrandDialog hook.

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose(); // Close the dialog after resetting the form and errors
      }}
      dialogTitle="Edit Brand"
      confirmButton={
        <Button onClick={() => handleSaveBrand(onClose)} disabled={loading || !isFormValid()}>
          {loading ? <CircularProgress size={24} /> : "Save"}
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
        label="Brand Name"
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

EditBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedBrand: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditBrandDialog;
