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

  const handleUpdateShop = async () => {
    const success = await handleSaveShop(onClose);
    if (success) {
      onUpdateSuccess(selectedShop);
    } else {
      onUpdateFailure();
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
      confirmButton={
        <Button onClick={handleUpdateShop} disabled={loading || !isFormValid()}>
          {loading ? <CircularProgress size={24} /> : "Save"}
        </Button>
      }
      cancelButton={
        <Button
          onClick={() => {
            resetFormAndErrors();
            onClose();
          }}
        >
          Cancel
        </Button>
      }
    >
     <Grid container direction="column" spacing={1}>
        <Grid item>
          <TextField
            sx={{ marginTop: 1 }}
            label="Butikk"
            value={shop?.name || ""} // Use optional chaining and provide a default value
            error={Boolean(validationError?.name)} // Use optional chaining
            onChange={(e) => {
              setShop({ ...shop, name: e.target.value });
              resetValidationErrors();
              resetServerError(); // Clear validation errors when input changes
            }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Sted"
            value={shop?.location || ""} // Use optional chaining and provide a default value
            error={Boolean(validationError?.location)} // Use optional chaining
            onChange={(e) => {
              setShop({ ...shop, location: e.target.value });
              resetValidationErrors();
              resetServerError(); // Clear validation errors when input changes
            }}
          />
        </Grid>
        <Grid item>
          <TextField
            label="Kategori"
            value={shop?.category || ""} // Use optional chaining and provide a default value
            error={Boolean(validationError?.category)} // Use optional chaining
            onChange={(e) => {
              setShop({ ...shop, category: e.target.value });
              resetValidationErrors();
              resetServerError(); // Clear validation errors when input changes
            }}
          />
        </Grid>
      </Grid>
      {displayError || validationError ? (
        <ErrorHandling resource="shops" loading={loading} />
      ) : null}   
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
