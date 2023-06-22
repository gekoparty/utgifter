// AddBrandDialog.js
import React, { useState, useContext, useEffect } from "react";
import { Button, TextField,Typography } from "@mui/material";

import { StoreContext } from "../../../Store/Store";
import BasicDialog from "../BasicDialog/BasicDialog";
import useCustomHttp from "../../../hooks/useHttp";

const AddBrandDialog = ({ open, onClose, onAdd, }) => {
  const { addData, error: httpError, resource } = useCustomHttp("/api/brands");
  const { dispatch,  } = useContext(StoreContext);
  const [brandName, setBrandName] = useState("");
  

  useEffect(() => {
    if (!open) {
      setBrandName("");
    }
  }, [open]);

  

  const handleAddBrand = async () => {
    // Perform validation, create a new brand object, and add it to the state
    const newBrand = { name: brandName };
    try {
      const { data, error: addDataError } = await addData("/api/brands", "POST", newBrand);
  
      if (addDataError) {
        console.log("error object from coming from useHttp",addDataError);
        dispatch({ type: "SET_ERROR", error: addDataError, resource });;
      } else {
        const { _id, name } = data; // Destructure the desired fields from response.data
        const payload = { _id, name };
        dispatch({ type: "ADD_ITEM", resource: "brands", payload });
        onAdd(newBrand);
        setBrandName("");
        onClose();
      }
    } catch (fetchError) {
      console.log("Error adding brand:", fetchError);
      dispatch({ type: "SET_ERROR", error: fetchError, resource: "/api/brands" });
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
     {httpError && (
          <Typography sx={{ marginTop: 1 }} variant="body1" color="error">
            {httpError}
          </Typography>
        )}
      </BasicDialog>
    
    </>
  );
};

export default AddBrandDialog;
