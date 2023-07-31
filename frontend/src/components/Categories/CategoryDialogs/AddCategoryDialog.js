import React from "react";
import { Button, TextField, CircularProgress, Box } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import UseCategoryDialog from "../UseCategory/UseCategoryDialog";

const AddCategoryDialog = ({ open, onClose, onAdd }) => {
  const {
    categoryName,
    setCategoryName,
    loading,
    handleSaveCategory,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = UseCategoryDialog();

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Call the handleSaveCategory function from the hook to save the new location
    if (isFormValid()) {
      const success = await handleSaveCategory(onClose);
      if (success) {
        onAdd({ name: categoryName }); // Trigger the onAdd function to show the success snackbar with the location name
      }
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose(); // Close the dialog after resetting the form and errors
      }}
      dialogTitle="Ny Kategori"
    >
      <form id="addCategoryForm" onSubmit={handleSubmit}>
        <TextField
          size="small"
          sx={{ marginTop: 2 }}
          label="Sted"
          value={categoryName}
          error={Boolean(validationError)}
          onChange={(e) => {
            setCategoryName(e.target.value);
            resetValidationErrors();
            resetServerError(); // Clear validation errors when input changes
          }}
        />
        {displayError || validationError ? (
          <ErrorHandling
            resource="categories"
            field="categoryName"
            loading={loading}
          />
        ) : null}

        <Box sx={{ display: "flex", justifyContent: "flex-end", marginTop: 2 }}>
          
          <Button
            onClick={() => {
              resetFormAndErrors(); // Reset the form and errors when the cancel button is clicked
              onClose(); // Close the dialog
            }}
            sx={{ marginLeft: 2 }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
        </Box>
      </form>
    </BasicDialog>
  );
};

AddCategoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddCategoryDialog;