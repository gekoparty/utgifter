import React from "react";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import useLocationDialog from "../../UseLocation/useLocationDialog";
import LocationForm from "../commons/LocationForm";

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isFormValid()) {
      const success = await handleSaveLocation(onClose);
      if (success) {
        onAdd({ name: location.name });
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
      dialogTitle="Nytt Sted"
    >
      <LocationForm
        formLabel="Sted"
        submitLabel="Lagre"
        location={location}
        setLocation={setLocation}
        validationError={validationError}
        displayError={displayError}
        loading={loading}
        isFormValid={isFormValid}
        resetValidationErrors={resetValidationErrors}
        resetServerError={resetServerError}
        onSubmit={handleSubmit}
        onCancel={() => {
          resetFormAndErrors();
          onClose();
        }}
      />
    </BasicDialog>
  );
};

AddLocationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddLocationDialog;

