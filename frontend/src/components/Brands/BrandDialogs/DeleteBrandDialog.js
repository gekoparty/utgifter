import { Typography, Button } from "@mui/material";
import PropTypes from "prop-types";
import useBrandDialog from "../UseBrand/UseBrandDialog";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";

const DeleteBrandDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedBrand,
  onDeleteSuccess,
  onDeleteFailure,
}) => {
  const { handleDeleteBrand, loading } = useBrandDialog();

  const handleDelete = async () => {
    const success = await handleDeleteBrand(selectedBrand, onDeleteSuccess, onDeleteFailure);
    if (success) {
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
        <Button onClick={onClose} disabled={loading}>
          Avbryt
        </Button>
      }
      confirmButton={
        <Button onClick={handleDelete} disabled={loading}>
          Slett
        </Button>
      }
    >
      {selectedBrand && (
        <Typography component="p" marginTop={2}>
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
  selectedBrand: PropTypes.object.isRequired,
  onDeleteSuccess: PropTypes.func.isRequired,
  onDeleteFailure: PropTypes.func.isRequired,
};

export default DeleteBrandDialog;