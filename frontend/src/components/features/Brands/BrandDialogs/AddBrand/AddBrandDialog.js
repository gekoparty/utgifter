import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import useBrandDialog from "../../UseBrand/UseBrandDialog";

const AddBrandDialog = ({ open, onClose, onAdd }) => {
  const {
    brand,
    setBrand,
    loading,
    handleSaveBrand,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useBrandDialog();

  // Consolidate submission in a handleSubmit function
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Call the handleSaveLocation function to save the new location
    if (isFormValid()) {
      const success = await handleSaveBrand(onClose);
      if (success) {
        onAdd({ name: brand.name }); // Trigger onAdd for success notification
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
      dialogTitle="Nytt Merke"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <TextField
              size="small"
              sx={{ marginTop: 2 }}
              label="Merke"
              value={brand.name}
              error={Boolean(validationError)}
              onChange={(e) => {
                setBrand({ ...brand, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling
                resource="brands"
                field="name"
                loading={loading}
              />
            ) : null}
          </Grid>
          <Grid item container justifyContent="flex-end" spacing={2}>
            <Grid item>
              <Button
                onClick={() => {
                  resetFormAndErrors();
                  onClose();
                }}
              >
                Avbryt
              </Button>
            </Grid>
            <Grid item>
              <Button type="submit" disabled={loading || !isFormValid()}>
                {loading ? <CircularProgress size={24} /> : "Lagre"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </form>
    </BasicDialog>
  );
};

AddBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddBrandDialog;
