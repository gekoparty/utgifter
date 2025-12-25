import React from "react";
import PropTypes from "prop-types";
import CategoryForm from "../commons/CategoryForm";

const AddCategoryDialog = ({ open, onClose, onAdd }) => {
  return (
    <CategoryForm
      open={open}
      onClose={onClose}
      dialogTitle="Ny Kategori"
      // onSave receives the category object and we pass only the needed data
      onSave={(category) => onAdd({ name: category.name })}
    />
  );
};

AddCategoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddCategoryDialog;