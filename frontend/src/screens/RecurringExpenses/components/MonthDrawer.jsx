import React, { memo, useMemo, Fragment } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import { TYPE_META_BY_KEY, normalizeRecurringType } from "../utils/recurringTypes";
import { dueShortLabel, monthLabel } from "../utils/recurringFormatters";

function MonthDrawer({
  open,
  onClose,
  selected,
  expenses, // ✅ templates list (includes pausePeriods)
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
      PaperProps={{ sx: { width: { xs: "100%", sm: 520 }, p: 2 } }}
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

              const paidLabel = it.actual
                ? `${formatCurrency(it.actual.amount)} (${new Date(it.actual.paidDate).toLocaleDateString("nb-NO")})`
                : null;

              const typeKey = normalizeRecurringType(it.type);
              const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? it.type;

              const key = `${selected.key}-${it.recurringExpenseId}-${String(it.dueDate)}`;

              const pauseRange = resolvePauseRange(it);

              return (
                <Fragment key={key}>
                  <ListItem
                    sx={{
                      px: 1,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "action.hover" },
                      alignItems: "flex-start",
                    }}
                    secondaryAction={
                      <Stack direction="column" alignItems="flex-end" spacing={0.75} sx={{ pt: 0.25 }}>
                        <Typography fontWeight={900} noWrap>
                          {expectedLabel}
                        </Typography>

                        {paidLabel && (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            Betalt: {paidLabel}
                          </Typography>
                        )}

                        {!isPaused && !isSkipped && (
                          <Button
                            size="small"
                            variant={isPaid ? "text" : "outlined"}
                            disabled={registerPaymentPending}
                            onClick={() =>
                              onOpenPay({
                                ...it,
                                periodKey: it.periodKey || selected.key,
                              })
                            }
                          >
                            {isPaid ? "Rediger betaling" : "Registrer betalt"}
                          </Button>
                        )}

                        {/* ✅ Change terms from this month */}
                        {!isPaused && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onOpenTerms(it, selected.key)}
                          >
                            Endre pris fra denne måneden
                          </Button>
                        )}

                        {/* ✅ Pause / edit pause / unpause */}
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
                            {pauseRange && (
                              <Typography variant="caption" color="text.secondary" noWrap>
                                Pauset: {pauseRange.from} → {pauseRange.to}
                              </Typography>
                            )}

                            <Stack direction="row" spacing={1}>
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
                                Opphev
                              </Button>
                            </Stack>
                          </>
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
                          {typeLabel} {" • "} {dueShortLabel(it.dueDate)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider sx={{ opacity: 0.4 }} />
                </Fragment>
              );
            })}
          </List>

          {registerPaymentError && (
            <Typography color="error" sx={{ mt: 1 }}>
              Kunne ikke lagre endringene.
            </Typography>
          )}
        </>
      )}
    </Drawer>
  );
}

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
  registerPaymentError: PropTypes.string,
  formatCurrency: PropTypes.func.isRequired,
};

export default memo(MonthDrawer);

