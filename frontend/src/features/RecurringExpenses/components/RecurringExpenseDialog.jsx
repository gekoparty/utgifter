// src/features/RecurringExpenses/components/RecurringExpenseDialog.jsx
import React, { useCallback, useState } from "react";
import PropTypes from "prop-types";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import BasicDialog from "../../../components/commons/BasicDialog/BasicDialog";
import useRecurringDialog from "../hooks/useRecurringDialog";
import useSnackBar from "../../../hooks/useSnackBar";

const TYPES = [
  { value: "UTILITY", label: "Strøm / kommunikasjon" },
  { value: "INSURANCE", label: "Forsikring" },
  { value: "SUBSCRIPTION", label: "Abonnement" },
  { value: "MORTGAGE", label: "Lån" },
];

const MONTHS = [
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
];

const DEFAULT_MORTGAGE_KINDS = ["Hus", "Bil", "Hytte", "Studielån", "Annet"];

const inputNumberProps = { min: 0 };
const decimalNumberProps = { min: 0, step: 0.01 };

function Section({ title, subtitle, children }) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "rgba(255,255,255,0.12)",
        borderRadius: 2,
        p: { xs: 1.5, sm: 2 },
        bgcolor: "rgba(255,255,255,0.035)",
      }}
    >
      <Stack spacing={1.75}>
        <Box>
          <Typography variant="subtitle1" fontWeight={800} lineHeight={1.25}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {children}
      </Stack>
    </Box>
  );
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
};

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
  const busy = Boolean(loading);

  const dialogTitle = isDelete
    ? "Slett fast kostnad"
    : isEdit
      ? "Rediger fast kostnad"
      : "Ny fast kostnad";

  const confirmLabel = isDelete ? "Slett" : "Lagre";
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

  const handleTypeChange = useCallback(
    (event) => {
      const type = event.target.value;
      setForm((prev) => ({
        ...prev,
        type,
        amountMode: type === "MORTGAGE" ? "FIXED" : prev.amountMode,
        billingIntervalMonths: type === "MORTGAGE" ? 1 : prev.billingIntervalMonths,
        estimateMin: type === "MORTGAGE" ? "" : prev.estimateMin,
        estimateMax: type === "MORTGAGE" ? "" : prev.estimateMax,
      }));
      clearErrorsIfAny();
    },
    [setForm, clearErrorsIfAny],
  );

  const handleAmountModeChange = useCallback(
    (_, value) => {
      if (!value) return;
      setForm((prev) => ({
        ...prev,
        amountMode: value,
        amount: value === "ESTIMATE" ? "" : prev.amount,
        estimateMin: value === "FIXED" ? "" : prev.estimateMin,
        estimateMax: value === "FIXED" ? "" : prev.estimateMax,
      }));
      clearErrorsIfAny();
    },
    [setForm, clearErrorsIfAny],
  );

  const handleMortgageKindBlur = useCallback(() => {
    const value = String(form.mortgageKind || "").trim();
    if (!value) return;
    setMortgageKinds((prev) => {
      const exists = prev.some((item) => item.toLowerCase() === value.toLowerCase());
      return exists ? prev : [value, ...prev];
    });
  }, [form.mortgageKind]);

  const handleClose = useCallback(() => {
    resetFormAndErrors();
    onClose();
  }, [resetFormAndErrors, onClose]);

  const submit = useCallback(
    async (event) => {
      event.preventDefault();

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
          showSnackbar(isEdit ? "Endringer lagret" : "Fast kostnad lagret", "success");
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

  const fieldError = (path) => validationError?.[path];
  const helper = (path) => fieldError(path)?.message || "";

  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      dialogTitle={dialogTitle}
      maxWidth={isDelete ? "sm" : "md"}
    >
      <form onSubmit={submit}>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {isDelete ? (
            <Typography>
              Er du sikker på at du vil slette{" "}
              <strong>
                {expense?.title?.trim() ? `"${expense.title}"` : "denne faste kostnaden"}
              </strong>
              ?
            </Typography>
          ) : (
            <>
              {displayError && (
                <Alert severity="error">
                  {displayError?.message || "Kunne ikke lagre fast kostnad."}
                </Alert>
              )}

              <Section title="Hva skal registreres?">
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    name="title"
                    label="Navn"
                    value={form.title}
                    onChange={(event) => setField("title", event.target.value)}
                    fullWidth
                    error={Boolean(fieldError("title"))}
                    helperText={helper("title")}
                  />

                  <TextField
                    select
                    name="type"
                    label="Kategori"
                    value={form.type}
                    onChange={handleTypeChange}
                    fullWidth
                    error={Boolean(fieldError("type"))}
                    helperText={helper("type")}
                  >
                    {TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Stack>
              </Section>

              <Section
                title="Når kommer regningen?"
                subtitle={
                  showMortgage
                    ? "Lån registreres månedlig fra valgt dato."
                    : "Startmåned og frekvens styrer hvilke måneder den vises i oversikten."
                }
              >
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    name="dueDate"
                    label="Neste forfall"
                    type="date"
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={form.dueDate}
                    onChange={(event) => setField("dueDate", event.target.value)}
                    fullWidth
                    error={Boolean(fieldError("dueDay"))}
                    helperText={helper("dueDay")}
                  />

                  {!showMortgage && (
                    <TextField
                      name="billingIntervalMonths"
                      select
                      label="Frekvens"
                      value={form.billingIntervalMonths ?? 1}
                      onChange={(event) =>
                        setField("billingIntervalMonths", Number(event.target.value))
                      }
                      fullWidth
                    >
                      <MenuItem value={1}>Hver måned</MenuItem>
                      <MenuItem value={3}>Hver 3. måned</MenuItem>
                      <MenuItem value={6}>Hver 6. måned</MenuItem>
                      <MenuItem value={12}>Hvert år</MenuItem>
                    </TextField>
                  )}
                </Stack>

                {!showMortgage && (
                  <TextField
                    name="startMonth"
                    select
                    label="Første måned i syklusen"
                    value={form.startMonth ?? new Date().getMonth() + 1}
                    onChange={(event) => setField("startMonth", Number(event.target.value))}
                    fullWidth
                  >
                    {MONTHS.map((name, index) => (
                      <MenuItem key={name} value={index + 1}>
                        {name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              </Section>

              {showMortgage ? (
                <Section title="Lånedetaljer">
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      name="mortgageHolder"
                      label="Långiver / bank"
                      value={form.mortgageHolder}
                      onChange={(event) => setField("mortgageHolder", event.target.value)}
                      fullWidth
                      error={Boolean(fieldError("mortgageHolder"))}
                      helperText={helper("mortgageHolder")}
                    />

                    <TextField
                      name="mortgageKind"
                      label="Type lån"
                      value={form.mortgageKind}
                      onChange={(event) => setField("mortgageKind", event.target.value)}
                      onBlur={handleMortgageKindBlur}
                      fullWidth
                      error={Boolean(fieldError("mortgageKind"))}
                      helperText={helper("mortgageKind")}
                    />
                  </Stack>

                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {mortgageKinds.map((kind) => (
                      <Chip
                        key={kind}
                        label={kind}
                        variant={form.mortgageKind === kind ? "filled" : "outlined"}
                        color={form.mortgageKind === kind ? "primary" : "default"}
                        onClick={() => setField("mortgageKind", kind)}
                      />
                    ))}
                  </Stack>

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      name="remainingBalance"
                      label="Restgjeld"
                      type="number"
                      value={form.remainingBalance}
                      onChange={(event) => setField("remainingBalance", event.target.value)}
                      fullWidth
                      slotProps={{ htmlInput: inputNumberProps }}
                      error={Boolean(fieldError("remainingBalance"))}
                      helperText={helper("remainingBalance")}
                    />

                    <TextField
                      name="interestRate"
                      label="Rente (%)"
                      type="number"
                      value={form.interestRate}
                      onChange={(event) => setField("interestRate", event.target.value)}
                      fullWidth
                      slotProps={{ htmlInput: decimalNumberProps }}
                      error={Boolean(fieldError("interestRate"))}
                      helperText={helper("interestRate")}
                    />
                  </Stack>

                  <Divider />

                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-start">
                    <TextField
                      name="amount"
                      label="Månedlig betaling"
                      type="number"
                      value={form.amount}
                      onChange={(event) => setField("amount", event.target.value)}
                      fullWidth
                      slotProps={{ htmlInput: inputNumberProps }}
                      error={Boolean(fieldError("amount"))}
                      helperText={helper("amount")}
                    />

                    <Box sx={{ width: "100%" }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={Boolean(form.hasMonthlyFee)}
                            onChange={(event) =>
                              setField("hasMonthlyFee", event.target.checked)
                            }
                            disabled={busy}
                          />
                        }
                        label="Månedlig gebyr"
                      />

                      <TextField
                        name="monthlyFee"
                        label="Gebyr"
                        type="number"
                        value={form.monthlyFee}
                        onChange={(event) => setField("monthlyFee", event.target.value)}
                        disabled={!form.hasMonthlyFee || busy}
                        fullWidth
                        sx={{ mt: 1 }}
                        slotProps={{ htmlInput: inputNumberProps }}
                        error={Boolean(fieldError("monthlyFee"))}
                        helperText={helper("monthlyFee")}
                      />
                    </Box>
                  </Stack>
                </Section>
              ) : (
                <Section title="Hvor mye skal settes av?">
                  <ToggleButtonGroup
                    exclusive
                    color="primary"
                    value={form.amountMode}
                    onChange={handleAmountModeChange}
                    size="small"
                    fullWidth
                    sx={{
                      "& .MuiToggleButton-root": {
                        py: 1,
                        textTransform: "none",
                        fontWeight: 700,
                      },
                    }}
                  >
                    <ToggleButton value="FIXED">Fast beløp</ToggleButton>
                    <ToggleButton value="ESTIMATE">Estimat</ToggleButton>
                  </ToggleButtonGroup>

                  {form.amountMode === "ESTIMATE" ? (
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                      <TextField
                        name="estimateMin"
                        label="Minimum"
                        type="number"
                        value={form.estimateMin}
                        onChange={(event) => setField("estimateMin", event.target.value)}
                        fullWidth
                        slotProps={{ htmlInput: inputNumberProps }}
                        error={Boolean(fieldError("estimateMin"))}
                        helperText={helper("estimateMin")}
                      />

                      <TextField
                        name="estimateMax"
                        label="Maksimum"
                        type="number"
                        value={form.estimateMax}
                        onChange={(event) => setField("estimateMax", event.target.value)}
                        fullWidth
                        slotProps={{ htmlInput: inputNumberProps }}
                        error={Boolean(fieldError("estimateMax"))}
                        helperText={helper("estimateMax")}
                      />
                    </Stack>
                  ) : (
                    <TextField
                      name="amount"
                      label="Beløp"
                      type="number"
                      value={form.amount}
                      onChange={(event) => setField("amount", event.target.value)}
                      fullWidth
                      slotProps={{ htmlInput: inputNumberProps }}
                      error={Boolean(fieldError("amount"))}
                      helperText={helper("amount")}
                    />
                  )}
                </Section>
              )}
            </>
          )}

          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.5}
          >
            <Button onClick={handleClose} disabled={busy}>
              Avbryt
            </Button>

            <Button
              type="submit"
              variant="contained"
              color={confirmColor}
              disabled={busy || (isDelete ? false : !isFormValid())}
              startIcon={
                busy ? null : isDelete ? <DeleteOutlineIcon /> : isEdit ? <SaveOutlinedIcon /> : <AddIcon />
              }
            >
              {busy ? <CircularProgress size={22} color="inherit" /> : confirmLabel}
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
