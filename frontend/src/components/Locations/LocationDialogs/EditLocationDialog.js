import React, { useEffect, useMemo } from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useLocationDialog from "../UseLocation/useLocationDialog";

const EditLocationDialog = ({ open, onClose, selectedLocation, onUpdateSuccess, onUpdateFailure }) => {
  const memoizedSelectedLocation = useMemo(() => selectedLocation, [selectedLocation]);

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
  } = useLocationDialog(memoizedSelectedLocation);

  // Synchronize state with selected location when dialog opens
  useEffect(() => {
    if (open) {
      setLocation({ ...selectedLocation });
    }
  }, [selectedLocation, open, setLocation]);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent default form submission behavior

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
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <TextField
              sx={{ marginTop: 2 }}
              size="small"
              label="Location Name"
              value={location?.name || ""}
              error={Boolean(validationError?.name)}
              onChange={(e) => {
                setLocation({ ...location, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="locations" field="name" loading={loading} />
            ) : null}
          </Grid>
        </Grid>
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ ml: 2 }}
          >
            Cancel
          </Button>
        </Grid>
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
