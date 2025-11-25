import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Button, TextField, CircularProgress, Stack} from "@mui/material";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import useLocationDialog from "../../UseLocation/useLocationDialog";

const LocationForm = ({
  open,
  initialLocation = null,
  formLabel,
  submitLabel,
  onSave,
  onCancel,
}) => {
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
  } = useLocationDialog(initialLocation);

  // When the dialog opens and there's an initial location, ensure the form state is set.
  useEffect(() => {
    if (open && initialLocation) {
      setLocation({ ...initialLocation });
    }
  }, [open, initialLocation, setLocation]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveLocation(onCancel);
      if (success) {
        onSave(location);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={2}>
        <div>
          <TextField
            fullWidth
            size="small"
            sx={{ marginTop: 2 }}
            label={formLabel}
            value={location?.name || ""}
            error={Boolean(validationError?.name)}
            onChange={(e) => {
              setLocation({ ...location, name: e.target.value });
              resetValidationErrors();
              resetServerError();
            }}
          />
          {(displayError || validationError) && (
            <ErrorHandling resource="locations" field="name" loading={loading} />
          )}
        </div>
      </Stack>
      <Stack 
        direction="row" 
        spacing={2} 
        justifyContent="flex-end" 
        sx={{ mt: 2 }}
      >
        <Button type="submit" disabled={loading || !isFormValid()}>
          {loading ? <CircularProgress size={24} /> : submitLabel}
        </Button>
        <Button
          onClick={() => {
            resetFormAndErrors();
            onCancel();
          }}
        
        >
          Cancel
        </Button>
      </Stack>
    </form>
  );
};

LocationForm.propTypes = {
  open: PropTypes.bool.isRequired,
  initialLocation: PropTypes.object,
  formLabel: PropTypes.string.isRequired,
  submitLabel: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default LocationForm;