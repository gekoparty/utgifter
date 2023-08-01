import { Typography, Button } from "@mui/material";
import PropTypes from "prop-types";
import UseCategoryDialog from "../UseCategory/UseCategoryDialog";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";

const DeleteCategoryDialog = ({
  open,
  onClose,
  dialogTitle,
  selectedCategory,
  onDeleteSuccess,
  onDeleteFailure,
}) => {
  const { handleDeleteCategory, loading } = UseCategoryDialog();

  const handleDelete = async () => {
    const success = await handleDeleteCategory(selectedCategory, onDeleteSuccess, onDeleteFailure);
    if (success) {
      onClose();
    }
  };

  return (
    <BasicDialog
      open={open}
      onClose={onClose}
      dialogTitle={dialogTitle}
      onConfirm={handleDeleteCategory}
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
      {selectedCategory && (
        <Typography component="p" marginTop={2}>
          Er du sikker på at du vil slette dette merket, utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedCategory.name}"
          </Typography>{" "}
          vil også påvirkes
        </Typography>
      )}
    </BasicDialog>
  );
};

DeleteCategoryDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  dialogTitle: PropTypes.string.isRequired,
  selectedCategory: PropTypes.object.isRequired,
  onDeleteSuccess: PropTypes.func.isRequired,
  onDeleteFailure: PropTypes.func.isRequired,
};

export default DeleteCategoryDialog;