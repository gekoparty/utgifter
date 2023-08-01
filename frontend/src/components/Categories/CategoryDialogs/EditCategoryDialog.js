import React from "react";
import { Button, TextField, CircularProgress, Box } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import UseCategoryDialog from "../UseCategory/UseCategoryDialog";

const EditCategoryDialog = ({
  open,
  onClose,
  selectedCategory,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
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
  } = UseCategoryDialog(selectedCategory);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    // Call the handleSaveLocation function from the hook to save the updated location
    if (isFormValid()) {
      const success = await handleSaveCategory(onClose);
      if (success) {
        onUpdateSuccess(selectedCategory);
      } else {
        onUpdateFailure();
      }
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose();
      }}
      dialogTitle="Edit Category"
    >
      <form onSubmit={handleSubmit}>
          <TextField
            sx={{ marginTop: 2 }}
            size="small"
            label="Category Name"
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
              type="submit"
              onClick={handleSubmit}
              disabled={loading || !isFormValid()}
            >
              {loading ? <CircularProgress size={24} /> : "Save"}
            </Button>
            <Button
              onClick={() => {
                resetFormAndErrors(); // Reset the form and errors when the cancel button is clicked
                onClose(); // Close the dialog
              }}
            >
              Cancel
            </Button>
          </Box>
      </form>
    </BasicDialog>
  );
};

EditCategoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedCategory: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditCategoryDialog;