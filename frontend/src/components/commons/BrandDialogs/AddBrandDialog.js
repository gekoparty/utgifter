import React, { useState, useContext, useEffect } from "react";
import { Button, TextField, CircularProgress } from "@mui/material";

import { StoreContext } from "../../../Store/Store";
import BasicDialog from "../BasicDialog/BasicDialog";
import useCustomHttp from "../../../hooks/useHttp";
import ErrorHandling from "../ErrorHandling/ErrorHandling";

const AddBrandDialog = ({ open, onClose, onAdd }) => {
  const { loading, addData } = useCustomHttp("/api/brands");
  const { dispatch, state } = useContext(StoreContext);

  const [brandName, setBrandName] = useState("");

  useEffect(() => {
    if (!open) {
      setBrandName("");
      dispatch({ type: "RESET_ERROR", resource: "brands" });
    }
  }, [open, dispatch]);

  const handleAddBrand = async () => {
    if (typeof brandName !== "string" || brandName.trim().length === 0) {
      return; // Prevent submitting invalid or empty brand name
    }
  
    // Perform validation, create a new brand object, and add it to the state
    const formattedBrandName = brandName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  
    const newBrand = { name: formattedBrandName };
    try {
      const { data, error: addDataError } = await addData(
        "/api/brands",
        "POST",
        newBrand
      );

      if (addDataError) {
        dispatch({
          type: "SET_ERROR",
          error: addDataError,
          resource: "brands",
          showError: true,
        });
      } else {
        const { _id, name } = data; // Destructure the desired fields from response.data
        const payload = { _id, name };
        dispatch({ type: "ADD_ITEM", resource: "brands", payload });
        onAdd(newBrand);
        setBrandName("");
        dispatch({ type: "RESET_ERROR", resource: "brands" });
        onClose();
      }
    } catch (fetchError) {
      dispatch({
        type: "SET_ERROR",
        error: fetchError,
        resource: "/api/brands",
        showError: true,
      });
    }
  };

  const displayError = state.error?.brands;

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle="Nytt Merke"
      confirmButton={
        <Button onClick={handleAddBrand} disabled={loading || !brandName}>
          {loading ? <CircularProgress size={24} /> : "Lagre"}
        </Button>
      }
      cancelButton={<Button onClick={onClose}>Kanseler</Button>}
    >
      <TextField
        sx={{ marginTop: 1 }}
        label="Merke"
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
      />
      {displayError ? (
        <ErrorHandling resource="brands" loading={loading} />
      ) : null}
    </BasicDialog>
  );
};

export default AddBrandDialog;
