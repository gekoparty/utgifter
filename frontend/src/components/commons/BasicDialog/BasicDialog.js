import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

const BasicDialog = ({ open, onClose, getContent, cancelButton, confirmButton, dialogTitle }) => {
  const handleClose = () => {
    onClose();
  };


  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        {/* Render the content by calling the getContent function */}
        {getContent()}
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
  getContent: PropTypes.func.isRequired,
  confirmButton: PropTypes.element,
  cancelButton: PropTypes.element,
  dialogTitle: PropTypes.string.isRequired,
  confirmButtonText: PropTypes.string.isRequired,
  cancelButtonText: PropTypes.string.isRequired,
};

export default BasicDialog;
