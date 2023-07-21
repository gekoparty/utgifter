import React from 'react'
import { Button, Typography } from '@mui/material';
import PropTypes from "prop-types";
import BasicDialog from '../../commons/BasicDialog/BasicDialog';
import useShopDialog from '../UseShop/useShopDialog';


const DeleteShopDialog = ({
    open,
    onClose,
    dialogTitle,
    selectedShop,
    onDeleteSuccess,
    onDeleteFailure
}) => {

    const {handleDeleteShop, loading} = useShopDialog()

    const handleDelete = async () =>  {
        const success = await handleDeleteShop(selectedShop, onDeleteSuccess, onDeleteFailure)
        if(success) {
            onClose()
        }
    }

  return (
    <BasicDialog 
        open={open}
        onClose={onClose}
        dialogTitle={dialogTitle}
        onConfirm={handleDeleteShop}
        cancelButton={
            <Button onClick={onClose} disabled={loading}>Avbryt</Button>
        }
        confirmButton={
            <Button onClick={handleDelete} disabled={loading}>Slett</Button> 
        }
        >
            {selectedShop && (
        <Typography component="p">
          Er du sikker på at du vil slette denne butikken, utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedShop.name}"
          </Typography>{" "}
          vil også påvirkes
        </Typography>
      )}
    

    </BasicDialog>

  )
}

DeleteShopDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    dialogTitle: PropTypes.string.isRequired,
    selectedShop: PropTypes.object.isRequired,
    onDeleteSuccess: PropTypes.func.isRequired,
    onDeleteFailure: PropTypes.func.isRequired,
  };

export default DeleteShopDialog
