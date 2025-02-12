import React, { useEffect, useMemo } from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import useCategoryDialog from "../UseCategory/UseCategoryDialog"

const EditCategoryDialog = ({ 
  open, 
  onClose, 
  selectedCategory, 
  onUpdateSuccess, 
  onUpdateFailure 
}) => {
  const memoizedSelectedCategory = useMemo(() => selectedCategory, [selectedCategory]);

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
  } = useCategoryDialog(memoizedSelectedCategory);

  // Synchronize state with selected category when dialog opens
  useEffect(() => {
    if (open) {
      setCategory({ ...selectedCategory });
    }
  }, [selectedCategory, open, setCategory]);

  const handleSubmit = async (event) => {
    event.preventDefault();
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
      dialogTitle="Rediger Kategori"
      sx={{
        '& .MuiDialog-paper': {
          borderTop: '4px solid',
          borderColor: 'primary.main',
        }
      }}
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <TextField
              fullWidth
              size="small"
              label="Kategorinavn"
              value={category?.name || ""}
              error={Boolean(validationError?.name)}
              onChange={(e) => {
                setCategory({ ...category, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
            {(displayError || validationError) && (
              <ErrorHandling
                resource="categories"
                field="name"
                loading={loading}
              />
            )}
          </Grid>
        </Grid>
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            type="submit"
            disabled={loading || !isFormValid()}
            sx={{ minWidth: 100 }}
          >
            {loading ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ ml: 2, minWidth: 100 }}
          >
            Avbryt
          </Button>
        </Grid>
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