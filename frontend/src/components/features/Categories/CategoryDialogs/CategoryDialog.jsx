import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Button, TextField, CircularProgress, Stack, Typography } from "@mui/material";
import BasicDialog from "../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../commons/ErrorHandling/ErrorHandling";
import useCategoryDialog from "../UseCategory/UseCategoryDialog";

const CategoryDialog = ({ open, mode, categoryToEdit, onClose, onSuccess, onError }) => {
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

  // Initialize form when opened (same UX as BrandDialog)
  useEffect(() => {
    if (!open) return;

    setCategory(isEdit && categoryToEdit ? categoryToEdit : { name: "" });
  }, [open, mode, categoryToEdit]); // keep it simple like BrandDialog

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

  const dialogTitle = isDelete ? "Bekreft sletting" : isEdit ? "Rediger kategori" : "Ny kategori";
  const confirmButtonLabel = isDelete ? "Slett" : "Lagre";
  const confirmButtonColor = isDelete ? "error" : "primary";

  const renderBody = () =>
    isDelete ? (
      <Typography>
        Er du sikker på at du vil slette <strong>"{categoryToEdit?.name}"</strong>? Utgifter
        tilhørende denne kategorien vil også påvirkes.
      </Typography>
    ) : (
      <>
        <TextField
          autoFocus
          fullWidth
          size="small"
          label="Kategori"
          value={category?.name || ""}
          error={Boolean(validationError?.name)}
          disabled={loading}
          onChange={(e) => {
            setCategory({ ...category, name: e.target.value });
            resetValidationErrors();
            resetServerError();
          }}
        />

        {(displayError || validationError) && (
          <ErrorHandling resource="categories" field="name" loading={loading} />
        )}
      </>
    );

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle={dialogTitle}>
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {renderBody()}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={handleClose} disabled={loading}>
              Avbryt
            </Button>

            <Button
              type="submit"
              variant="contained"
              color={confirmButtonColor}
              disabled={loading || (!isDelete && !isFormValid())}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : confirmButtonLabel}
            </Button>
          </Stack>
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
