import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  Typography,
} from "@mui/material";

const toMonthInput = (pk) => String(pk || "").trim(); // "YYYY-MM"

export default function PauseDialog({
  open,
  mode, // "CREATE" | "EDIT"
  onClose,
  onSubmit,
  initial,
}) {
  const init = useMemo(() => {
    return {
      from: toMonthInput(initial?.from || ""),
      to: toMonthInput(initial?.to || ""),
      note: initial?.note || "",
    };
  }, [initial]);

  const [form, setForm] = useState(init);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm(init);
      setErr("");
    }
  }, [open, init]);

  const setField = useCallback((k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErr("");
  }, []);

  const submit = useCallback(async () => {
    if (!/^\d{4}-\d{2}$/.test(form.from) || !/^\d{4}-\d{2}$/.test(form.to)) {
      setErr("from/to må være YYYY-MM");
      return;
    }
    if (form.from > form.to) {
      setErr("Fra-måned må være før eller lik til-måned");
      return;
    }

    await onSubmit({
      from: form.from,
      to: form.to,
      note: String(form.note || "").trim(),
    });
  }, [form, onSubmit]);

  const title = mode === "EDIT" ? "Rediger pause" : "Pause regning";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Når en regning er pauset, vises den i måneden med status “Pauset”
            og kan oppheves senere.
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Fra (YYYY-MM)"
              value={form.from}
              onChange={(e) => setField("from", e.target.value)}
              fullWidth
              placeholder="2026-03"
            />
            <TextField
              label="Til (YYYY-MM)"
              value={form.to}
              onChange={(e) => setField("to", e.target.value)}
              fullWidth
              placeholder="2026-05"
            />
          </Stack>

          <TextField
            label="Notat"
            value={form.note}
            onChange={(e) => setField("note", e.target.value)}
            fullWidth
          />

          {err && <Typography color="error">{err}</Typography>}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Avbryt</Button>
        <Button variant="contained" onClick={submit}>
          Lagre
        </Button>
      </DialogActions>
    </Dialog>
  );
}

PauseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["CREATE", "EDIT"]).isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initial: PropTypes.shape({
    from: PropTypes.string,
    to: PropTypes.string,
    note: PropTypes.string,
  }),
};
