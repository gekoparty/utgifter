import { useContext, useState } from "react";
import { Typography, Button } from "@mui/material";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import BasicDialog from "../BasicDialog/BasicDialog";
import { StoreContext } from "../../../Store/Store";

const DeleteBrandDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedBrand,
  onDeleteSuccess,
  onDeleteFailure,
}) => {
  const { sendRequest } = useCustomHttp("/api/brands");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { dispatch } = useContext(StoreContext);

  const handleDeleteBrand = async () => {
    console.log("Deleting brand...");
    setDeleteLoading(true);
    try {
      const response = await sendRequest(`/api/brands/${selectedBrand?._id}`, "DELETE");
      if (response.error) {
        console.log("Error deleting brand:", response.error);
        onDeleteFailure(selectedBrand);
      } else {
        console.log("Brand deleted successfully");
        onDeleteSuccess(selectedBrand);
        dispatch({ type: "DELETE_ITEM", resource: "brands", payload: selectedBrand._id });
        // Add any necessary actions after successful deletion
      }
    } catch (error) {
      console.log("Error deleting brand:", error);
      onDeleteFailure(selectedBrand);
    } finally {
      setDeleteLoading(false);
      onClose();
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      onConfirm={handleDeleteBrand}
      cancelButton={
        <Button onClick={onClose} disabled={deleteLoading}>
          Avbryt
        </Button>
      }
      confirmButton={
        <Button onClick={handleDeleteBrand} disabled={deleteLoading}>
          Slett
        </Button>
      }
    >
      {selectedBrand && (
        <Typography component="p">
          Er du sikker på at du vil slette dette merket, utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedBrand.name}"
          </Typography>{" "}
          vil også påvirkes
        </Typography>
      )}
    </BasicDialog>
  );
};

DeleteBrandDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  cancelButton: PropTypes.node.isRequired,
  selectedBrand: PropTypes.object.isRequired,
};

export default DeleteBrandDialog;