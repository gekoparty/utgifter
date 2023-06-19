

import { Typography, Button } from "@mui/material";
import PropTypes from "prop-types";
import useCustomHttp from "../../../hooks/useHttp";
import BasicDialog from "../BasicDialog/BasicDialog";

const DeleteBrandDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedBrand,
}) => {
  const { deleteData } = useCustomHttp("/api/brands");

  const handleDeleteBrand = async () => {
    console.log('Deleting brand...');
    try {
      const response = await deleteData(`/api/brands/${selectedBrand?._id}`, "DELETE");
      if (response.error) {
        console.log("Error deleting brand:", response.error);
      } else {
        console.log("Brand deleted successfully");
        // Add any necessary actions after successful deletion
      }
    } catch (error) {
      console.log("Error deleting brand:", error);
    } finally {
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
        <Button onClick={onClose}>Avbryt</Button>
      }
      confirmButton={
        <Button onClick={handleDeleteBrand}>Slett</Button>
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