import React, { useEffect } from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useBrandDialog from "../UseBrand/UseBrandDialog";

const EditBrandDialog = ({
  open,
  onClose,
  selectedBrand,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  const {
    brand,  // Changed from brandName
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

  // Reset form when selected brand changes
  useEffect(() => {
    if (selectedBrand) {
      setBrand(selectedBrand);
    }
  }, [selectedBrand, setBrand]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveBrand(onClose);
      if (success) {
        onUpdateSuccess(brand);
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
      dialogTitle="Rediger merke"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={2}>
          <Grid item>
            <TextField
              size="small"
              fullWidth
              sx={{ marginTop: 2 }}
              label="Merkenavn"
              value={brand?.name || ""} 
              error={Boolean(validationError)}
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
          </Grid>

          <Grid item container justifyContent="flex-end" spacing={2} sx={{ mt: 2 }}>
            <Grid item>
              <Button
                onClick={() => {
                  resetFormAndErrors();
                  onClose();
                }}
              >
                Avbryt
              </Button>
            </Grid>
            <Grid item>
              <Button 
                type="submit" 
                variant="contained"
                disabled={loading || !isFormValid()}
              >
                {loading ? <CircularProgress size={24} /> : "Lagre"}
              </Button>
            </Grid>
          </Grid>
        </Grid>
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
