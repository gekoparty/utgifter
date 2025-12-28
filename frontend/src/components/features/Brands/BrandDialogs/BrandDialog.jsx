import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Button, TextField, CircularProgress, Stack, Typography } from "@mui/material";
import BasicDialog from "../../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../../commons/ErrorHandling/ErrorHandling";
import useBrandDialog from "../UseBrand/UseBrandDialog";

const BrandDialog = ({ open, mode, brandToEdit, onClose, onSuccess, onError }) => {
  const {
    brand,
    setBrand,
    loading,
    handleSaveBrand,
    handleDeleteBrand,
    resetFormAndErrors,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
  } = useBrandDialog(brandToEdit);

  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";

  useEffect(() => {
    if (!open) return;
    if (isEdit && brandToEdit) setBrand(brandToEdit);
    if (mode === "ADD") setBrand({ name: "" });
  }, [open, mode, brandToEdit]);

  const handleClose = () => {
    resetFormAndErrors();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isDelete) {
      const ok = await handleDeleteBrand(brandToEdit, onSuccess, onError);
      if (ok) handleClose();
      return;
    }

    if (!isFormValid()) return;

    const saved = await handleSaveBrand();
    if (saved) {
      onSuccess(saved);
      handleClose();
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      dialogTitle={
        isDelete ? "Bekreft sletting" : isEdit ? "Rediger merke" : "Nytt merke"
      }
    >
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} sx={{ mt: 2 }}>
          {isDelete ? (
            <Typography>
              Er du sikker på at du vil slette{" "}
              <strong>"{brandToEdit?.name}"</strong>?
            </Typography>
          ) : (
            <>
              <TextField
                autoFocus
                fullWidth
                size="small"
                label="Merkenavn"
                value={brand?.name || ""}
                error={Boolean(validationError?.name)}
                disabled={loading}
                onChange={(e) => {
                  setBrand({ ...brand, name: e.target.value });
                  resetValidationErrors();
                  resetServerError();
                }}
              />

              {(displayError || validationError) && (
                <ErrorHandling resource="brands" field="name" loading={loading} />
              )}
            </>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={handleClose} disabled={loading}>
              Avbryt
            </Button>

            <Button
              type="submit"
              variant="contained"
              color={isDelete ? "error" : "primary"}
              disabled={loading || (!isDelete && !isFormValid())}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isDelete ? (
                "Slett"
              ) : (
                "Lagre"
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </BasicDialog>
  );
};

BrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["ADD", "EDIT", "DELETE"]).isRequired,
  brandToEdit: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onError: PropTypes.func,
};

export default BrandDialog;
