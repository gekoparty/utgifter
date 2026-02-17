import React, { memo, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import dayjs from "dayjs";
import { TYPE_META_BY_KEY, normalizeRecurringType } from "../utils/recurringTypes";

const isMortgageType = (t) => t === "MORTGAGE" || t === "HOUSING";
const toPk = (d) => dayjs(d).format("YYYY-MM");

function PauseChip({ p }) {
  const fromPk = toPk(p.from);
  const toPk2 = toPk(p.to);
  const label = fromPk === toPk2 ? `Pauset: ${fromPk}` : `Pauset: ${fromPk} → ${toPk2}`;
  return <Chip size="small" color="info" variant="outlined" label={label} />;
}

PauseChip.propTypes = { p: PropTypes.object.isRequired };

function ExpenseTemplatesSection({
  expenses,
  templates,
  onEdit,
  formatCurrency,

  showFinished,
  onToggleShowFinished,
  onFinish,
  onRestore,

  onOpenTerms,
  onOpenPauseCreate,
  onOpenPauseEdit,
  onUnpause,
}) {
  // raw templates by id (contains pausePeriods + isActive)
  const templateById = useMemo(() => {
    const m = new Map();
    (templates || []).forEach((t) => m.set(String(t._id || t.id), t));
    return m;
  }, [templates]);

  // merge derived "expenses" rows with raw template fields we need
  const rows = useMemo(() => {
    return (expenses || []).map((e) => {
      const raw = templateById.get(String(e._id || e.id)) || e;
      const pauses = Array.isArray(raw.pausePeriods) ? raw.pausePeriods : [];
      const isActive = raw.isActive !== false; // default true
      return { ...e, pausePeriods: pauses, isActive };
    });
  }, [expenses, templateById]);

  const finishedCount = useMemo(
    () => rows.filter((r) => !r.isActive).length,
    [rows]
  );

  const visibleRows = useMemo(() => {
    if (showFinished) return rows;
    return rows.filter((r) => r.isActive);
  }, [rows, showFinished]);

  return (
    <Card>
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          gap={1}
          sx={{ mb: 1.25 }}
        >
          <Typography variant="h6" fontWeight={950}>
            Grunnoppsett
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="body2" color="text.secondary">
              Administrer pause og prisendringer her – historikk beholdes.
            </Typography>

            <Button size="small" variant="outlined" onClick={onToggleShowFinished}>
              {showFinished
                ? "Skjul fullførte"
                : `Vis fullførte${finishedCount ? ` (${finishedCount})` : ""}`}
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 1.5 }} />

        <Box sx={{ display: "grid", gap: 1.25 }}>
          {visibleRows.map((e) => {
            const id = String(e._id || e.id);
            const typeKey = normalizeRecurringType(e.type);
            const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? e.type;

            const amount = Number(e.amount ?? e.monthlyPayment ?? 0);
            const estMin = Number(e.estimateMin ?? e.estimate?.min ?? 0);
            const estMax = Number(e.estimateMax ?? e.estimate?.max ?? 0);

            const showEstimateRange = !isMortgageType(e.type) && (estMin > 0 || estMax > 0);
            const priceLabel = showEstimateRange
              ? `${formatCurrency(estMin)} – ${formatCurrency(Math.max(estMax, estMin))}`
              : formatCurrency(amount);

            const pauses = Array.isArray(e.pausePeriods) ? e.pausePeriods : [];

            return (
              <Card
                key={id}
                variant="outlined"
                sx={{ borderRadius: 2, opacity: e.isActive ? 1 : 0.85 }}
              >
                <CardContent sx={{ py: 1.5 }}>
                  <Stack spacing={1}>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      gap={1}
                    >
                      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                          <Typography fontWeight={900} noWrap sx={{ minWidth: 0 }}>
                            {e.title}
                          </Typography>

                          <Chip size="small" label={typeLabel} variant="outlined" />
                          {!e.isActive && <Chip size="small" color="success" label="Fullført" />}
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          Pris: <strong>{priceLabel}</strong>
                          {e.dueDay ? ` • Forfall: ${e.dueDay}.` : ""}
                          {e.billingIntervalMonths ? ` • Intervall: ${e.billingIntervalMonths} mnd` : ""}
                        </Typography>

                        {isMortgageType(e.type) && (
                          <Typography variant="body2" color="text.secondary">
                            Rente: <strong>{Number(e.interestRate || 0)}%</strong>
                            {" • "}
                            Rest: <strong>{formatCurrency(Number(e.remainingBalance || 0))}</strong>
                          </Typography>
                        )}
                      </Stack>

                     <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
  {e.isActive ? (
    <>
      <Button
        size="small"
        variant="outlined"
        onClick={() => onOpenTerms?.({ ...e, recurringExpenseId: id }, dayjs().format("YYYY-MM"))}
      >
        Endre pris fra måned
      </Button>

      <Button
        size="small"
        color="info"
        variant="outlined"
        onClick={() => onOpenPauseCreate?.({ recurringExpenseId: id, title: e.title }, dayjs().format("YYYY-MM"))}
      >
        Pause
      </Button>

      <Button size="small" onClick={() => onEdit?.(e)}>
        Rediger grunnoppsett
      </Button>

      <Button size="small" color="error" onClick={() => onFinish?.(id)}>
        Fullfør
      </Button>
    </>
  ) : (
    <Button size="small" color="success" variant="outlined" onClick={() => onRestore?.(id)}>
      Gjenåpne
    </Button>
  )}
</Stack>

                    </Stack>

                    {/* pause periods visible + manageable */}
                    {pauses.length > 0 && (
                      <Stack spacing={1}>
                        <Typography variant="caption" color="text.secondary">
                          Pauser
                        </Typography>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {pauses
                            .slice()
                            .sort((a, b) => new Date(a.from) - new Date(b.from))
                            .map((p) => (
                              <PauseChip key={String(p._id)} p={p} />
                            ))}
                        </Stack>

                        <Stack direction="row" spacing={1} flexWrap="wrap">
                          {pauses
                            .slice()
                            .sort((a, b) => new Date(a.from) - new Date(b.from))
                            .map((p) => {
                              const pauseId = String(p._id);
                              const fromPk = toPk(p.from);
                              const toPk2 = toPk(p.to);

                              return (
                                <Stack key={`actions-${pauseId}`} direction="row" spacing={1}>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() =>
                                      onOpenPauseEdit?.(
                                        { recurringExpenseId: id, title: e.title, pauseId },
                                        { from: fromPk, to: toPk2, note: p.note || "" }
                                      )
                                    }
                                    disabled={!e.isActive}
                                  >
                                    Rediger {fromPk}→{toPk2}
                                  </Button>

                                  <Button
                                    size="small"
                                    color="error"
                                    variant="outlined"
                                    onClick={() => onUnpause?.({ recurringExpenseId: id, pauseId })}
                                    disabled={!e.isActive}
                                  >
                                    Opphev
                                  </Button>
                                </Stack>
                              );
                            })}
                        </Stack>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

ExpenseTemplatesSection.propTypes = {
  expenses: PropTypes.array,
  templates: PropTypes.array,
  onEdit: PropTypes.func,
  formatCurrency: PropTypes.func.isRequired,

  showFinished: PropTypes.bool,
  onToggleShowFinished: PropTypes.func,
  onFinish: PropTypes.func,
  onRestore: PropTypes.func,

  onOpenTerms: PropTypes.func,
  onOpenPauseCreate: PropTypes.func,
  onOpenPauseEdit: PropTypes.func,
  onUnpause: PropTypes.func,
};

export default memo(ExpenseTemplatesSection);
