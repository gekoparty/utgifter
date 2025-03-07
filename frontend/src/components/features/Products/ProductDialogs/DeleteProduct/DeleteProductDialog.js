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
          Cancel
        </Button>
      }
      // Confirm button to trigger the delete action
      confirmButton={
        <Button onClick={handleDelete} disabled={loading}>
          Delete
        </Button>
      }
    >
      {/* Display a confirmation message with the product name */}
      {selectedProduct && (
        <Typography component="p" marginTop={2}>
          Are you sure you want to delete this product? Deleting{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedProduct.name}"
          </Typography>{" "}
          may also affect associated expenses.
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
