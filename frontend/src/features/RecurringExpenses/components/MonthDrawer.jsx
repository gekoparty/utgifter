import React, { memo, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close, ExpandMore } from "@mui/icons-material";
import MortgageScheduleCard from "./MortgageScheduleCard";
import { TYPE_META_BY_KEY, normalizeRecurringType } from "../utils/recurringTypes";
import { dueShortLabel, monthLabel } from "../utils/recurringFormatters";

const periodKeyFromDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function SummaryTile({ label, value, tone = "default" }) {
  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: tone === "paid" ? "success.main" : "divider",
        bgcolor: tone === "paid" ? "rgba(34,197,94,0.10)" : "rgba(255,255,255,0.04)",
        minWidth: 0,
      }}
    >
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography fontWeight={900} noWrap>
        {value}
      </Typography>
    </Box>
  );
}

function DetailRow({ label, value, strong = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={strong ? 900 : 600} textAlign="right">
        {value}
      </Typography>
    </Stack>
  );
}

function PaymentRecord({ title, payment, formatCurrency, action }) {
  if (!payment) return null;

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        bgcolor: "rgba(255,255,255,0.04)",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={900}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatCurrency(payment.amount ?? 0)}
            {payment.paidDate
              ? ` - ${new Date(payment.paidDate).toLocaleDateString("nb-NO")}`
              : ""}
          </Typography>
        </Box>

        {action}
      </Stack>
    </Box>
  );
}

function statusInfo(item) {
  const isPaid = item.status === "PAID";
  const isSkipped = item.status === "SKIPPED";
  const isPaused = item.status === "PAUSED" || Boolean(item.paused);

  if (isPaused) return { label: "Pauset", color: "info" };
  if (isSkipped) return { label: "Hoppet over", color: "default" };
  if (isPaid) return { label: "Betalt", color: "success" };
  return { label: "Ikke betalt", color: "warning" };
}

function expectedLabel(item, formatCurrency) {
  if (item.expected?.min != null && item.expected?.max != null) {
    if (item.expected.min === item.expected.max) {
      return formatCurrency(item.expected.max);
    }
    return `${formatCurrency(item.expected.min)} - ${formatCurrency(item.expected.max)}`;
  }
  return formatCurrency(0);
}

function MonthDrawer({
  open,
  onClose,
  selected,
  expenses,
  onOpenPay,
  onOpenTerms,
  onOpenPauseCreate,
  onOpenPauseEdit,
  onUnpause,
  registerPaymentPending,
  registerPaymentError,
  formatCurrency,
}) {
  const expById = useMemo(() => {
    const m = new Map();
    (expenses || []).forEach((e) => m.set(String(e._id || e.id), e));
    return m;
  }, [expenses]);

  const sortedItems = useMemo(() => {
    const items = selected?.items ?? [];
    return items.slice().sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [selected?.items]);

  const totals = useMemo(() => {
    const paid = Number(selected?.paidTotal ?? 0);
    const expectedMax = Number(selected?.expectedMax ?? 0);
    return {
      remaining: Math.max(0, expectedMax - paid),
      paidCount: sortedItems.filter((it) => it.status === "PAID").length,
      openCount: sortedItems.filter(
        (it) => !["PAID", "SKIPPED", "PAUSED"].includes(String(it.status)),
      ).length,
    };
  }, [selected, sortedItems]);

  const resolvePauseRange = (it) => {
    if (!it?.pauseId) return null;
    const exp = expById.get(String(it.recurringExpenseId));
    const pauses = Array.isArray(exp?.pausePeriods) ? exp.pausePeriods : [];
    const p = pauses.find((x) => String(x._id) === String(it.pauseId));
    if (!p) return null;
    return { from: periodKeyFromDate(p.from), to: periodKeyFromDate(p.to), note: p.note || "" };
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 680 },
          bgcolor: "background.default",
        },
      }}
    >
      <Box
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          p: { xs: 1.5, sm: 2 },
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={900} noWrap>
              {selected ? monthLabel(selected.date) : "Måned"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Klikk en kostnad for betaling, pause eller endring.
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Lukk">
            <Close />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
        {!selected ? (
          <Typography color="text.secondary">Velg en måned for å se detaljer.</Typography>
        ) : (
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
              }}
            >
              <SummaryTile
                label="Forventet"
                value={`${formatCurrency(selected.expectedMin)} - ${formatCurrency(selected.expectedMax)}`}
              />
              <SummaryTile
                label="Betalt"
                value={formatCurrency(selected.paidTotal ?? 0)}
                tone="paid"
              />
              <SummaryTile label="Gjenstår" value={formatCurrency(totals.remaining)} />
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Chip size="small" label={`${sortedItems.length} kostnader`} />
              <Chip size="small" color="warning" label={`${totals.openCount} åpne`} />
              <Chip size="small" color="success" label={`${totals.paidCount} betalt`} />
            </Stack>

            <Divider />

            {sortedItems.length === 0 ? (
              <Card>
                <CardContent>
                  <Typography color="text.secondary">
                    Ingen faste kostnader i denne måneden.
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={1.25}>
                {sortedItems.map((it) => {
                  const status = statusInfo(it);
                  const isPaused = status.label === "Pauset";
                  const isSkipped = status.label === "Hoppet over";
                  const isMortgage = String(it?.type || "").toUpperCase() === "MORTGAGE";
                  const typeKey = normalizeRecurringType(it.type);
                  const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? it.type;
                  const key = `${selected.key}-${it.recurringExpenseId}-${String(it.dueDate)}`;
                  const pauseRange = resolvePauseRange(it);
                  const mortgageSchedule = it?.mortgage?.schedule ?? null;
                  const mainPayment = it?.actual ?? null;
                  const extraPayments = Array.isArray(it?.extraPayments)
                    ? it.extraPayments
                    : it?.extraPayment
                      ? [it.extraPayment]
                      : [];
                  const extraPaymentTotal =
                    it?.extraPaymentTotal != null
                      ? Number(it.extraPaymentTotal || 0)
                      : extraPayments.reduce((sum, p) => sum + Number(p?.amount || 0), 0);

                  const openMainPayment = () =>
                    onOpenPay({
                      ...it,
                      periodKey: it.periodKey || selected.key,
                      paymentKind: "MAIN",
                    });

                  return (
                    <Card key={key} variant="outlined" sx={{ borderRadius: 2 }}>
                      <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                        <Stack spacing={1.5}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            spacing={1}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                                <Typography fontWeight={900} noWrap sx={{ minWidth: 0 }}>
                                  {it.title}
                                </Typography>
                                <Chip size="small" label={status.label} color={status.color} />
                              </Stack>
                              <Typography variant="body2" color="text.secondary">
                                {typeLabel} - {dueShortLabel(it.dueDate)}
                                {it?.mortgage?.mortgageHolder ? ` - ${it.mortgage.mortgageHolder}` : ""}
                                {it?.mortgage?.mortgageKind ? ` - ${it.mortgage.mortgageKind}` : ""}
                              </Typography>
                            </Box>

                            <Typography fontWeight={900}>
                              {expectedLabel(it, formatCurrency)}
                            </Typography>
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gap: 1,
                              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                            }}
                          >
                            <DetailRow label="Forventet" value={expectedLabel(it, formatCurrency)} strong />
                            <DetailRow label="Status" value={status.label} />
                          </Box>

                          {(mainPayment || extraPayments.length > 0) && (
                            <Stack spacing={1}>
                              <Typography variant="subtitle2" fontWeight={900}>
                                Registrerte betalinger
                              </Typography>

                              {mainPayment && (
                                <PaymentRecord
                                  title="Hovedbetaling"
                                  payment={mainPayment}
                                  formatCurrency={formatCurrency}
                                  action={
                                    !isPaused && !isSkipped ? (
                                      <Button
                                        size="small"
                                        variant="outlined"
                                        disabled={registerPaymentPending}
                                        onClick={openMainPayment}
                                      >
                                        Rediger
                                      </Button>
                                    ) : null
                                  }
                                />
                              )}

                              {extraPayments.length > 0 && (
                                <>
                                  <DetailRow
                                    label="Ekstra avdrag totalt"
                                    value={formatCurrency(extraPaymentTotal)}
                                    strong
                                  />

                                  {extraPayments.map((p, idx) => (
                                    <PaymentRecord
                                      key={String(p.paymentId || idx)}
                                      title={`Ekstra avdrag ${idx + 1}`}
                                      payment={p}
                                      formatCurrency={formatCurrency}
                                      action={
                                        <Button
                                          size="small"
                                          variant="outlined"
                                          disabled={registerPaymentPending}
                                          onClick={() =>
                                            onOpenPay({
                                              ...it,
                                              periodKey: it.periodKey || selected.key,
                                              paymentKind: "EXTRA",
                                              extraPayment: {
                                                paymentId: p.paymentId,
                                                amount: p.amount,
                                                paidDate: p.paidDate,
                                                status: p.status,
                                                note: p.note || "",
                                                kind: p.kind || "EXTRA",
                                              },
                                            })
                                          }
                                        >
                                          Rediger
                                        </Button>
                                      }
                                    />
                                  ))}
                                </>
                              )}
                            </Stack>
                          )}

                          {isMortgage && mortgageSchedule && (
                            <Accordion disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider" }}>
                              <AccordionSummary expandIcon={<ExpandMore />}>
                                <Typography fontWeight={900}>Lånedetaljer denne måneden</Typography>
                              </AccordionSummary>
                              <AccordionDetails>
                                <Stack spacing={1}>
                                  <DetailRow label="Renter" value={formatCurrency(mortgageSchedule.interest)} />
                                  <DetailRow
                                    label="Avdrag"
                                    value={formatCurrency(
                                      Number(mortgageSchedule.principal || 0) -
                                        Number(mortgageSchedule.extraPrincipal || 0),
                                    )}
                                  />
                                  <DetailRow
                                    label="Ekstra avdrag"
                                    value={formatCurrency(mortgageSchedule.extraPrincipal)}
                                  />
                                  <DetailRow
                                    label="Saldo før"
                                    value={formatCurrency(mortgageSchedule.balanceStart)}
                                  />
                                  <DetailRow
                                    label="Saldo etter"
                                    value={formatCurrency(mortgageSchedule.balanceEnd)}
                                    strong
                                  />
                                  <MortgageScheduleCard
                                    schedule={mortgageSchedule}
                                    formatCurrency={formatCurrency}
                                  />
                                </Stack>
                              </AccordionDetails>
                            </Accordion>
                          )}

                          {pauseRange && (
                            <Box sx={{ p: 1, borderRadius: 2, bgcolor: "rgba(14,165,233,0.10)" }}>
                              <Typography variant="body2" fontWeight={800}>
                                Pauset {pauseRange.from} - {pauseRange.to}
                              </Typography>
                              {pauseRange.note && (
                                <Typography variant="caption" color="text.secondary">
                                  {pauseRange.note}
                                </Typography>
                              )}
                            </Box>
                          )}

                          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {!isPaused && !isSkipped && (
                              <Button
                                size="small"
                                variant={mainPayment ? "outlined" : "contained"}
                                disabled={registerPaymentPending}
                                onClick={openMainPayment}
                              >
                                {mainPayment ? "Rediger betaling" : "Registrer betaling"}
                              </Button>
                            )}

                            {isMortgage && !isPaused && !isSkipped && (
                              <Button
                                size="small"
                                variant="outlined"
                                disabled={registerPaymentPending}
                                onClick={() =>
                                  onOpenPay({
                                    ...it,
                                    periodKey: it.periodKey || selected.key,
                                    paymentKind: "EXTRA",
                                    extraPayment: null,
                                  })
                                }
                              >
                                Ekstra avdrag
                              </Button>
                            )}

                            {!isPaused && (
                              <Button size="small" variant="outlined" onClick={() => onOpenTerms(it, selected.key)}>
                                Endre beløp
                              </Button>
                            )}

                            {!isPaused ? (
                              <Button
                                size="small"
                                color="info"
                                variant="outlined"
                                onClick={() => onOpenPauseCreate(it, selected.key)}
                              >
                                Pause
                              </Button>
                            ) : (
                              <>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={() => onOpenPauseEdit(it, pauseRange)}
                                >
                                  Rediger pause
                                </Button>
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={() => onUnpause(it)}
                                >
                                  Opphev pause
                                </Button>
                              </>
                            )}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}

            {registerPaymentError && (
              <Typography color="error">
                {registerPaymentError?.response?.data?.message ||
                  registerPaymentError?.message ||
                  "Kunne ikke lagre endringene."}
              </Typography>
            )}
          </Stack>
        )}
      </Box>
    </Drawer>
  );
}

SummaryTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  tone: PropTypes.string,
};

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  strong: PropTypes.bool,
};

PaymentRecord.propTypes = {
  title: PropTypes.string.isRequired,
  payment: PropTypes.object,
  formatCurrency: PropTypes.func.isRequired,
  action: PropTypes.node,
};

MonthDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selected: PropTypes.object,
  expenses: PropTypes.array,
  onOpenPay: PropTypes.func.isRequired,
  onOpenTerms: PropTypes.func.isRequired,
  onOpenPauseCreate: PropTypes.func.isRequired,
  onOpenPauseEdit: PropTypes.func.isRequired,
  onUnpause: PropTypes.func.isRequired,
  registerPaymentPending: PropTypes.bool,
  registerPaymentError: PropTypes.any,
  formatCurrency: PropTypes.func.isRequired,
};

export default memo(MonthDrawer);
