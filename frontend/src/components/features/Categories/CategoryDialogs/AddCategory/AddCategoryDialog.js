import React from "react";
import { Button, TextField, CircularProgress, Grid} from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import useCategoryDialog from "../../UseCategory/UseCategoryDialog"


const AddCategoryDialog = ({ open, onClose, onAdd }) => {
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
  } = useCategoryDialog();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveCategory(onClose);
      if (success) {
        onAdd({ name: category.name });
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
      dialogTitle="Ny Kategori"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <TextField
              fullWidth
              sx={{ marginTop: 2 }}
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
              <ErrorHandling
                resource="categories"
                field="name"
                loading={loading}
              />
            )}
          </Grid>
        </Grid>
        
        {/* Updated Button Section - Matching AddShopDialog */}
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            type="submit" 
            disabled={loading || !isFormValid()}
            
          >
            {loading ? (
              <CircularProgress size={24} sx={{ color: 'inherit' }} />
            ) : "Lagre"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ 
              ml: 2,
              minWidth: 100,
              color: theme => theme.palette.text.secondary
            }}
          >
            Avbryt
          </Button>
        </Grid>
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