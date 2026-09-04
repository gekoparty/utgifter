import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";

import AppScreen from "../../components/commons/Layout/AppScreen";
import KpiCard from "../../components/commons/DataDisplay/KpiCard";
import DialogFormActions from "../../components/commons/Dialogs/DialogFormActions";
import SectionCard from "../../components/commons/Layout/SectionCard";
import { requestJson } from "../../api/httpClient";
import { useAuth } from "../../auth/useAuth";
import { incomeApi } from "./api/incomeApi";

const INCOME_QUERY_KEY = ["incomes"];
const INCOME_CATEGORIES = ["Lønn", "Bonus", "Trygd", "Salg", "Rente", "Annet"];

const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 2,
});

const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
};

const emptyForm = {
  title: "",
  amount: "",
  incomeDate: todayKey(),
  category: "Lønn",
  note: "",
};

const toDateLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const toMonthKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

function IncomeDialog({ open, initial, pending, error, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState(emptyForm);

  React.useEffect(() => {
    if (!open) return;
    setForm(
      initial
        ? {
            title: initial.title || "",
            amount: String(initial.amount ?? ""),
            incomeDate: String(initial.incomeDate || "").slice(0, 10) || todayKey(),
            category: initial.category || "Lønn",
            note: initial.note || "",
          }
        : { ...emptyForm, incomeDate: todayKey() },
    );
  }, [initial, open]);

  const setField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const disabled =
    form.title.trim().length < 2 ||
    !Number.isFinite(Number(form.amount)) ||
    Number(form.amount) < 0 ||
    !form.incomeDate;

  return (
    <Dialog open={open} onClose={pending ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>{initial ? "Rediger inntekt" : "Ny inntekt"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error ? <Alert severity="error">{error}</Alert> : null}
          <TextField
            label="Navn"
            value={form.title}
            onChange={(event) => setField("title", event.target.value)}
            fullWidth
            autoFocus
          />
          <TextField
            label="Beløp"
            type="number"
            value={form.amount}
            onChange={(event) => setField("amount", event.target.value)}
            fullWidth
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
          />
          <TextField
            label="Dato"
            type="date"
            value={form.incomeDate}
            onChange={(event) => setField("incomeDate", event.target.value)}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Type"
            value={form.category}
            onChange={(event) => setField("category", event.target.value)}
            fullWidth
          >
            {INCOME_CATEGORIES.map((category) => (
              <MenuItem key={category} value={category}>
                {category}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Notat"
            value={form.note}
            onChange={(event) => setField("note", event.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <Box sx={{ px: 3, pb: 2 }}>
        <DialogFormActions
          loading={pending}
          disabled={disabled}
          onCancel={onClose}
          onConfirm={() => onSubmit(form)}
          submitLabel="Lagre"
          leadingAction={
            initial ? (
              <Button color="error" onClick={() => onDelete(initial._id)} disabled={pending}>
                Slett
              </Button>
            ) : null
          }
        />
      </Box>
    </Dialog>
  );
}

export default function IncomeScreen() {
  const queryClient = useQueryClient();
  const { appUser, refreshAppUser } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [expectedMonthlyIncome, setExpectedMonthlyIncome] = useState("");
  const [expectedMessage, setExpectedMessage] = useState("");
  const [expectedError, setExpectedError] = useState("");

  React.useEffect(() => {
    setExpectedMonthlyIncome(String(appUser?.expectedMonthlyIncome ?? 0));
  }, [appUser?.expectedMonthlyIncome]);

  const { data, isLoading, isError } = useQuery({
    queryKey: INCOME_QUERY_KEY,
    queryFn: ({ signal }) => incomeApi.list({ signal }),
  });

  const incomes = useMemo(() => data?.incomes || [], [data]);
  const totals = useMemo(() => {
    const total = incomes.reduce((sum, income) => sum + Number(income.amount || 0), 0);
    const monthKey = toMonthKey(new Date());
    const thisMonth = incomes
      .filter((income) => toMonthKey(income.incomeDate) === monthKey)
      .reduce((sum, income) => sum + Number(income.amount || 0), 0);
    const categories = new Set(incomes.map((income) => income.category || "Annet"));
    return { total, thisMonth, count: incomes.length, categories: categories.size };
  }, [incomes]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: INCOME_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["expenses", "dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
  };

  const saveMutation = useMutation({
    mutationFn: (form) => {
      const payload = {
        ...form,
        amount: Number(form.amount || 0),
      };
      return editing ? incomeApi.update(editing._id, payload) : incomeApi.create(payload);
    },
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setEditing(null);
      setError("");
    },
    onError: (err) => setError(err?.message || "Kunne ikke lagre inntekt"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => incomeApi.delete(id),
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      setEditing(null);
      setError("");
    },
    onError: (err) => setError(err?.message || "Kunne ikke slette inntekt"),
  });

  const expectedMutation = useMutation({
    mutationFn: (value) =>
      requestJson("/api/app-users/me", {
        method: "PATCH",
        data: { expectedMonthlyIncome: Number(value || 0) },
      }),
    onSuccess: async () => {
      await refreshAppUser();
      invalidate();
      setExpectedError("");
      setExpectedMessage("Forventet månedsinntekt er lagret.");
    },
    onError: (err) => {
      setExpectedMessage("");
      setExpectedError(err?.message || "Kunne ikke lagre forventet inntekt.");
    },
  });

  const openCreate = () => {
    setEditing(null);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (income) => {
    setEditing(income);
    setError("");
    setDialogOpen(true);
  };

  return (
    <AppScreen
      title="Inntekter"
      subtitle="Registrer lønn og andre inntekter så dashboardet kan sammenligne inntekt mot utgifter."
      icon={<PaymentsRoundedIcon />}
      actionLabel="Legg til inntekt"
      actionIcon={<AddIcon />}
      onAction={openCreate}
      summaryItems={[
        { label: "Registrert", value: totals.count },
        { label: "Typer", value: totals.categories },
      ]}
      maxWidth={1360}
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <KpiCard label="Denne måneden" value={NOK.format(totals.thisMonth)} tone="primary" />
        <KpiCard label="Totalt registrert" value={NOK.format(totals.total)} />
        <KpiCard label="Antall inntekter" value={totals.count} />
      </Box>

      <SectionCard
        title="Forventet inntekt"
        subtitle="Brukes som månedlig plan i dashboard og statistikk. Registrerte inntekter under viser hva du faktisk fikk."
        contentSx={{ py: 1.5 }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "flex-start" }}
        >
          <TextField
            label="Forventet per måned"
            type="number"
            value={expectedMonthlyIncome}
            onChange={(event) => {
              setExpectedMonthlyIncome(event.target.value);
              setExpectedMessage("");
              setExpectedError("");
            }}
            fullWidth
            slotProps={{ htmlInput: { min: 0, step: 1 } }}
            helperText="For eksempel fast lønn etter skatt."
            sx={{ maxWidth: { sm: 360 } }}
          />
          <Button
            variant="contained"
            onClick={() => expectedMutation.mutate(expectedMonthlyIncome)}
            disabled={
              expectedMutation.isPending ||
              !Number.isFinite(Number(expectedMonthlyIncome)) ||
              Number(expectedMonthlyIncome) < 0
            }
            sx={{ minWidth: 140 }}
          >
            Lagre plan
          </Button>
        </Stack>
        {expectedMessage ? <Alert severity="success" sx={{ mt: 1.5 }}>{expectedMessage}</Alert> : null}
        {expectedError ? <Alert severity="error" sx={{ mt: 1.5 }}>{expectedError}</Alert> : null}
      </SectionCard>

      {(isLoading || isError) && (
        <Alert severity={isError ? "error" : "info"}>
          {isError ? "Kunne ikke hente inntekter." : "Laster inntekter..."}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Dato</TableCell>
                <TableCell>Navn</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Beløp</TableCell>
                <TableCell align="right">Handling</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incomes.map((income) => (
                <TableRow key={income._id} hover>
                  <TableCell>{toDateLabel(income.incomeDate)}</TableCell>
                  <TableCell>
                    <Typography fontWeight={900}>{income.title}</Typography>
                    {income.note ? (
                      <Typography variant="caption" color="text.secondary">
                        {income.note}
                      </Typography>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={income.category || "Annet"} variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight={950} color="success.main">
                      {NOK.format(income.amount || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Rediger">
                      <IconButton size="small" onClick={() => openEdit(income)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Slett">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteMutation.mutate(income._id)}
                        disabled={deleteMutation.isPending}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}

              {!incomes.length && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                      Ingen inntekter registrert ennå.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <IncomeDialog
        open={dialogOpen}
        initial={editing}
        pending={saveMutation.isPending || deleteMutation.isPending}
        error={error}
        onClose={() => {
          setDialogOpen(false);
          setEditing(null);
          setError("");
        }}
        onSubmit={(form) => saveMutation.mutate(form)}
        onDelete={(id) => deleteMutation.mutate(id)}
      />
    </AppScreen>
  );
}
