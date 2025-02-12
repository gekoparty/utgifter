import React from "react";
import { Button, Typography } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import useBrandDialog from "../UseBrand/UseBrandDialog";

const DeleteBrandDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedBrand,
  onDeleteSuccess,
  onDeleteFailure,
}) => {
  // Use the brand hook to get the deletion handler and loading state.
  const { handleDeleteBrand, loading } = useBrandDialog();

  // When the Delete button is clicked, call handleDeleteBrand.
  const handleDelete = async () => {
    const success = await handleDeleteBrand(
      selectedBrand,
      onDeleteSuccess,
      onDeleteFailure
    );
    if (success) {
      onClose();
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      // Optionally pass onConfirm if BasicDialog uses it internally.
      onConfirm={handleDeleteBrand}
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
      {selectedBrand && (
        <Typography component="p" marginTop={2}>
          Er du sikker på at du vil slette dette merket, utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedBrand.name}"
          </Typography>{" "}
          vil også påvirkes.
        </Typography>
      )}
    </BasicDialog>
  );
};

DeleteBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  selectedBrand: PropTypes.object.isRequired,
  onDeleteSuccess: PropTypes.func.isRequired,
  onDeleteFailure: PropTypes.func.isRequired,
};

export default DeleteBrandDialog;
