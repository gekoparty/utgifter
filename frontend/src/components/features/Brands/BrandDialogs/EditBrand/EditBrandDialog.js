import React, { useEffect } from "react";
import { Button, TextField, CircularProgress, Stack } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import useBrandDialog from "../../UseBrand/UseBrandDialog";

const EditBrandDialog = ({
  open,
  onClose,
  selectedBrand,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
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
  } = useBrandDialog(selectedBrand);

  useEffect(() => {
    if (selectedBrand) {
      setBrand(selectedBrand);
    }
  }, [selectedBrand, setBrand]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isFormValid()) {
      const success = await handleSaveBrand(onClose);

      if (success) onUpdateSuccess(brand);
      else onUpdateFailure();
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose();
      }}
      dialogTitle="Rediger merke"
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {/* Field + error */}
          <Stack spacing={0.5}>
            <TextField
              size="small"
              fullWidth
              label="Merkenavn"
              value={brand?.name || ""}
              error={Boolean(validationError?.name)}
              onChange={(e) => {
                setBrand({ ...brand, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />

            {(displayError || validationError) && (
              <ErrorHandling
                resource="brands"
                field="brandName"
                loading={loading}
              />
            )}
          </Stack>

          {/* Buttons */}
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

EditBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedBrand: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditBrandDialog;
