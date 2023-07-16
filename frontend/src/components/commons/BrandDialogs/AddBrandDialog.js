import React, { useState, useContext, useEffect } from "react";
import { Button, TextField, CircularProgress } from "@mui/material";

import { StoreContext } from "../../../Store/Store";
import BasicDialog from "../BasicDialog/BasicDialog";
import useCustomHttp from "../../../hooks/useHttp";
import ErrorHandling from "../ErrorHandling/ErrorHandling";
import { addBrandValidationSchema } from "../../../validation/validationSchema";

const AddBrandDialog = ({ open, onClose, onAdd }) => {
  const { loading, sendRequest } = useCustomHttp("/api/brands");
  const { dispatch, state } = useContext(StoreContext);

  const [brandName, setBrandName] = useState("");

  useEffect(() => {
    if (!open) {
      setBrandName("");
      dispatch({ type: "RESET_ERROR", resource: "brands" });
      dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" });
    }
  }, [open, dispatch]);

  const handleAddBrand = async () => {
    if (typeof brandName !== "string" || brandName.trim().length === 0) {
      return; // Prevent submitting invalid or empty brand name
    }

    try {
      // Validate the brandName field against the validation schema
      await addBrandValidationSchema.validate({ brandName });
    } catch (validationError) {
      dispatch({
        type: "SET_VALIDATION_ERRORS",
        resource: "brands",
        validationErrors: { brandName: validationError.message },
        showError: true,
      });
      return; // Exit the function if validation fails
    }

    const formattedBrandName = brandName
    .toLowerCase() // Convert everything to lowercase first
    .split("-") // Split on hyphens if any
    .map((word) => {
      const [firstChar, ...rest] = word;
      return firstChar.toUpperCase() + rest.join("").toLowerCase();
    })
    .join("-"); // Join words back with hyphen

  const newBrand = { name: formattedBrandName };
  
    try {
      const { data, error: addDataError } = await sendRequest(
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
        //const { _id, name, slug } = data; // Destructure the desired fields from response.data
        const payload = data
        dispatch({ type: "ADD_ITEM", resource: "brands", payload });
        onAdd(newBrand);
        setBrandName("");
        dispatch({ type: "RESET_ERROR", resource: "brands" });
        dispatch({ type: "RESET_VALIDATION_ERRORS", resource: "brands" }); // Reset validation errors
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
  const validationError = state.validationErrors?.brands?.brandName;

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
      {displayError || validationError ? (
        <ErrorHandling resource="brands" loading={loading} />
      ) : null}
    </BasicDialog>
  );
};

export default AddBrandDialog;
