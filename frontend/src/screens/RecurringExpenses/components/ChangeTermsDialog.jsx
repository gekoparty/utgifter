import React, { useMemo, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  TextField,
  Button,
  FormControlLabel,
  Checkbox,
  Typography,
} from "@mui/material";

const isMortgageType = (t) => t === "MORTGAGE" || t === "HOUSING";

export default function ChangeTermsDialog({
  open,
  onClose,
  onSubmit,
  expense,
  periodKey,
}) {
  const mortgage = isMortgageType(expense?.type);

  const initial = useMemo(() => {
    const it = expense || {};
    const expected = it.expected || {};
    const mortgageMeta = it.mortgage || {};

    return {
      periodKey: periodKey || it.periodKey || "",
      amount: Number(expected.fixed ?? 0),
      estimateMin: Number(expected.min ?? 0),
      estimateMax: Number(expected.max ?? 0),

      interestRate: Number(mortgageMeta.interestRate ?? 0),
      remainingBalance: Number(mortgageMeta.remainingBalance ?? 0),
      hasMonthlyFee: Boolean(mortgageMeta.monthlyFee > 0),
      monthlyFee: Number(mortgageMeta.monthlyFee ?? 0),

      note: "",
    };
  }, [expense, periodKey]);

  const [form, setForm] = useState(initial);
  const [err, setErr] = useState("");

  React.useEffect(() => {
    if (open) {
      setForm(initial);
      setErr("");
    }
  }, [open, initial]);

  const setField = useCallback((k, v) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErr("");
  }, []);

  const submit = useCallback(async () => {
    if (!/^\d{4}-\d{2}$/.test(String(form.periodKey || ""))) {
      setErr("Ugyldig måned (YYYY-MM)");
      return;
    }

    if (!Number.isFinite(Number(form.amount))) {
      setErr("Ugyldig beløp");
      return;
    }

    // payload can be partial — backend supports it
    const payload = {
      periodKey: String(form.periodKey),
      amount: Number(form.amount || 0),
      note: String(form.note || "").trim(),
    };

    // Non-mortgage can use estimate range
    if (!mortgage) {
      payload.estimateMin = Number(form.estimateMin || 0);
      payload.estimateMax = Number(form.estimateMax || 0);
    } else {
      payload.interestRate = Number(form.interestRate || 0);
      payload.remainingBalance = Number(form.remainingBalance || 0);
      payload.hasMonthlyFee = Boolean(form.hasMonthlyFee);
      payload.monthlyFee = form.hasMonthlyFee ? Number(form.monthlyFee || 0) : 0;
    }

    await onSubmit(payload);
  }, [form, onSubmit, mortgage]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Endre pris fra og med valgt måned</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Dette lager et “terms snapshot” fra valgt måned. Historikk blir ikke endret.
          </Typography>

          <TextField
            label="Gjelder fra måned (YYYY-MM)"
            value={form.periodKey}
            onChange={(e) => setField("periodKey", e.target.value)}
            placeholder="2026-02"
            fullWidth
          />

          <TextField
            label="Beløp"
            type="number"
            value={form.amount}
            onChange={(e) => setField("amount", Number(e.target.value))}
            fullWidth
          />

          {!mortgage && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Estimat min"
                type="number"
                value={form.estimateMin}
                onChange={(e) => setField("estimateMin", Number(e.target.value))}
                fullWidth
              />
              <TextField
                label="Estimat maks"
                type="number"
                value={form.estimateMax}
                onChange={(e) => setField("estimateMax", Number(e.target.value))}
                fullWidth
              />
            </Stack>
          )}

          {mortgage && (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Rente (%)"
                  type="number"
                  value={form.interestRate}
                  onChange={(e) => setField("interestRate", Number(e.target.value))}
                  fullWidth
                />
                <TextField
                  label="Restgjeld"
                  type="number"
                  value={form.remainingBalance}
                  onChange={(e) => setField("remainingBalance", Number(e.target.value))}
                  fullWidth
                />
              </Stack>

              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(form.hasMonthlyFee)}
                    onChange={(e) => setField("hasMonthlyFee", e.target.checked)}
                  />
                }
                label="Har månedlig gebyr"
              />

              <TextField
                label="Gebyr"
                type="number"
                value={form.monthlyFee}
                onChange={(e) => setField("monthlyFee", Number(e.target.value))}
                fullWidth
                disabled={!form.hasMonthlyFee}
              />
            </>
          )}

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

ChangeTermsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  expense: PropTypes.object,
  periodKey: PropTypes.string,
};

