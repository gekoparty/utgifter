import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
} from "@mui/material";

const BasicDialog = ({ open, onClose, children, cancelButton, confirmButton, dialogTitle }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
      <Stack spacing={2} sx={{ mt: 1 }}>
        {children}
        </Stack>
      </DialogContent>
      <DialogActions>
        {cancelButton}
        {confirmButton}
      </DialogActions>
    </Dialog>
  );
};

BasicDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  children: PropTypes.node,
  confirmButton: PropTypes.element,
  cancelButton: PropTypes.element,
  dialogTitle: PropTypes.string.isRequired,
};

export default BasicDialog;
