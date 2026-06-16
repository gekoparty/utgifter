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

export default function HardDeleteMortgageDialog({
  open,
  onClose,
  onConfirm,
  title,
  confirmWord = "SLETT",
}) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (open) setText("");
  }, [open]);

  const ok = useMemo(
    () => String(text || "").trim().toUpperCase() === String(confirmWord).toUpperCase(),
    [text, confirmWord],
  );

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Slett boliglån permanent</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography color="error" fontWeight={900}>
            Dette kan ikke angres.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dette sletter <b>{title || "boliglånet"}</b> og all historikk.
          </Typography>
          <Typography variant="body2">
            Skriv <b>{confirmWord}</b> for å bekrefte:
          </Typography>
          <TextField
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={confirmWord}
            fullWidth
          />

          <DialogFormActions
            isDelete
            disabled={!ok}
            onCancel={onClose}
            onConfirm={onConfirm}
            submitLabel="Slett permanent"
          />
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

HardDeleteMortgageDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  confirmWord: PropTypes.string,
};
