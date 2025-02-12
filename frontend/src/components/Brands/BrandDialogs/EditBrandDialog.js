import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useBrandDialog from "../UseBrand/UseBrandDialog";

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
    resetFormAndErrors,
  } = useBrandDialog(selectedBrand);

  // Consolidate form submission in a handleSubmit function.
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveBrand(onClose);
      if (success) {
        onUpdateSuccess(selectedBrand);
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
      dialogTitle="Rediger Merke"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={2}>
          {/* Input Field for Brand Name */}
          <Grid item>
            <TextField
              size="small"
              fullWidth
              sx={{ marginTop: 2 }}
              label="Merkenavn"
              value={brandName}
              error={Boolean(validationError)}
              onChange={(e) => {
                setBrandName(e.target.value);
                resetValidationErrors();
                resetServerError();
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling
                resource="brands"
                field="brandName"
                loading={loading}
              />
            ) : null}
          </Grid>

          {/* Action Buttons */}
          <Grid item container justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
            <Grid item>
              <Button
                onClick={() => {
                  resetFormAndErrors();
                  onClose();
                }}
              >
                Cancel
              </Button>
            </Grid>
            <Grid item>
              <Button type="submit" disabled={loading || !isFormValid()}>
                {loading ? <CircularProgress size={24} /> : "Save"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </form>
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

