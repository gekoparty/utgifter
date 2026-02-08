import React, { memo } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";

function PayDialog({
  open,
  onClose,
  title,
  amount,
  onAmount,
  error,
  onConfirm,
  pending,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Registrer betalt</DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {title || "Betaling"}
        </Typography>

        <TextField
          label="Faktisk beløp (NOK)"
          type="number"
          fullWidth
          value={amount}
          onChange={(e) => onAmount(e.target.value)}
          error={Boolean(error)}
          helperText={error || "Endre beløpet hvis estimatet ikke stemmer."}
          inputProps={{ min: 0, step: "0.01" }}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={pending}>
          Avbryt
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={pending || amount === ""}>
          Lagre
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(PayDialog);