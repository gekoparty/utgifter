import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Button, TextField, CircularProgress, Stack, Typography } from "@mui/material";
import BasicDialog from "../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../commons/ErrorHandling/ErrorHandling";
import useLocationDialog from "../UseLocation/useLocationDialog";

const LocationDialog = ({
  open,
  mode,
  locationToEdit,
  onClose,
  onSuccess,
  onError,
}) => {
  const {
    location,
    setLocation,
    loading,
    handleSaveLocation,
    handleDeleteLocation,
    resetFormAndErrors,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
  } = useLocationDialog(locationToEdit);

  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";

  // Same UX as BrandDialog: initialize when opened
  useEffect(() => {
    if (!open) return;

    setLocation(
      isEdit && locationToEdit
        ? locationToEdit
        : { name: "" } // ADD mode or fallback
    );
  }, [open, mode, locationToEdit]);

  const handleClose = () => {
    resetFormAndErrors();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDelete) {
      const ok = await handleDeleteLocation(locationToEdit);
      if (ok) {
        onSuccess(locationToEdit); // keep same pattern: caller decides message
        handleClose();
      } else {
        onError?.();
      }
      return;
    }

    if (!isFormValid()) return;

    const saved = await handleSaveLocation();
    if (saved) {
      onSuccess(saved);
      handleClose();
    } else {
      onError?.();
    }
  };

  const dialogTitle = isDelete
    ? "Bekreft sletting"
    : isEdit
    ? "Rediger sted"
    : "Nytt sted";

  const confirmButtonLabel = isDelete ? "Slett" : "Lagre";
  const confirmButtonColor = isDelete ? "error" : "primary";

  const renderBody = () =>
    isDelete ? (
      <Typography>
        Er du sikker på at du vil slette{" "}
        <strong>"{locationToEdit?.name}"</strong>? Utgifter tilhørende dette stedet vil
        også påvirkes.
      </Typography>
    ) : (
      <>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Sted"
          value={location?.name || ""}
          error={Boolean(validationError?.name)}
          disabled={loading}
          onChange={(e) => {
            setLocation({ ...location, name: e.target.value });
            resetValidationErrors();
            resetServerError();
          }}
        />
        {(displayError || validationError) && (
          <ErrorHandling resource="locations" field="name" loading={loading} />
        )}
      </>
    );

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle={dialogTitle}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {renderBody()}
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={handleClose} disabled={loading}>
              Avbryt
            </Button>
            <Button
              type="submit"
              variant="contained"
              color={confirmButtonColor}
              disabled={loading || (!isDelete && !isFormValid())}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                confirmButtonLabel
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </BasicDialog>
  );
};

LocationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["ADD", "EDIT", "DELETE"]).isRequired,
  locationToEdit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

export default LocationDialog;
