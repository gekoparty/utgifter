import React, { memo, useMemo, Fragment } from "react";
import PropTypes from "prop-types";
import MortgageScheduleCard from "./MortgageScheduleCard";
import {
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { TYPE_META_BY_KEY, normalizeRecurringType } from "../utils/recurringTypes";
import { dueShortLabel, monthLabel } from "../utils/recurringFormatters";

function PaymentLine({ label, amount, paidDate, formatCurrency, action }) {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      spacing={1}
      sx={{
        px: 1,
        py: 0.75,
        borderRadius: 1.5,
        bgcolor: "action.hover",
      }}
    >
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 0 }}>
        {label}: {formatCurrency(amount)}{" "}
        {paidDate ? `(${new Date(paidDate).toLocaleDateString("nb-NO")})` : ""}
      </Typography>

      {action || null}
    </Stack>
  );
}

function InfoLine({ label, value, strong = false }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={2}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="caption" fontWeight={strong ? 800 : 500}>
        {value}
      </Typography>
    </Stack>
  );
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

  const resolvePauseRange = (it) => {
    if (!it?.pauseId) return null;
    const exp = expById.get(String(it.recurringExpenseId));
    const pauses = Array.isArray(exp?.pausePeriods) ? exp.pausePeriods : [];
    const p = pauses.find((x) => String(x._id) === String(it.pauseId));
    if (!p) return null;

    const from = new Date(p.from);
    const to = new Date(p.to);
    const fromPk = `${from.getFullYear()}-${String(from.getMonth() + 1).padStart(2, "0")}`;
    const toPk = `${to.getFullYear()}-${String(to.getMonth() + 1).padStart(2, "0")}`;
    return { from: fromPk, to: toPk, note: p.note || "" };
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 620 }, p: 2 } }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
        <Typography variant="h6" fontWeight={900} noWrap sx={{ minWidth: 0 }}>
          {selected ? monthLabel(selected.date) : "Måned"}
        </Typography>
        <IconButton onClick={onClose} aria-label="Lukk">
          <Close />
        </IconButton>
      </Stack>

      {selected && (
        <>
          <Typography variant="body2" color="text.secondary">
            Forventet total
          </Typography>
          <Typography variant="h5" fontWeight={900} sx={{ mb: 0.5 }}>
            {formatCurrency(selected.expectedMin)} – {formatCurrency(selected.expectedMax)}
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Betalt: <strong>{formatCurrency(selected.paidTotal ?? 0)}</strong>
          </Typography>

          <Divider sx={{ mb: 1.5 }} />

          <List dense sx={{ p: 0 }}>
            {sortedItems.map((it) => {
              const isPaid = it.status === "PAID";
              const isSkipped = it.status === "SKIPPED";
              const isPaused = it.status === "PAUSED" || Boolean(it.paused);
              const isMortgage = String(it?.type || "").toUpperCase() === "MORTGAGE";

              const statusChip = isPaused ? (
                <Chip size="small" label="Pauset" color="info" />
              ) : isSkipped ? (
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
                    : `${formatCurrency(it.expected.min)} – ${formatCurrency(it.expected.max)}`
                  : formatCurrency(0);

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

              return (
                <Fragment key={key}>
                  <ListItem
                    sx={{
                      px: 1,
                      py: 1,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Box
                      sx={{
                        width: "100%",
                        display: "grid",
                        gridTemplateColumns: "minmax(0,1fr)",
                        gap: 1.5,
                        alignItems: "start",
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                        <Typography fontWeight={800} noWrap sx={{ minWidth: 0 }}>
                          {it.title}
                        </Typography>
                        {statusChip}
                      </Stack>

                      <Typography variant="caption" color="text.secondary" noWrap>
                        {typeLabel} {" • "} {dueShortLabel(it.dueDate)}
                        {it?.mortgage?.mortgageHolder ? ` • ${it.mortgage.mortgageHolder}` : ""}
                        {it?.mortgage?.mortgageKind ? ` • ${it.mortgage.mortgageKind}` : ""}
                      </Typography>

                      <Stack spacing={0.5}>
                        <InfoLine label="Forventet" value={expectedLabel} strong />
                        <InfoLine
                          label="Status"
                          value={isPaused ? "Pauset" : isSkipped ? "Hoppet over" : isPaid ? "Betalt" : "Åpen"}
                        />
                      </Stack>

                      {mainPayment && (
                        <Stack spacing={0.5}>
                          <Typography variant="caption" fontWeight={800}>
                            Hovedbetaling
                          </Typography>
                          <PaymentLine
                            label="Main"
                            amount={mainPayment.amount}
                            paidDate={mainPayment.paidDate}
                            formatCurrency={formatCurrency}
                            action={
                              !isPaused && !isSkipped ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  disabled={registerPaymentPending}
                                  onClick={() =>
                                    onOpenPay({
                                      ...it,
                                      periodKey: it.periodKey || selected.key,
                                      paymentKind: "MAIN",
                                    })
                                  }
                                  sx={{ borderRadius: 999, textTransform: "none", flexShrink: 0 }}
                                >
                                  Rediger
                                </Button>
                              ) : null
                            }
                          />
                        </Stack>
                      )}

                      {extraPayments.length > 0 && (
                        <Stack spacing={0.5}>
                          <Typography variant="caption" fontWeight={800}>
                            Ekstra betalinger
                          </Typography>

                          <InfoLine
                            label="Ekstra totalt"
                            value={formatCurrency(extraPaymentTotal)}
                            strong
                          />

                          {extraPayments.map((p, idx) => (
                            <PaymentLine
                              key={String(p.paymentId || idx)}
                              label={`Ekstra ${idx + 1}`}
                              amount={p.amount}
                              paidDate={p.paidDate}
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
                                  sx={{ borderRadius: 999, textTransform: "none", flexShrink: 0 }}
                                >
                                  Rediger
                                </Button>
                              }
                            />
                          ))}
                        </Stack>
                      )}

                      {isMortgage && mortgageSchedule && (
                        <Stack spacing={0.5} sx={{ p: 1, borderRadius: 2, bgcolor: "background.paper" }}>
                          <Typography variant="caption" fontWeight={800}>
                            Lån denne måneden
                          </Typography>

                          <InfoLine
                            label="Renter"
                            value={formatCurrency(mortgageSchedule.interest)}
                          />
                          <InfoLine
                            label="Avdrag"
                            value={formatCurrency(
                              Number(mortgageSchedule.principal || 0) -
                                Number(mortgageSchedule.extraPrincipal || 0),
                            )}
                          />
                          <InfoLine
                            label="Ekstra avdrag"
                            value={formatCurrency(mortgageSchedule.extraPrincipal)}
                          />
                          <InfoLine
                            label="Saldo før"
                            value={formatCurrency(mortgageSchedule.balanceStart)}
                          />
                          <InfoLine
                            label="Saldo etter"
                            value={formatCurrency(mortgageSchedule.balanceEnd)}
                            strong
                          />
                        </Stack>
                      )}

                      {mortgageSchedule && (
                        <MortgageScheduleCard schedule={mortgageSchedule} formatCurrency={formatCurrency} />
                      )}

                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {!isPaused && !isSkipped && (
                          <Button
                            size="small"
                            variant={mainPayment ? "outlined" : "contained"}
                            disabled={registerPaymentPending}
                            onClick={() =>
                              onOpenPay({
                                ...it,
                                periodKey: it.periodKey || selected.key,
                                paymentKind: "MAIN",
                              })
                            }
                            sx={{ borderRadius: 999, textTransform: "none" }}
                          >
                            {mainPayment ? "Rediger hovedbetaling" : "Registrer hovedbetaling"}
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
                            sx={{ borderRadius: 999, textTransform: "none" }}
                          >
                            Legg til ekstra avdrag
                          </Button>
                        )}

                        {!isPaused && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onOpenTerms(it, selected.key)}
                            sx={{ borderRadius: 999, textTransform: "none" }}
                          >
                            Endre pris
                          </Button>
                        )}

                        {!isPaused ? (
                          <Button
                            size="small"
                            color="info"
                            variant="outlined"
                            onClick={() => onOpenPauseCreate(it, selected.key)}
                            sx={{ borderRadius: 999, textTransform: "none" }}
                          >
                            Pause
                          </Button>
                        ) : (
                          <>
                            {pauseRange && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                Pauset: {pauseRange.from} → {pauseRange.to}
                              </Typography>
                            )}
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => onOpenPauseEdit(it, pauseRange)}
                              sx={{ borderRadius: 999, textTransform: "none" }}
                            >
                              Rediger pause
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => onUnpause(it)}
                              sx={{ borderRadius: 999, textTransform: "none" }}
                            >
                              Opphev
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Box>
                  </ListItem>

                  <Divider sx={{ opacity: 0.35 }} />
                </Fragment>
              );
            })}
          </List>

          {registerPaymentError && (
            <Typography color="error" sx={{ mt: 1 }}>
              {registerPaymentError?.response?.data?.message ||
                registerPaymentError?.message ||
                "Kunne ikke lagre endringene."}
            </Typography>
          )}
        </>
      )}
    </Drawer>
  );
}

PaymentLine.propTypes = {
  label: PropTypes.string.isRequired,
  amount: PropTypes.number,
  paidDate: PropTypes.any,
  formatCurrency: PropTypes.func.isRequired,
  action: PropTypes.node,
};

InfoLine.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.node,
  strong: PropTypes.bool,
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

