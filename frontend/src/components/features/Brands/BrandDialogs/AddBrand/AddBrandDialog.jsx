import React from "react";
import { Button, TextField, CircularProgress, Stack } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import useBrandDialog from "../../UseBrand/UseBrandDialog";

const AddBrandDialog = ({ open, onClose, onAdd }) => {
  const {
    brand,
    setBrand,
    loading,
    handleSaveBrand,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useBrandDialog();

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isFormValid()) {
      const success = await handleSaveBrand(onClose);
      if (success) {
        onAdd({ name: brand.name });
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
      dialogTitle="Nytt Merke"
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Input + error */}
          <Stack spacing={0.5}>
            <TextField
              size="small"
              label="Merke"
              value={brand.name}
              error={Boolean(validationError?.name)}
              onChange={(e) => {
                setBrand({ ...brand, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
            {(displayError || validationError) && (
              <ErrorHandling resource="brands" field="name" loading={loading} />
            )}
          </Stack>

          {/* Buttons (Styled same as EditBrandDialog) */}
          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button
              onClick={() => {
                resetFormAndErrors();
                onClose();
              }}
            >
              Avbryt
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={loading || !isFormValid()}
            >
              {loading ? <CircularProgress size={24} /> : "Lagre"}
            </Button>
          </Stack>
        </Stack>
      </form>
    </BasicDialog>
  );
};

AddBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddBrandDialog;
