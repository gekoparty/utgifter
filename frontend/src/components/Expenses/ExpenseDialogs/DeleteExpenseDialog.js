import React from 'react'
import { Button, Typography } from '@mui/material';
import PropTypes from "prop-types";
import BasicDialog from '../../commons/BasicDialog/BasicDialog';
import useExpenseForm from "../useExpenseForm"


const DeleteExpenseDialog = ({
    open,
    onClose,
    dialogTitle,
    selectedExpense,
    onDeleteSuccess,
    onDeleteFailure
}) => {

    const {handleDeleteExpense, loading} = useExpenseForm()

    const handleDelete = async () =>  {
        const success = await handleDeleteExpense(selectedExpense, onDeleteSuccess, onDeleteFailure)
        if(success) {
            onClose()
        }
    }

  return (
    <BasicDialog 
        open={open}
        onClose={onClose}
        dialogTitle={dialogTitle}
        onConfirm={handleDeleteExpense}
        cancelButton={
            <Button onClick={onClose} disabled={loading}>Avbryt</Button>
        }
        confirmButton={
            <Button onClick={handleDelete} disabled={loading}>Slett</Button> 
        }
        >
            {selectedExpense && (
        <Typography component="p" marginTop={2}>
          Er du sikker på at du vil slette denne utgiften, utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedExpense.productName}"
          </Typography>{" "}
          vil også påvirkes
        </Typography>
      )}
    

    </BasicDialog>

  )
}

DeleteExpenseDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    dialogTitle: PropTypes.string.isRequired,
    selectedProduct: PropTypes.object.isRequired,
    onDeleteSuccess: PropTypes.func.isRequired,
    onDeleteFailure: PropTypes.func.isRequired,
  };

export default DeleteExpenseDialog