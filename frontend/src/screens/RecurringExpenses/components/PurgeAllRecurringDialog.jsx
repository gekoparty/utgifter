import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Stack,
} from "@mui/material";

export default function PurgeAllRecurringDialog({ open, onClose, onConfirm }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const ok = useMemo(() => text.trim().toUpperCase() === "PURGE", [text]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>⚠️ Purge ALT (mal + historikk)</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography color="error" fontWeight={900}>
            Dette sletter ALT og kan ikke angres.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dette sletter:
            <br />• Alle faste kostnader (mal/templates)
            <br />• All historikk (terms snapshots)
            <br />• Alle betalinger (MAIN + EXTRA)
          </Typography>
          <Typography variant="body2">
            Skriv <b>PURGE</b> for å bekrefte:
          </Typography>
          <TextField value={text} onChange={(e) => setText(e.target.value)} placeholder="PURGE" />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button color="error" variant="contained" disabled={!ok} onClick={onConfirm}>
          Slett ALT
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PurgeAllRecurringDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};