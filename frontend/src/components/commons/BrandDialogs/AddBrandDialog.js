// AddBrandDialog.js
import React, { useState, useContext, useEffect } from "react";
import { Button, TextField,Typography } from "@mui/material";

import { StoreContext } from "../../../Store/Store";
import BasicDialog from "../BasicDialog/BasicDialog";
import useCustomHttp from "../../../hooks/useHttp";

const AddBrandDialog = ({ open, onClose, onAdd, }) => {
  const { addData, error } = useCustomHttp("/api/brands");
  const { dispatch } = useContext(StoreContext);
  const [brandName, setBrandName] = useState("");
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!open) {
      setBrandName("");
      setErrorMessage("");
    }
  }, [open]);

  const handleAddBrand = async () => {
    // Perform validation, create a new brand object, and add it to the state
    const newBrand = { name: brandName };
    console.log("Data to be sent:", newBrand);

    try {
      const response = await addData("/api/brands", "POST", newBrand);
      
      if (response.error) {
        console.log(error)
        if (error.response.data.message === "Brand already exists") {
          setErrorMessage("Dette merket eksisterer allerede");
        } else {
          setErrorMessage("Feil med lagring av data, prøv igjen");
        }
        console.log("Error adding brand:", error);
      } else {
        console.log("data coming from hook", response);
        const { _id, name } = response.data; // Destructure the desired fields from response.data
        const payload = { _id, name };
        dispatch({ type: "ADD_ITEM", resource: "brands", payload });
        onAdd(newBrand);
        setBrandName("");
        onClose();
        setErrorMessage("");
      }
    } catch (fetchError) {
      setErrorMessage("Feil med lagring av data, prøv igjen")
      console.log("Error adding brand:", fetchError);
    }
  };

  return (
    <>
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle="Nytt Merke"
      confirmButton={<Button onClick={handleAddBrand}>Lagre</Button>}
      cancelButton={<Button onClick={onClose}>Kanseler</Button>}
    >
      <TextField sx={{marginTop: 1}}
        label="Merke"
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
      />
      { errorMessage && (
    <Typography sx={{marginTop: 1}} variant="body1" color="error">
      {errorMessage}
    </Typography>
    )}

    </BasicDialog>
    
    </>
  );
};

export default AddBrandDialog;
