import React from "react";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import LocationForm from "../commons/LocationForm";

const AddLocationDialog = ({ open, onClose, onAdd }) => {
  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle="Nytt Sted">
      <LocationForm
        open={open}
        formLabel="Sted"
        submitLabel="Lagre"
        onSave={(location) => onAdd({ name: location.name })}
        onCancel={onClose}
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

