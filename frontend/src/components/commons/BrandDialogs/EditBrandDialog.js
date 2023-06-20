import React, { useContext, useState, useEffect } from "react";
import { Button, TextField } from "@mui/material";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import BasicDialog from "../BasicDialog/BasicDialog";
import { StoreContext } from "../../../Store/Store";

const EditBrandDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedBrand,
  onUpdateSuccess,
  onUpdateFailure,
}) => {

  const { fetchData } = useCustomHttp("/api/brands");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [brandName, setBrandName] = useState(selectedBrand?.name)
  const { dispatch } = useContext(StoreContext);

  useEffect(() => {
    setBrandName(selectedBrand?.name || "");
  }, [selectedBrand]);
 
  const handleUpdateBrand = async () => {
    console.log("Updating brand", selectedBrand);
    setUpdateLoading(true);

    try {
        const updatedBrand = { ...selectedBrand, name: brandName };
      const response = await fetchData(
        `/api/brands/${selectedBrand?._id}`,
        "PUT",
        updatedBrand
      );

      if (response.error) {
        console.log("error updating brand", response.error);
        onUpdateFailure(selectedBrand);
      } else {
        console.log("Brand updated succesfully", selectedBrand);
        onUpdateSuccess(response.data);
        dispatch({
          type: "UPDATE_ITEM",
          resource: "brands",
          payload: updatedBrand,
        });
      }
    } catch (error) {
      console.log("Error updating brand", error);
      onUpdateFailure(selectedBrand);
    } finally {
      setUpdateLoading(false);
      onClose();
    }
  };
  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      onConfirm={handleUpdateBrand}
      cancelButton={
        <Button onClick={onClose} disabled={updateLoading}>
          Avbryt
        </Button>
      }
      confirmButton={
        <Button onClick={handleUpdateBrand} disabled={updateLoading}>
          Oppdater
        </Button>
      }
    >
      <TextField
      label="Brand Name"
      value={brandName}
      onChange={(e) => setBrandName(e.target.value)}
    />
    </BasicDialog>
  )
};

EditBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  cancelButton: PropTypes.node.isRequired,
  selectedBrand: PropTypes.object.isRequired,
};

export default EditBrandDialog;
