import React from "react";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import LocationForm from "../commons/LocationForm";

const EditLocationDialog = ({
  open,
  onClose,
  selectedLocation,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle="Edit Location">
      <LocationForm
        open={open}
        initialLocation={selectedLocation}
        formLabel="Location Name"
        submitLabel="Save"
        onSave={(location) => onUpdateSuccess(selectedLocation)}
        onCancel={onClose}
      />
    </BasicDialog>
  );
};

EditLocationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedLocation: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func,
};

export default EditLocationDialog;
