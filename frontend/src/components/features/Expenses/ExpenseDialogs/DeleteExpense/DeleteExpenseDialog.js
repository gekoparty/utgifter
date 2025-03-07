import React from 'react';
import { Button, Typography } from '@mui/material';
import PropTypes from "prop-types";
import BasicDialog from '../../../../commons/BasicDialog/BasicDialog';
import useExpenseForm from "../../UseExpense/useExpenseForm"

const DeleteExpenseDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedExpense,
  onDeleteSuccess,
  onDeleteFailure,
}) => {
  // Get deletion handler and loading state from the expense hook.
  const { handleDeleteExpense, loading } = useExpenseForm();

  // Define a delete handler that calls the deletion function from the hook.
  const handleDelete = async () => {
    // Pass the expense _id, not the full object.
    const expenseId = selectedExpense._id;
    const success = await handleDeleteExpense(expenseId);
    if (success) {
      onDeleteSuccess(selectedExpense);
      onClose();
    } else {
      onDeleteFailure(selectedExpense);
    }
  };
  return (
    <BasicDialog 
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      // (Optional) onConfirm prop can be passed if BasicDialog uses it internally.
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
          Er du sikker på at du vil slette denne utgiften? Utgifter knyttet til{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedExpense.productName?.name || selectedExpense.productName}"
          </Typography>{" "}
          vil også bli påvirket.
        </Typography>
      )}
    </BasicDialog>
  );
};

DeleteExpenseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  selectedExpense: PropTypes.object.isRequired,
  onDeleteSuccess: PropTypes.func.isRequired,
  onDeleteFailure: PropTypes.func.isRequired,
};

export default DeleteExpenseDialog;


  