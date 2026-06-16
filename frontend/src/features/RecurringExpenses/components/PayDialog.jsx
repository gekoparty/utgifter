import React, { memo } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DialogFormActions from "../../../components/commons/Dialogs/DialogFormActions";

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
  isExtra,
  onIsExtra,
  allowExtra,
  error,
  onConfirm,
  onDelete,
  pending,
  mode,
}) {
  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {mode === "EDIT" ? "Rediger betaling" : "Registrer betaling"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {title ? (
            <Typography fontWeight={800} noWrap>
              {title}
            </Typography>
          ) : null}

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
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            fullWidth
          />

          <TextField
            label="Betalt dato"
            type="date"
            slotProps={{ inputLabel: { shrink: true } }}
            value={paidDate || ""}
            onChange={(e) => onPaidDate(e.target.value)}
            fullWidth
            helperText="Du kan registrere betalinger tilbake i tid."
          />

          {allowExtra ? (
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
          ) : null}

          {allowExtra && isExtra ? (
            <Typography variant="caption" color="text.secondary">
              Ekstra avdrag påvirker nedbetalingsplanen som extraPrincipal for måneden.
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>

      <Box sx={{ px: 3, pb: 2 }}>
        <DialogFormActions
          loading={pending}
          onCancel={onClose}
          onConfirm={onConfirm}
          submitLabel="Lagre"
          leadingAction={
            mode === "EDIT" ? (
              <Button color="error" onClick={onDelete} disabled={pending}>
                Slett betaling
              </Button>
            ) : null
          }
        />
      </Box>
    </Dialog>
  );
}

export default memo(PayDialog);
