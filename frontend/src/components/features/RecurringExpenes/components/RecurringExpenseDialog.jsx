// src/components/features/RecurringExpenes/components/RecurringExpenseDialog.jsx
import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Divider,
  Chip,
} from "@mui/material";
import BasicDialog from "../../../commons/BasicDialog/BasicDialog";
import useRecurringDialog from "../hooks/useRecurringDialog";
import useSnackBar from "../../../../hooks/useSnackBar";

const TYPES = [
  { value: "MORTGAGE", label: "Lån" },
  { value: "UTILITY", label: "Strøm / kommunikasjon" },
  { value: "INSURANCE", label: "Forsikring" },
  { value: "SUBSCRIPTION", label: "Abonnement" },
];

const DEFAULT_MORTGAGE_KINDS = ["Hus", "Bil", "Hytte", "Studielån", "Annet"];

export default function RecurringExpenseDialog({
  open,
  mode,
  expense,
  onClose,
  onSuccess,
  onError,
}) {
  const isEdit = mode === "EDIT";
  const isDelete = mode === "DELETE";

  const {
    form,
    setForm,
    loading,
    displayError,
    validationError,
    isFormValid,
    handleSave,
    handleDelete,
    resetFormAndErrors,
    resetValidationErrors,
    resetServerError,
  } = useRecurringDialog({ open, mode, initial: expense });

  const { showSnackbar } = useSnackBar();

  const [mortgageKinds, setMortgageKinds] = useState(DEFAULT_MORTGAGE_KINDS);

  const showMortgage = form.type === "MORTGAGE";

  const dialogTitle = isDelete
    ? "Fullfør fast kostnad"
    : isEdit
      ? "Rediger fast kostnad"
      : "Ny fast kostnad";

  const confirmLabel = isDelete ? "Fullfør" : "Lagre";
  const confirmColor = isDelete ? "error" : "primary";

  const clearErrorsIfAny = useCallback(() => {
    if (validationError) resetValidationErrors();
    if (displayError) resetServerError();
  }, [validationError, displayError, resetValidationErrors, resetServerError]);

  const setField = useCallback(
    (key, value) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      clearErrorsIfAny();
    },
    [setForm, clearErrorsIfAny],
  );

  const handleAddKind = useCallback(() => {
    const val = String(form.mortgageKind || "").trim();
    if (!val) return;

    setMortgageKinds((prev) => {
      const exists = prev.some((x) => x.toLowerCase() === val.toLowerCase());
      return exists ? prev : [val, ...prev];
    });
  }, [form.mortgageKind]);

  const handleClose = useCallback(() => {
    resetFormAndErrors();
    onClose();
  }, [resetFormAndErrors, onClose]);

  const submit = useCallback(
    async (e) => {
      e.preventDefault();

      try {
        if (isDelete) {
          const ok = await handleDelete(expense);
          if (ok) {
            showSnackbar("Fast kostnad slettet", "success");
            onSuccess?.(expense);
            handleClose();
          } else {
            showSnackbar("Kunne ikke slette fast kostnad", "error");
            onError?.();
          }
          return;
        }

        if (!isFormValid()) {
          showSnackbar("Sjekk feltene i skjemaet", "warning");
          return;
        }

        const saved = await handleSave();
        if (saved) {
          showSnackbar(
            isEdit ? "Endringer lagret" : "Fast kostnad lagret",
            "success",
          );
          onSuccess?.(saved);
          handleClose();
        } else {
          showSnackbar("Kunne ikke lagre fast kostnad", "error");
          onError?.();
        }
      } catch {
        showSnackbar("Noe gikk galt", "error");
        onError?.();
      }
    },
    [
      isDelete,
      handleDelete,
      expense,
      showSnackbar,
      onSuccess,
      handleClose,
      onError,
      isFormValid,
      handleSave,
      isEdit,
    ],
  );

  const busy = Boolean(loading);

  const fieldError = (path) => validationError?.[path];
  const helper = (path) => fieldError(path)?.message || "";

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle={dialogTitle}>
      <form onSubmit={submit}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {isDelete ? (
            <Typography>
              Er du sikker på at du vil slette{" "}
              <strong>
                {expense?.title?.trim()
                  ? `"${expense.title}"`
                  : "dette elementet"}
              </strong>
              ?
            </Typography>
          ) : (
            <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Tittel"
                  value={form.title}
                  onChange={(e) => setField("title", e.target.value)}
                  fullWidth
                  error={Boolean(fieldError("title"))}
                  helperText={helper("title")}
                />

                <TextField
                  select
                  label="Type"
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value)}
                  fullWidth
                  error={Boolean(fieldError("type"))}
                  helperText={helper("type")}
                >
                  {TYPES.map((t) => (
                    <MenuItem key={t.value} value={t.value}>
                      {t.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <TextField
                label="Forfallsdato"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.dueDate}
                onChange={(e) => setField("dueDate", e.target.value)}
                fullWidth
                error={Boolean(fieldError("dueDay"))}
                helperText={
                  helper("dueDay") ||
                  "Velg en dato (dagen brukes som fast forfallsdag hver måned)."
                }
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  select
                  label="Frekvens"
                  value={form.billingIntervalMonths ?? 1}
                  onChange={(e) =>
                    setField("billingIntervalMonths", Number(e.target.value))
                  }
                  fullWidth
                >
                  <MenuItem value={1}>Hver måned</MenuItem>
                  <MenuItem value={3}>Hver 3. måned</MenuItem>
                  <MenuItem value={6}>Hver 6. måned</MenuItem>
                  <MenuItem value={12}>Hvert år</MenuItem>
                </TextField>

                <TextField
                  select
                  label="Startmåned"
                  value={form.startMonth ?? new Date().getMonth() + 1}
                  onChange={(e) =>
                    setField("startMonth", Number(e.target.value))
                  }
                  fullWidth
                  helperText="Bestemmer hvilke måneder regningen kommer."
                >
                  {[
                    "Januar",
                    "Februar",
                    "Mars",
                    "April",
                    "Mai",
                    "Juni",
                    "Juli",
                    "August",
                    "September",
                    "Oktober",
                    "November",
                    "Desember",
                  ].map((name, idx) => (
                    <MenuItem key={name} value={idx + 1}>
                      {name}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>

              <Divider />

              {showMortgage ? (
                <>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    alignItems="center"
                  >
                    <Chip label="Lån" color="primary" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">
                      Brukes til å beregne restgjeld, rente, gebyr og estimert
                      tid igjen.
                    </Typography>
                  </Stack>

                  <TextField
                    label="Långiver / bank"
                    value={form.mortgageHolder}
                    onChange={(e) => setField("mortgageHolder", e.target.value)}
                    fullWidth
                    error={Boolean(fieldError("mortgageHolder"))}
                    helperText={helper("mortgageHolder")}
                  />

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="flex-start"
                  >
                    <TextField
                      select
                      label="Type lån"
                      value={form.mortgageKind}
                      onChange={(e) => setField("mortgageKind", e.target.value)}
                      fullWidth
                      error={Boolean(fieldError("mortgageKind"))}
                      helperText={
                        helper("mortgageKind") || "Du kan legge til nye typer."
                      }
                    >
                      {mortgageKinds.map((k) => (
                        <MenuItem key={k} value={k}>
                          {k}
                        </MenuItem>
                      ))}
                    </TextField>

                    <Box sx={{ width: { xs: "100%", sm: 220 } }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleAddKind}
                        sx={{ height: 56 }}
                        disabled={busy}
                      >
                        Legg til type
                      </Button>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                      >
                        Skriv inn ny type → trykk «Legg til type»
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Restgjeld (NOK)"
                      type="number"
                      value={form.remainingBalance}
                      onChange={(e) =>
                        setField("remainingBalance", Number(e.target.value))
                      }
                      fullWidth
                      inputProps={{ min: 0 }}
                      error={Boolean(fieldError("remainingBalance"))}
                      helperText={helper("remainingBalance")}
                    />

                    <TextField
                      label="Rente (%)"
                      type="number"
                      value={form.interestRate}
                      onChange={(e) =>
                        setField("interestRate", Number(e.target.value))
                      }
                      fullWidth
                      inputProps={{ min: 0, step: 0.01 }}
                      error={Boolean(fieldError("interestRate"))}
                      helperText={helper("interestRate")}
                    />
                  </Stack>

                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="flex-start"
                  >
                    <TextField
                      label="Månedlig betaling (NOK)"
                      type="number"
                      value={form.amount}
                      onChange={(e) =>
                        setField("amount", Number(e.target.value))
                      }
                      fullWidth
                      inputProps={{ min: 0 }}
                      error={Boolean(fieldError("amount"))}
                      helperText={helper("amount")}
                    />

                    <Box sx={{ width: "100%" }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(form.hasMonthlyFee)}
                            onChange={(e) =>
                              setField("hasMonthlyFee", e.target.checked)
                            }
                            disabled={busy}
                          />
                        }
                        label="Har månedlig gebyr"
                      />

                      <TextField
                        label="Gebyr (NOK)"
                        type="number"
                        value={form.monthlyFee}
                        onChange={(e) =>
                          setField("monthlyFee", Number(e.target.value))
                        }
                        disabled={!form.hasMonthlyFee || busy}
                        fullWidth
                        sx={{ mt: 1 }}
                        inputProps={{ min: 0 }}
                        error={Boolean(fieldError("monthlyFee"))}
                        helperText={helper("monthlyFee")}
                      />
                    </Box>
                  </Stack>
                </>
              ) : (
                <>
                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    alignItems="center"
                  >
                    <Chip label="Beløp / estimat" variant="outlined" />
                    <Typography variant="caption" color="text.secondary">
                      Bruk enten månedlig beløp, eller estimatintervall
                      (min/maks).
                    </Typography>
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      label="Månedlig beløp (NOK)"
                      type="number"
                      value={form.amount}
                      onChange={(e) =>
                        setField("amount", Number(e.target.value))
                      }
                      fullWidth
                      inputProps={{ min: 0 }}
                      error={Boolean(fieldError("amount"))}
                      helperText={helper("amount")}
                    />

                    <TextField
                      label="Estimat min (NOK)"
                      type="number"
                      value={form.estimateMin}
                      onChange={(e) =>
                        setField("estimateMin", Number(e.target.value))
                      }
                      fullWidth
                      inputProps={{ min: 0 }}
                      error={Boolean(fieldError("estimateMin"))}
                      helperText={helper("estimateMin")}
                    />
                  </Stack>

                  <TextField
                    label="Estimat maks (NOK)"
                    type="number"
                    value={form.estimateMax}
                    onChange={(e) =>
                      setField("estimateMax", Number(e.target.value))
                    }
                    fullWidth
                    inputProps={{ min: 0 }}
                    error={Boolean(fieldError("estimateMax"))}
                    helperText={helper("estimateMax")}
                  />
                </>
              )}
            </>
          )}

          <Stack direction="row" justifyContent="flex-end" spacing={2}>
            <Button onClick={handleClose} disabled={busy}>
              Avbryt
            </Button>

            <Button
              type="submit"
              variant="contained"
              color={confirmColor}
              disabled={busy || (isDelete ? false : !isFormValid())}
            >
              {busy ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                confirmLabel
              )}
            </Button>
          </Stack>
        </Stack>
      </form>
    </BasicDialog>
  );
}

RecurringExpenseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  mode: PropTypes.oneOf(["ADD", "EDIT", "DELETE"]).isRequired,
  expense: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
};
