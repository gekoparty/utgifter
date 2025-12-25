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

  /**
   * R19 OPT: The handleDelete function is clean and simple. 
   * It relies only on stable props/hooks. In React 19's optimized compiler (React Forget),
   * defining it directly as an arrow function or a standard function 
   * is sufficient, and manual wrapping with useCallback is unnecessary.
   */
  const handleDelete = async () => {
    // Expense _id is safe to access directly.
    const expenseId = selectedExpense._id;

    // Execute deletion logic from the hook
    const success = await handleDeleteExpense(expenseId);
    
    if (success) {
      // Call success callback and close the dialog
      onDeleteSuccess(selectedExpense);
      onClose();
    } else {
      // Call failure callback
      onDeleteFailure(selectedExpense);
    }
    // Note: The logic is already sequential and robust.
  };

  return (
    <BasicDialog 
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      // Passing handleDelete to the confirmButton prop for simplicity and clarity.
      cancelButton={
        <Button onClick={onClose} disabled={loading}>Avbryt</Button>
      }
      confirmButton={
        // The event handler is the simple, non-memoized function
        <Button onClick={handleDelete} disabled={loading} color="error" variant="contained">Slett</Button>
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