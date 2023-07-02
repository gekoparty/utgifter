import React, { useState, useContext, useEffect } from "react";
import { Button, TextField } from "@mui/material";

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
    // Perform validation, create a new brand object, and add it to the state
    const newBrand = { name: brandName };
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

  const displayError = state.error?.brands?.[0];
  console.log(displayError)
  

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle="Nytt Merke"
      confirmButton={
        <Button onClick={handleAddBrand} disabled={loading}>
          Lagre
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
      {displayError && <ErrorHandling resource="brands" />}
    </BasicDialog>
  );
};

export default AddBrandDialog;
