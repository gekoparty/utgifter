import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Stack } from "@mui/material";
import BasicDialog from "../../../components/commons/BasicDialog/BasicDialog";
import DeleteConfirmation from "../../../components/commons/Dialogs/DeleteConfirmation";
import DialogFormActions from "../../../components/commons/Dialogs/DialogFormActions";
import EntityNameField from "../../../components/commons/Forms/EntityNameField";
import useCategoryDialog from "../UseCategory/UseCategoryDialog";

const CategoryDialog = ({
  open,
  mode,
  categoryToEdit,
  onClose,
  onSuccess,
  onError,
}) => {
  const {
    category,
    setCategory,
    loading,
    handleSaveCategory,
    handleDeleteCategory,
    resetFormAndErrors,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
  } = useCategoryDialog(categoryToEdit);

  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";

  useEffect(() => {
    if (!open) return;
    setCategory(isEdit && categoryToEdit ? categoryToEdit : { name: "" });
  }, [open, isEdit, categoryToEdit, setCategory]);

  const handleClose = () => {
    resetFormAndErrors();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDelete) {
      const ok = await handleDeleteCategory(categoryToEdit);
      if (ok) {
        onSuccess(categoryToEdit);
        handleClose();
      } else {
        onError?.();
      }
      return;
    }

    if (!isFormValid()) return;

    const saved = await handleSaveCategory();
    if (saved) {
      onSuccess(saved);
      handleClose();
    } else {
      onError?.();
    }
  };

  const dialogTitle = isDelete
    ? "Bekreft sletting"
    : isEdit
      ? "Rediger kategori"
      : "Ny kategori";

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle={dialogTitle}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {isDelete ? (
            <DeleteConfirmation
              name={categoryToEdit?.name}
              impactText="Utgifter tilhørende denne kategorien vil også påvirkes."
            />
          ) : (
            <EntityNameField
              resource="categories"
              label="Kategori"
              value={category?.name}
              error={validationError?.name}
              disabled={loading}
              showFormError={Boolean(displayError)}
              onChange={(e) => {
                setCategory({ ...category, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
          )}

          <DialogFormActions
            loading={loading}
            isDelete={isDelete}
            disabled={!isDelete && !isFormValid()}
            onCancel={handleClose}
          />
        </Stack>
      </form>
    </BasicDialog>
  );
};

CategoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["ADD", "EDIT", "DELETE"]).isRequired,
  categoryToEdit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

export default CategoryDialog;
