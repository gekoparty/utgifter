import React from "react";
import { Button, Typography } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import useProductDialog from "../../UseProduct/useProductDialog";

const DeleteProductDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedProduct,
  onDeleteSuccess,
  onDeleteFailure,
}) => {
  // Extract the delete handler and loading state from the custom hook
  const { handleDeleteProduct, loading } = useProductDialog();

  // Function to handle the delete action
  const handleDelete = async () => {
    const success = await handleDeleteProduct(
      selectedProduct,
      onDeleteSuccess,
      onDeleteFailure
    );
    if (success) {
      onClose(); // Close the dialog if deletion is successful
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      // Cancel button to close the dialog
      cancelButton={
        <Button onClick={onClose} disabled={loading}>
          Avbryt
        </Button>
      }
      // Confirm button to trigger the delete action
      confirmButton={
        <Button onClick={handleDelete} disabled={loading}>
          Slett
        </Button>
      }
    >
      {/* Display a confirmation message with the product name */}
      {selectedProduct && (
        <Typography component="p" marginTop={2}>
          Er du sikker på at du vil slette dette produktet? Sletting av{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedProduct.name}"
          </Typography>{" "}
          kan også påvirke tilknyttede utgifter.
        </Typography>
      )}
    </BasicDialog>
  );
};

DeleteProductDialog.propTypes = {
  open: PropTypes.bool.isRequired, // Whether the dialog is open
  onClose: PropTypes.func.isRequired, // Function to close the dialog
  dialogTitle: PropTypes.string.isRequired, // Title of the dialog
  selectedProduct: PropTypes.object.isRequired, // The product to delete
  onDeleteSuccess: PropTypes.func.isRequired, // Callback on successful deletion
  onDeleteFailure: PropTypes.func.isRequired, // Callback on failed deletion
};

export default DeleteProductDialog;
