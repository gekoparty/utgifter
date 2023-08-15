import React from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useShopDialog from "../UseShop/useShopDialog";

const EditShopDialog = ({
  selectedShop,
  open,
  onClose,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  const {
    shop,
    setShop,
    loading,
    handleSaveShop,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useShopDialog(selectedShop);

  const handleSubmit = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    // Call the handleSaveShop function from the hook to save the updated shop
    if (isFormValid()) {
      const success = await handleSaveShop(onClose);
      if (success) {
        onUpdateSuccess(selectedShop);
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
      dialogTitle="Edit Shop"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={1}>
          <Grid item>
            <TextField
              sx={{ marginTop: 2 }}
              size="small"
              label="Butikk"
              value={shop?.name || ""} // Use optional chaining and provide a default value
              error={Boolean(validationError?.name)} // Use optional chaining
              onChange={(e) => {
                setShop({ ...shop, name: e.target.value });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="shops" field="name" loading={loading} />
            ) : null}
          </Grid>
          <Grid item>
            <TextField
              label="Sted"
              size="small"
              value={shop?.location || ""} // Use optional chaining and provide a default value
              error={Boolean(validationError?.location)} // Use optional chaining
              onChange={(e) => {
                setShop({ ...shop, location: e.target.value });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="shops" field="location" loading={loading} />
            ) : null}
          </Grid>
          <Grid item>
            <TextField
              size="small"
              label="Kategori"
              value={shop?.category || ""} // Use optional chaining and provide a default value
              error={Boolean(validationError?.category)} // Use optional chaining
              onChange={(e) => {
                setShop({ ...shop, category: e.target.value });
                resetValidationErrors();
                resetServerError(); // Clear validation errors when input changes
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="shops" field="category" loading={loading} />
            ) : null}
          </Grid>
        </Grid>
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ ml: 2 }}
          >
            Cancel
          </Button>
        </Grid>
      </form>
    </BasicDialog>
  );
};

EditShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedShop: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditShopDialog;
s