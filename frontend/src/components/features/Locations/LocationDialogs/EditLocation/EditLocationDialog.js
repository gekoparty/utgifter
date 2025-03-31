import React, { useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import useLocationDialog from "../../UseLocation/useLocationDialog";
import LocationForm from "../commons/LocationForm";

const EditLocationDialog = ({
  open,
  onClose,
  selectedLocation,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
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

  useEffect(() => {
    if (open) {
      setLocation({ ...selectedLocation });
    }
  }, [selectedLocation, open, setLocation]);

  const handleSubmit = async (event) => {
    event.preventDefault();

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
      <LocationForm
        formLabel="Location Name"
        submitLabel="Save"
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

EditLocationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedLocation: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditLocationDialog;
