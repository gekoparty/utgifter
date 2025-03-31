import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";

const LocationForm = ({
  formLabel,
  submitLabel,
  location,
  setLocation,
  validationError,
  displayError,
  loading,
  isFormValid,
  resetValidationErrors,
  resetServerError,
  onSubmit,
  onCancel,
}) => {
  return (
    <form onSubmit={onSubmit}>
      <Grid container direction="column" spacing={2}>
        <Grid item>
          <TextField
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
        </Grid>
      </Grid>

      <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
        <Button type="submit" disabled={loading || !isFormValid()}>
          {loading ? <CircularProgress size={24} /> : submitLabel}
        </Button>
        <Button onClick={onCancel} sx={{ ml: 2 }}>
          Cancel
        </Button>
      </Grid>
    </form>
  );
};

LocationForm.propTypes = {
  formLabel: PropTypes.string.isRequired,
  submitLabel: PropTypes.string.isRequired,
  location: PropTypes.object.isRequired,
  setLocation: PropTypes.func.isRequired,
  validationError: PropTypes.object,
  displayError: PropTypes.bool,
  loading: PropTypes.bool.isRequired,
  isFormValid: PropTypes.func.isRequired,
  resetValidationErrors: PropTypes.func.isRequired,
  resetServerError: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default LocationForm;
