// AddBrandDialog.js
import React, { useState, useContext, useEffect } from "react";
import { Button, TextField,Typography } from "@mui/material";

import { StoreContext } from "../../../Store/Store";
import BasicDialog from "../BasicDialog/BasicDialog";
import useCustomHttp from "../../../hooks/useHttp";

const AddBrandDialog = ({ open, onClose, onAdd, }) => {
  const { addData, error: httpError} = useCustomHttp("/api/brands");
  const { dispatch, state } = useContext(StoreContext);
  const { error } = state;
  
  const [brandName, setBrandName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  

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
      setIsLoading(true)
      const { data, error: addDataError } = await addData("/api/brands", "POST", newBrand);
  
      if (addDataError) {
        console.log(
          "error object coming from useHttp",
          addDataError
        );
        dispatch({ type: "SET_ERROR", error: addDataError, resource: "brands" });;
        setShowError(true);
      } else {
        const { _id, name } = data; // Destructure the desired fields from response.data
        const payload = { _id, name };
        dispatch({ type: "ADD_ITEM", resource: "brands", payload });
        onAdd(newBrand);
        setBrandName("");
        setShowError(false);
        onClose();
      }
    } catch (fetchError) {
      console.log("Error adding brand:", fetchError);
      dispatch({ type: "SET_ERROR", error: fetchError, resource: "/api/brands" });
      setShowError(true);
    } finally {
      setIsLoading(false)
    }
  };

  
  const displayError = error && error.brands;

  console.log("error:", error);
  console.log("displayError:", displayError);

  return (
    <>
    <BasicDialog
      open={open }
      onClose={onClose}
      dialogTitle="Nytt Merke"
      confirmButton={<Button onClick={handleAddBrand} disabled={isLoading}>Lagre</Button>}
      cancelButton={<Button onClick={onClose}>Kanseler</Button>}
    >
      <TextField sx={{marginTop: 1}}
        label="Merke"
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
      />
     {displayError && (
  <Typography sx={{ marginTop: 1 }} variant="body1" color="error">
    {displayError}
  </Typography>
      )}
      </BasicDialog>
    
    </>
  );
};

export default AddBrandDialog;
