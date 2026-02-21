import React, { memo } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function PayDialog({
  open,
  onClose,
  title,

  amount,
  onAmount,

  paidDate,
  onPaidDate,

  periodKey,
  onPeriodKey,

  // ✅ extra payment toggle
  isExtra,
  onIsExtra,
  allowExtra,

  error,
  onConfirm,
  onDelete,
  pending,
  mode, // "CREATE" | "EDIT"
}) {
  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {mode === "EDIT" ? "Rediger betaling" : "Registrer betaling"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {title && (
            <Typography fontWeight={800} noWrap>
              {title}
            </Typography>
          )}

          {/* ✅ Accounting month */}
          <TextField
            label="Måned (regnskapsmåned)"
            type="month"
            value={periodKey || ""}
            onChange={(e) => onPeriodKey?.(e.target.value)}
            fullWidth
            helperText="Velg hvilken måned betalingen skal knyttes til (YYYY-MM)."
          />

          <TextField
            label="Beløp (NOK)"
            type="number"
            value={amount}
            onChange={(e) => onAmount(e.target.value)}
            error={Boolean(error)}
            helperText={error || " "}
            inputProps={{ min: 0, step: 1 }}
            fullWidth
          />

          <TextField
            label="Betalt dato"
            type="date"
            InputLabelProps={{ shrink: true }}
            value={paidDate || ""}
            onChange={(e) => onPaidDate(e.target.value)}
            fullWidth
            helperText="Du kan registrere betalinger tilbake i tid."
          />

          {/* ✅ EXTRA toggle (only when mortgage) */}
          {allowExtra && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(isExtra)}
                  onChange={(e) => onIsExtra?.(e.target.checked)}
                  disabled={pending}
                />
              }
              label="Ekstra avdrag (kun lån)"
            />
          )}

          {allowExtra && isExtra && (
            <Typography variant="caption" color="text.secondary">
              Ekstra avdrag påvirker nedbetalingsplanen som “extraPrincipal” for måneden.
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {mode === "EDIT" && (
          <Button
            color="error"
            onClick={onDelete}
            disabled={pending}
            sx={{ mr: "auto" }}
          >
            Slett betaling
          </Button>
        )}

        <Button onClick={onClose} disabled={pending}>
          Avbryt
        </Button>

        <Button variant="contained" onClick={onConfirm} disabled={pending}>
          {pending ? <CircularProgress size={22} color="inherit" /> : "Lagre"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default memo(PayDialog);

