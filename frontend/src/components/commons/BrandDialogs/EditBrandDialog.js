import React, { useContext, useState, useEffect, useCallback } from "react";
import { Button, TextField } from "@mui/material";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import BasicDialog from "../BasicDialog/BasicDialog";
import { StoreContext } from "../../../Store/Store";
import { addBrandValidationSchema } from "../../../validation/validationSchema";
import ErrorHandling from "../ErrorHandling/ErrorHandling";

const EditBrandDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedBrand,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  const [brandName, setBrandName] = useState(selectedBrand?.name);

  const { sendRequest, loading } = useCustomHttp("/api/brands");
  const { dispatch, state } = useContext(StoreContext);

  const resetValidationErrors = useCallback(() => {
    dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });
  }, [dispatch]);

  const resetServerError = useCallback(() => {
    dispatch({ type: "RESET_ERROR", resource: "brands" });
  }, [dispatch]);

  const resetFormAndErrors = useCallback(() => {
    setBrandName(selectedBrand?.name || "");
    dispatch({ type: "RESET_ERROR", resource: "brands" });
    resetValidationErrors();
  }, [dispatch, selectedBrand, resetValidationErrors]);

  useEffect(() => {
    if (!open) {
      resetFormAndErrors();
    }
  }, [open, resetFormAndErrors]);

  useEffect(() => {
    if (selectedBrand?.name) {
      setBrandName(selectedBrand.name);
    } else {
      setBrandName("");
    }
    resetValidationErrors();
  }, [selectedBrand, resetValidationErrors]);

  const handleUpdateBrand = async () => {
    if (typeof brandName !== "string" || brandName.trim().length === 0) {
      return; // Prevent submitting invalid or empty brand name
    }

    try {
      await addBrandValidationSchema.validate({ brandName });
      resetValidationErrors();
    } catch (validationError) {
      setValidationErrors(validationError.message);
      return;
    }

    try {
      const updatedBrand = { ...selectedBrand, name: brandName };
      const { data, error: updateDataError } = await sendRequest(
        `/api/brands/${selectedBrand?._id}`,
        "PUT",
        updatedBrand
      );

      if (updateDataError) {
        console.log("Error updating brand", updateDataError);
        dispatch({
          type: "SET_ERROR",
          error: updateDataError,
          resource: "brands",
          showError: true,
        });
        onUpdateFailure(selectedBrand);
      } else {
        console.log("Brand updated successfully", data);
        onUpdateSuccess(data);
        dispatch({
          type: "UPDATE_ITEM",
          resource: "brands",
          payload: data,
        });
        resetValidationErrors();
        resetFormAndErrors();
        onClose();
      }
    } catch (fetchError) {
      setError(fetchError);
      onUpdateFailure(selectedBrand);
    } finally {
    }
  };

  const setValidationErrors = (errorMessage) => {
    dispatch({
      type: "SET_VALIDATION_ERRORS",
      resource: "brands",
      validationErrors: { brandName: errorMessage },
      showError: true,
    });
  };

  const setError = (fetchError) => {
    dispatch({
      type: "SET_ERROR",
      error: fetchError,
      resource: "/api/brands",
      showError: true,
    });
  };

  const displayError = state.error?.brands;
  const validationError = state.validationErrors?.brands?.brandName;

  console.log(displayError);

  const isFormValid = () => {
    return (
      typeof brandName === "string" &&
      brandName.trim().length > 0 &&
      !validationError
    );
  };

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      onConfirm={handleUpdateBrand}
      cancelButton={
        <Button onClick={onClose} disabled={loading}>
          Avbryt
        </Button>
      }
      confirmButton={
        <Button
          onClick={handleUpdateBrand}
          disabled={loading || !isFormValid()}
        >
          Oppdater
        </Button>
      }
    >
      <TextField
        sx={{ marginTop: 1 }}
        label="Brand Name"
        value={brandName}
        onChange={(e) => {
          setBrandName(e.target.value);
          resetValidationErrors();
          resetServerError(); // Clear validation errors when input changes
        }}
        error={Boolean(validationError)}
      />
      {displayError || validationError ? (
        <ErrorHandling resource="brands" loading={loading} />
      ) : null}
    </BasicDialog>
  );
};

EditBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  selectedBrand: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditBrandDialog;
