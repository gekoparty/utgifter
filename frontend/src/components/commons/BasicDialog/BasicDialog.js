import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid
} from "@mui/material";

const BasicDialog = ({ open, onClose, children, cancelButton, confirmButton, dialogTitle }) => {
  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
      <Grid container direction="column" spacing={1}>
        {children}
        </Grid>
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
