import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Typography,
  TextField,
  Stack,
} from "@mui/material";
import DialogFormActions from "../../../components/commons/Dialogs/DialogFormActions";

const CONFIRM_TEXT = "SLETT ALT";

export default function PurgeAllRecurringDialog({ open, onClose, onConfirm }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const ok = useMemo(
    () => text.trim().toUpperCase() === CONFIRM_TEXT,
    [text],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Slett alt av faste kostnader</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography color="error" fontWeight={900}>
            Dette kan ikke angres.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dette sletter alle faste kostnader, prisendringer, pauser og
            registrerte betalinger.
          </Typography>
          <Typography variant="body2">
            Skriv <b>{CONFIRM_TEXT}</b> for å bekrefte:
          </Typography>
          <TextField
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={CONFIRM_TEXT}
            fullWidth
          />

          <DialogFormActions
            isDelete
            disabled={!ok}
            onCancel={onClose}
            onConfirm={onConfirm}
            submitLabel="Slett alt"
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

PurgeAllRecurringDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
