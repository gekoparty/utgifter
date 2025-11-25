import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Button, TextField, CircularProgress, Stack } from "@mui/material";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import useCategoryDialog from "../../UseCategory/UseCategoryDialog";

const CategoryForm = ({
  open,
  onClose,
  dialogTitle,
  initialCategory = null,
  onSave,
}) => {
  const {
    category,
    setCategory,
    loading,
    handleSaveCategory,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useCategoryDialog(initialCategory);

  useEffect(() => {
    if (open && initialCategory) {
      setCategory({ ...initialCategory });
    }
  }, [initialCategory, open, setCategory]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveCategory(onClose);
      if (success) {
        onSave(category);
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
      dialogTitle={dialogTitle}
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={1.5} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Kategori"
            value={category?.name || ""}
            error={Boolean(validationError?.name)}
            onChange={(e) => {
              setCategory({ ...category, name: e.target.value });
              resetValidationErrors();
              resetServerError();
            }}
          />

          {(displayError || validationError) && (
            <ErrorHandling resource="categories" field="name" loading={loading} />
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button
              type="submit"
              disabled={loading || !isFormValid()}
              sx={{ minWidth: 100 }}
            >
              {loading ? (
                <CircularProgress size={24} sx={{ color: "inherit" }} />
              ) : (
                "Lagre"
              )}
            </Button>

            <Button
              onClick={() => {
                resetFormAndErrors();
                onClose();
              }}
              sx={{
                minWidth: 100,
                color: (theme) => theme.palette.text.secondary,
              }}
            >
              Avbryt
            </Button>
          </Stack>
        </Stack>
      </form>
    </BasicDialog>
  );
};

CategoryForm.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  initialCategory: PropTypes.object,
};

export default CategoryForm;
