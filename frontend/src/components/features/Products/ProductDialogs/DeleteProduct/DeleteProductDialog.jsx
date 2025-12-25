import React from "react";
import { Button, Typography } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import useProductDialog from "../../UseProduct/useProductDialog";
import { styled } from "@mui/material/styles";

// Create styled component with proper prop filtering
const StyledBasicDialog = styled(BasicDialog, {
  shouldForwardProp: (prop) => !['ownerState'].includes(prop),
})({});

const DeleteProductDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedProduct,
  onDeleteSuccess,
  onDeleteFailure,
}) => {
  const { handleDeleteProduct, loading } = useProductDialog();

  const handleDelete = async () => {
    const success = await handleDeleteProduct(
      selectedProduct,
      onDeleteSuccess,
      onDeleteFailure
    );
    if (success) onClose();
  };

  return (
    <StyledBasicDialog
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
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
      {selectedProduct && (
        <Typography component="p" marginTop={2}>
          Er du sikker på at du vil slette dette produktet? Sletting av{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedProduct.name}"
          </Typography>{" "}
          kan også påvirke tilknyttede utgifter.
        </Typography>
      )}
    </StyledBasicDialog>
  );
};

DeleteProductDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  selectedProduct: PropTypes.object.isRequired,
  onDeleteSuccess: PropTypes.func.isRequired,
  onDeleteFailure: PropTypes.func.isRequired,
};

export default DeleteProductDialog;
