import React from 'react'
import { Button, Typography } from '@mui/material';
import PropTypes from "prop-types";
import BasicDialog from '../../commons/BasicDialog/BasicDialog';
import useProductDialog from '../UseProducts/useProductDialog';


const DeleteProductDialog = ({
    open,
    onClose,
    dialogTitle,
    selectedProduct,
    onDeleteSuccess,
    onDeleteFailure
}) => {

    const {handleDeleteProduct, loading} = useProductDialog()

    const handleDelete = async () =>  {
        const success = await handleDeleteProduct(selectedProduct, onDeleteSuccess, onDeleteFailure)
        if(success) {
            onClose()
        }
    }

  return (
    <BasicDialog 
        open={open}
        onClose={onClose}
        dialogTitle={dialogTitle}
        onConfirm={handleDeleteProduct}
        cancelButton={
            <Button onClick={onClose} disabled={loading}>Avbryt</Button>
        }
        confirmButton={
            <Button onClick={handleDelete} disabled={loading}>Slett</Button> 
        }
        >
            {selectedProduct && (
        <Typography component="p" marginTop={2}>
          Er du sikker på at du vil slette denne butikken, utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedProduct.name}"
          </Typography>{" "}
          vil også påvirkes
        </Typography>
      )}
    

    </BasicDialog>

  )
}

DeleteProductDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    dialogTitle: PropTypes.string.isRequired,
    selectedProduct: PropTypes.object.isRequired,
    onDeleteSuccess: PropTypes.func.isRequired,
    onDeleteFailure: PropTypes.func.isRequired,
  };

export default DeleteProductDialog
