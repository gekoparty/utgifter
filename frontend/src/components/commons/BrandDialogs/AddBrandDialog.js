// AddBrandDialog.js
import React, { useState, useContext } from "react";
import { Button, TextField } from "@mui/material";

import { StoreContext } from "../../../Store/Store";
import BasicDialog from "../BasicDialog/BasicDialog";
import useCustomHttp from "../../../hooks/useHttp";

const AddBrandDialog = ({ open, onClose, onAdd }) => {
  const { addData } = useCustomHttp("/api/brands");
  const { dispatch } = useContext(StoreContext);
  const [brandName, setBrandName] = useState("");

  const handleAddBrand = async () => {
    // Perform validation, create a new brand object, and add it to the state
    const newBrand = { name: brandName };
    console.log("Data to be sent:", newBrand);

    try {
      const response = await addData("/api/brands", "POST", newBrand);

      if (response.error) {
        console.log("Error adding brand:", response.error);
      } else {
        console.log("data coming from hook", response);
        const { _id, name } = response.data; // Destructure the desired fields from response.data
        const payload = { _id, name };
        dispatch({ type: "ADD_ITEM", resource: "brands", payload });
        onAdd(newBrand);
        setBrandName("");
        onClose();
      }
    } catch (fetchError) {
      console.log("Error adding brand:", fetchError);
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle="Add Brand"
      confirmButton={<Button onClick={handleAddBrand}>Add</Button>}
      cancelButton={<Button onClick={onClose}>Cancel</Button>}
    >
      <TextField
        label="Brand Name"
        value={brandName}
        onChange={(e) => setBrandName(e.target.value)}
      />
    </BasicDialog>
  );
};

export default AddBrandDialog;
