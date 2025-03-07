import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import useLocationDialog from "../../UseLocation/useLocationDialog";

const AddLocationDialog = ({ open, onClose, onAdd }) => {
  const {
    location,
    setLocation,
    loading,
    handleSaveLocation,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useLocationDialog();

  // Consolidate submission in a handleSubmit function
  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission

    // Call the handleSaveLocation function to save the new location
    if (isFormValid()) {
      const success = await handleSaveLocation(onClose);
      if (success) {
        onAdd({ name: location.name }); // Trigger onAdd for success notification
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
      dialogTitle="Nytt Sted"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <TextField
              size="small"
              sx={{ marginTop: 2 }}
              label="Sted"
              value={location?.name || ""} // Ensuring safe handling
              error={Boolean(validationError?.name)}
              onChange={(e) => {
                setLocation({ ...location, name: e.target.value });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="locations" field="name" loading={loading} />
            ) : null}
          </Grid>
        </Grid>

        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors(); // Reset form and errors on cancel
              onClose();
            }}
            sx={{ ml: 2 }}
          >
            Avbryt
          </Button>
        </Grid>
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

