import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import BasicDialog from "../../../components/commons/BasicDialog/BasicDialog";
import DeleteConfirmation from "../../../components/commons/Dialogs/DeleteConfirmation";
import DialogFormActions from "../../../components/commons/Dialogs/DialogFormActions";
import EntityNameField from "../../../components/commons/Forms/EntityNameField";
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

  useEffect(() => {
    if (!open) return;
    setLocation(isEdit && locationToEdit ? locationToEdit : { name: "" });
  }, [open, isEdit, locationToEdit, setLocation]);

  const handleClose = () => {
    resetFormAndErrors();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDelete) {
      const ok = await handleDeleteLocation(locationToEdit);
      if (ok) {
        onSuccess(locationToEdit);
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

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle={dialogTitle}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {isDelete ? (
            <DeleteConfirmation
              name={locationToEdit?.name}
              impactText="Utgifter tilhørende dette stedet vil også påvirkes."
            />
          ) : (
            <EntityNameField
              resource="locations"
              label="Sted"
              value={location?.name}
              error={validationError?.name}
              disabled={loading}
              showFormError={Boolean(displayError)}
              onChange={(e) => {
                setLocation({ ...location, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
          )}

          <DialogFormActions
            loading={loading}
            isDelete={isDelete}
            disabled={!isDelete && !isFormValid()}
            onCancel={handleClose}
          />
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
