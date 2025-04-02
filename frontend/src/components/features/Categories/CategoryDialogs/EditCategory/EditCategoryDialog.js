import React from "react";
import PropTypes from "prop-types";
import CategoryForm from "../commons/CategoryForm";

const EditCategoryDialog = ({
  open,
  onClose,
  selectedCategory,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  return (
    <CategoryForm
      open={open}
      onClose={onClose}
      dialogTitle="Rediger Kategori"
      initialCategory={selectedCategory}
      onSave={(category) => {
        // If needed, you can differentiate success/failure handling here.
        // For example, if handleSaveCategory returns false on failure,
        // you might call onUpdateFailure; otherwise, call onUpdateSuccess.
        // Here we assume that onSave is only called on success.
        onUpdateSuccess(selectedCategory);
      }}
    />
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