import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const BasicDialog = ({
  open,
  onClose,
  title,
  contentText,
  onConfirm,
  confirmButtonText,
  cancelButtonText,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <Typography id="alert-dialog-description">{contentText}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelButtonText}</Button>
        <Button onClick={onConfirm} autoFocus color="error">
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BasicDialog;
