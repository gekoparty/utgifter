// src/screens/RecurringExpenses/RecurringExpenseScreen.jsx
import React, { useMemo, useState } from "react";
import axios from "axios";
import { useQuery, useMutation } from "@tanstack/react-query";
import { API_URL } from "../components/commons/Consts/constants";

import {
  Box,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
  Tabs,
  Tab,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Avatar,
  LinearProgress,
} from "@mui/material";
import { Add, Close, CalendarMonth, ReceiptLong } from "@mui/icons-material";

import { useRecurringController } from "../components/features/RecurringExpenes/hooks/useRecurringController";
import RecurringExpenseDialog from "../components/features/RecurringExpenes/components/RecurringExpenseDialog";
import {
  recurringSummaryKey,
  useRecurringInvalidation,
} from "../components/features/RecurringExpenes/hooks/useRecurringData";

import RecurringOverviewCharts from "../components/features/RecurringExpenes/components/RecurringOverviewCharts";

const TYPE_META = {
  MORTGAGE: { label: "Lån", color: "primary" },
  UTILITY: { label: "Strøm/kommunikasjon", color: "warning" },
  INSURANCE: { label: "Forsikring", color: "success" },
  SUBSCRIPTION: { label: "Abonnement", color: "info" },
  HOUSING: { label: "Lån", color: "primary" },
};

const monthLabel = (d) =>
  new Date(d).toLocaleDateString("nb-NO", { month: "short", year: "numeric" });

function useRecurringSummary({ filter, months = 12, enabled = true }) {
  return useQuery({
    queryKey: recurringSummaryKey(filter, months),
    enabled,
    queryFn: async () => {
      const url = `${API_URL}/api/recurring-expenses/summary?filter=${encodeURIComponent(
        filter,
      )}&months=${months}`;

      const res = await axios.get(url);
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}

export default function RecurringExpenseScreen() {
  const { invalidateSummary } = useRecurringInvalidation();

  const formatCurrency = (val) =>
    new Intl.NumberFormat("nb-NO", {
      style: "currency",
      currency: "NOK",
    }).format(Number(val || 0));

  const ctrl = useRecurringController();

  // ✅ Pay dialog state MUST be inside component
  const [payDialogOpen, setPayDialogOpen] = useState(false);
  const [payDraft, setPayDraft] = useState(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAmountError, setPayAmountError] = useState("");

  const months = 12;

  const { data, isLoading, isError, error } = useRecurringSummary({
    filter: ctrl.filter,
    months,
    enabled: true,
  });

  const expenses = data?.expenses ?? [];
  const forecast = data?.forecast ?? [];
  const nextBills = data?.nextBills ?? [];
  const sum3 = data?.meta?.sum3 ?? { min: 0, max: 0, paid: 0 };

  const selected = useMemo(() => {
    if (!ctrl.selectedMonthKey) return null;
    return forecast.find((m) => m.key === ctrl.selectedMonthKey) ?? null;
  }, [forecast, ctrl.selectedMonthKey]);

  // ctrl.tab:
  // 0 = Expected
  // 1 = Paid
  const maxRef = useMemo(() => {
    const vals = forecast.map((x) =>
      ctrl.tab === 1 ? x.paidTotal : x.expectedMax,
    );
    return Math.max(...vals, 1) || 1;
  }, [forecast, ctrl.tab]);

  const registerPayment = useMutation({
    mutationFn: async ({ recurringExpenseId, periodKey, amount }) => {
      const url = `${API_URL}/api/recurring-payments`;
      const payload = {
        recurringExpenseId,
        periodKey,
        amount: Number(amount || 0),
        paidDate: new Date().toISOString(),
        status: "PAID",
      };
      const res = await axios.post(url, payload);
      return res.data;
    },
    onSuccess: () => {
      invalidateSummary();
    },
  });

  const openPayDialog = (item) => {
    const defaultAmount =
      item?.expected?.max ?? item?.expected?.fixed ?? item?.expected?.min ?? 0;

    setPayDraft(item);
    setPayAmount(String(Number(defaultAmount || 0)));
    setPayAmountError("");
    setPayDialogOpen(true);
  };

  const closePayDialog = () => {
    setPayDialogOpen(false);
    setPayDraft(null);
    setPayAmount("");
    setPayAmountError("");
  };

  const confirmPayDialog = () => {
    const n = Number(payAmount);
    if (!Number.isFinite(n) || n < 0) {
      setPayAmountError("Ugyldig beløp");
      return;
    }
    if (!payDraft?.recurringExpenseId || !payDraft?.periodKey) {
      setPayAmountError("Mangler data for betaling");
      return;
    }

    registerPayment.mutate(
      {
        recurringExpenseId: payDraft.recurringExpenseId,
        periodKey: payDraft.periodKey,
        amount: n,
      },
      {
        onSuccess: () => {
          closePayDialog();
        },
      },
    );
  };

  return (
    <Box sx={{ minHeight: "100%", bgcolor: "background.default" }}>
      {/* Header */}
      <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h4" fontWeight={900}>
              Faste kostnader
            </Typography>
            <Typography color="text.secondary">
              Kommende måneder • estimater • forfall • betalt
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={ctrl.openAdd}
          >
            Legg til
          </Button>
        </Stack>

        {/* Filters + 3-month summary */}
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              alignItems={{ xs: "flex-start", md: "center" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Chip
                  label="Alle"
                  variant={ctrl.filter === "ALL" ? "filled" : "outlined"}
                  onClick={() => ctrl.setFilter("ALL")}
                  sx={{ fontWeight: 800 }}
                />
                {Object.keys(TYPE_META)
                  .filter((t) => t !== "HOUSING")
                  .map((t) => (
                    <Chip
                      key={t}
                      label={TYPE_META[t].label}
                      color={ctrl.filter === t ? TYPE_META[t].color : undefined}
                      variant={ctrl.filter === t ? "filled" : "outlined"}
                      onClick={() => ctrl.setFilter(t)}
                      sx={{ fontWeight: 800 }}
                    />
                  ))}
              </Stack>

              <Box sx={{ textAlign: { xs: "left", md: "right" } }}>
                <Typography variant="caption" color="text.secondary">
                  Neste 3 måneder (forventet)
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {formatCurrency(sum3.min)} – {formatCurrency(sum3.max)}
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  Betalt (3 mnd):{" "}
                  <strong>{formatCurrency(sum3.paid ?? 0)}</strong>
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* ✅ Charts (overview layer) */}
        {!isLoading && !isError && forecast.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <RecurringOverviewCharts forecast={forecast} monthsForTypeSplit={3} />
          </Box>
        )}

        {(isLoading || isError) && (
          <Card sx={{ mt: 2 }}>
            <CardContent>
              {isLoading && (
                <Typography color="text.secondary">
                  Laster faste kostnader…
                </Typography>
              )}
              {isError && (
                <Typography color="error">
                  Kunne ikke hente faste kostnader
                  {error?.message ? `: ${error.message}` : "."}
                </Typography>
              )}
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
            alignItems: "start",
          }}
        >
          {/* Forecast */}
          <Card>
            <CardContent>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                alignItems={{ xs: "flex-start", sm: "center" }}
                gap={1}
                sx={{ mb: 1 }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ minWidth: 0 }}
                >
                  <CalendarMonth />
                  <Typography
                    variant="h6"
                    fontWeight={900}
                    noWrap
                    sx={{ minWidth: 0 }}
                  >
                    Kommende måneder
                  </Typography>
                </Stack>

                <Tabs value={ctrl.tab} onChange={(_, v) => ctrl.setTab(v)}>
                  <Tab label="Forventet" />
                  <Tab label="Betalt" />
                </Tabs>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    xl: "repeat(4, minmax(0, 1fr))",
                  },
                }}
              >
                {forecast.map((m) => {
                  const mainVal = ctrl.tab === 1 ? m.paidTotal : m.expectedMax;
                  const pct = Math.min(100, (mainVal / maxRef) * 100);

                  return (
                    <Card
                      key={m.key}
                      onClick={() => ctrl.openMonth(m.key)}
                      sx={{
                        cursor: "pointer",
                        boxShadow: "none",
                        border: "1px solid rgba(255,255,255,0.08)",
                        "&:hover": {
                          boxShadow: "0 10px 18px rgba(0,0,0,0.25)",
                        },
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography
                            fontWeight={900}
                            noWrap
                            sx={{ minWidth: 0, flex: 1 }}
                          >
                            {monthLabel(m.date)}
                          </Typography>
                          <Chip
                            size="small"
                            label={`${m.itemsCount ?? m.items?.length ?? 0} stk`}
                            sx={{ flexShrink: 0 }}
                          />
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          {ctrl.tab === 1
                            ? "Betalt total"
                            : "Forventet intervall"}
                        </Typography>

                        {ctrl.tab === 1 ? (
                          <Typography variant="h6" fontWeight={900} noWrap>
                            {formatCurrency(m.paidTotal ?? 0)}
                          </Typography>
                        ) : (
                          <Typography
                            variant="h6"
                            fontWeight={900}
                            sx={{ overflowWrap: "anywhere" }}
                          >
                            {formatCurrency(m.expectedMin)} –{" "}
                            {formatCurrency(m.expectedMax)}
                          </Typography>
                        )}

                        <LinearProgress
                          sx={{ mt: 1.5, height: 8, borderRadius: 999 }}
                          variant="determinate"
                          value={pct}
                        />

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          Trykk for detaljer
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </CardContent>
          </Card>

          {/* Upcoming bills */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={900}>
                Neste forfall
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Sortert etter nærmeste dato
              </Typography>

              <List dense sx={{ p: 0 }}>
                {nextBills.map((b) => {
                  const dueLabel = new Date(b.dueDate).toLocaleDateString(
                    "nb-NO",
                    { day: "2-digit", month: "short" },
                  );

                  const isPaid = b.status === "PAID";

                  return (
                    <React.Fragment
                      key={`${b.recurringExpenseId}-${String(b.dueDate)}`}
                    >
                      <ListItem
                        sx={{
                          px: 1,
                          pr: 10,
                          borderRadius: 2,
                          "&:hover": { bgcolor: "action.hover" },
                        }}
                        secondaryAction={
                          <Typography fontWeight={900} noWrap>
                            {formatCurrency(b.expectedMax ?? 0)}
                          </Typography>
                        }
                      >
                        <Avatar sx={{ width: 30, height: 30, mr: 1 }}>
                          <ReceiptLong fontSize="small" />
                        </Avatar>

                        <ListItemText
                          primary={
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ minWidth: 0 }}
                            >
                              <Typography
                                fontWeight={800}
                                noWrap
                                sx={{ minWidth: 0 }}
                              >
                                {b.title}
                              </Typography>
                              {isPaid && (
                                <Chip size="small" label="Betalt" color="success" />
                              )}
                            </Stack>
                          }
                          secondary={
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              noWrap
                            >
                              {TYPE_META[b.type]?.label ?? b.type}
                              {" • "}
                              {dueLabel}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider sx={{ opacity: 0.4 }} />
                    </React.Fragment>
                  );
                })}
              </List>
            </CardContent>
          </Card>

          {/* Expenses list (full width) */}
          <Box sx={{ gridColumn: "1 / -1" }}>
            <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
              Dine faste kostnader (maler)
            </Typography>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                  xl: "repeat(4, minmax(0, 1fr))",
                },
              }}
            >
              {expenses.map((e) => {
                const id = e._id || e.id;
                const isMortgage = e.type === "MORTGAGE" || e.type === "HOUSING";

                const monthlyPayment = Number(e.amount ?? 0);
                const monthlyFee = Number(e.monthlyFee ?? 0);

                const monthsLeft = e?.derived?.monthsLeft ?? null;
                const estInterest = e?.derived?.estInterest ?? null;
                const estPrincipal = e?.derived?.estPrincipal ?? null;

                return (
                  <Card key={id}>
                    <CardContent>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="flex-start"
                        spacing={1}
                      >
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography fontWeight={900} noWrap>
                            {e.title}
                          </Typography>

                          <Typography variant="caption" color="text.secondary" noWrap>
                            {TYPE_META[e.type]?.label ?? e.type}
                            {isMortgage && e.mortgageKind ? ` • ${e.mortgageKind}` : ""}
                            {isMortgage && e.mortgageHolder ? ` • ${e.mortgageHolder}` : ""}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                          <Button size="small" onClick={() => ctrl.openEdit(e)}>
                            Rediger
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => ctrl.openDelete(e)}
                          >
                            Slett
                          </Button>
                        </Stack>
                      </Stack>

                      <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }} noWrap>
                        {formatCurrency(monthlyPayment)}
                      </Typography>

                      {isMortgage && monthlyFee > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Inkl. gebyr: {formatCurrency(monthlyFee)}
                        </Typography>
                      )}

                      {!isMortgage &&
                        (Number(e.estimateMin) > 0 || Number(e.estimateMax) > 0) && (
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            Template-estimat: {formatCurrency(e.estimateMin)} –{" "}
                            {formatCurrency(e.estimateMax)}
                          </Typography>
                        )}

                      {isMortgage && monthsLeft && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Estimert tid igjen:{" "}
                          <strong>
                            {(() => {
                              const years = Math.floor(monthsLeft / 12);
                              const rem = monthsLeft % 12;
                              if (years <= 0) return `${monthsLeft} mnd`;
                              if (rem === 0) return `${years} år`;
                              return `${years} år ${rem} mnd`;
                            })()}
                          </strong>
                        </Typography>
                      )}

                      {isMortgage && estInterest != null && (
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }} flexWrap="wrap">
                          <Chip
                            size="small"
                            variant="outlined"
                            label={`Renter ~ ${formatCurrency(estInterest)}`}
                          />
                          {estPrincipal != null && (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`Avdrag ~ ${formatCurrency(estPrincipal)}`}
                            />
                          )}
                        </Stack>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Typography variant="caption" color="text.secondary">
                        Forfallsdag
                      </Typography>
                      <Typography fontWeight={800}>
                        {e.dueDay ? `Dag ${e.dueDay}` : "—"}
                      </Typography>
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Month Drawer */}
      <Drawer
        anchor="right"
        open={ctrl.monthDrawerOpen}
        onClose={ctrl.closeMonth}
        PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, p: 2 } }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="h6" fontWeight={900} noWrap sx={{ minWidth: 0 }}>
            {selected ? monthLabel(selected.date) : "Måned"}
          </Typography>
          <IconButton onClick={ctrl.closeMonth} aria-label="Lukk">
            <Close />
          </IconButton>
        </Stack>

        {selected && (
          <>
            <Typography variant="body2" color="text.secondary">
              Forventet total
            </Typography>
            <Typography variant="h5" fontWeight={900} sx={{ mb: 0.5 }}>
              {formatCurrency(selected.expectedMin)} –{" "}
              {formatCurrency(selected.expectedMax)}
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Betalt: <strong>{formatCurrency(selected.paidTotal ?? 0)}</strong>
            </Typography>

            <Divider sx={{ mb: 1.5 }} />

            <List dense sx={{ p: 0 }}>
              {(selected.items ?? [])
                .slice()
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
                .map((it) => {
                  const dueLabel = new Date(it.dueDate).toLocaleDateString("nb-NO", {
                    day: "2-digit",
                    month: "short",
                  });

                  const isPaid = it.status === "PAID";
                  const isSkipped = it.status === "SKIPPED";

                  const statusChip = isSkipped ? (
                    <Chip size="small" label="Hoppet over" />
                  ) : isPaid ? (
                    <Chip size="small" label="Betalt" color="success" />
                  ) : (
                    <Chip size="small" label="Ikke betalt" color="warning" />
                  );

                  const expectedLabel =
                    it.expected?.min != null && it.expected?.max != null
                      ? it.expected.min === it.expected.max
                        ? formatCurrency(it.expected.max)
                        : `${formatCurrency(it.expected.min)} – ${formatCurrency(
                            it.expected.max,
                          )}`
                      : formatCurrency(0);

                  const paidLabel = it.actual
                    ? `${formatCurrency(it.actual.amount)} (${new Date(
                        it.actual.paidDate,
                      ).toLocaleDateString("nb-NO")})`
                    : null;

                  return (
                    <React.Fragment key={`${selected.key}-${it.recurringExpenseId}`}>
                      <ListItem
                        sx={{
                          px: 1,
                          borderRadius: 2,
                          "&:hover": { bgcolor: "action.hover" },
                          alignItems: "flex-start",
                        }}
                        secondaryAction={
                          <Stack direction="column" alignItems="flex-end" spacing={0.5} sx={{ pt: 0.25 }}>
                            <Typography fontWeight={900} noWrap>
                              {expectedLabel}
                            </Typography>

                            {paidLabel && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                Betalt: {paidLabel}
                              </Typography>
                            )}

                            {!isPaid && !isSkipped && (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={registerPayment.isPending}
                                onClick={() => openPayDialog(it)}
                              >
                                Registrer betalt
                              </Button>
                            )}
                          </Stack>
                        }
                      >
                        <ListItemText
                          primary={
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                              <Typography fontWeight={800} noWrap sx={{ minWidth: 0 }}>
                                {it.title}
                              </Typography>
                              {statusChip}
                            </Stack>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {TYPE_META[it.type]?.label ?? it.type}
                              {" • "}
                              {dueLabel}
                              {it.expected?.source ? ` • ${it.expected.source}` : ""}
                            </Typography>
                          }
                        />
                      </ListItem>
                      <Divider sx={{ opacity: 0.4 }} />
                    </React.Fragment>
                  );
                })}
            </List>

            {registerPayment.isError && (
              <Typography color="error" sx={{ mt: 1 }}>
                Kunne ikke registrere betaling.
              </Typography>
            )}
          </>
        )}
      </Drawer>

      <RecurringExpenseDialog
        open={ctrl.dialogOpen}
        mode={ctrl.dialogMode}
        expense={ctrl.expenseTarget}
        onClose={ctrl.closeDialog}
        onSuccess={() => invalidateSummary()}
        onError={() => {}}
      />

      {/* Pay confirm dialog */}
      <Dialog open={payDialogOpen} onClose={closePayDialog} fullWidth maxWidth="xs">
        <DialogTitle>Registrer betalt</DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {payDraft?.title ? payDraft.title : "Betaling"}
          </Typography>

          <TextField
            label="Faktisk beløp (NOK)"
            type="number"
            fullWidth
            value={payAmount}
            onChange={(e) => {
              setPayAmount(e.target.value);
              setPayAmountError("");
            }}
            error={Boolean(payAmountError)}
            helperText={payAmountError || "Endre beløpet hvis estimatet ikke stemmer."}
            inputProps={{ min: 0, step: "0.01" }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={closePayDialog} disabled={registerPayment.isPending}>
            Avbryt
          </Button>
          <Button
            variant="contained"
            onClick={confirmPayDialog}
            disabled={registerPayment.isPending || payAmount === ""}
          >
            Lagre
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
