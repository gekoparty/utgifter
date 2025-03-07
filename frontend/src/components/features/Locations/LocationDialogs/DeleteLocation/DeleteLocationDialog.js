import React from "react";
import { Typography, Button } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import useLocationDialog from "../../UseLocation/useLocationDialog";

const DeleteLocationDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedLocation,
  onDeleteSuccess,
  onDeleteFailure,
}) => {
  const { handleDeleteLocation, loading } = useLocationDialog();

  const handleDelete = async () => {
    const success = await handleDeleteLocation(selectedLocation, onDeleteSuccess, onDeleteFailure);
    if (success) {
      onClose();
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      onConfirm={handleDelete} // <-- This now mirrors DeleteShopDialog
      cancelButton={
        <Button onClick={onClose} disabled={loading}>
          Avbryt
        </Button>
      }
      confirmButton={
        <Button onClick={handleDelete} disabled={loading}>
          Slett
        </Button>
      }
    >
      {selectedLocation && (
        <Typography component="p" marginTop={2}>
          Er du sikker på at du vil slette denne lokasjonen? Utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedLocation.name}"
          </Typography>{" "}
          vil også påvirkes.
        </Typography>
      )}
    </BasicDialog>
  );
};

DeleteLocationDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  selectedLocation: PropTypes.object.isRequired,
  onDeleteSuccess: PropTypes.func.isRequired,
  onDeleteFailure: PropTypes.func.isRequired,
};

export default DeleteLocationDialog;
