import React, { memo, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Archive,
  AttachMoney,
  Close,
  Edit,
  PauseCircleOutline,
  Replay,
} from "@mui/icons-material";
import dayjs from "dayjs";
import { TYPE_META_BY_KEY, normalizeRecurringType } from "../utils/recurringTypes";

const isMortgageType = (type) => type === "MORTGAGE" || type === "HOUSING";
const toPeriodKey = (date) => dayjs(date).format("YYYY-MM");

function pauseLabel(pause) {
  const from = toPeriodKey(pause.from);
  const to = toPeriodKey(pause.to);
  return from === to ? `Pause ${from}` : `Pause ${from} - ${to}`;
}

function ActionButton({ title, onClick, color = "default", disabled = false, children }) {
  return (
    <Tooltip title={title}>
      <span>
        <IconButton size="small" color={color} disabled={disabled} onClick={onClick}>
          {children}
        </IconButton>
      </span>
    </Tooltip>
  );
}

ActionButton.propTypes = {
  title: PropTypes.string.isRequired,
  onClick: PropTypes.func,
  color: PropTypes.string,
  disabled: PropTypes.bool,
  children: PropTypes.node,
};

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
  const templateById = useMemo(() => {
    const map = new Map();
    (templates || []).forEach((template) =>
      map.set(String(template._id || template.id), template)
    );
    return map;
  }, [templates]);

  const rows = useMemo(() => {
    return (expenses || []).map((expense) => {
      const raw = templateById.get(String(expense._id || expense.id)) || expense;
      const pausePeriods = Array.isArray(raw.pausePeriods) ? raw.pausePeriods : [];
      const isActive = raw.isActive !== false;
      return { ...expense, pausePeriods, isActive };
    });
  }, [expenses, templateById]);

  const finishedCount = useMemo(
    () => rows.filter((row) => !row.isActive).length,
    [rows],
  );

  const visibleRows = useMemo(() => {
    if (showFinished) return rows;
    return rows.filter((row) => row.isActive);
  }, [rows, showFinished]);

  return (
    <Card>
      <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          gap={1.5}
          sx={{ mb: 1.5 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={950}>
              Avtaler og faste kostnader
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Skann, endre beløp, pause eller avslutt uten å åpne mange kort.
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`${visibleRows.length} vises`}
              sx={{ fontWeight: 800 }}
            />
            <Button size="small" variant="outlined" onClick={onToggleShowFinished}>
              {showFinished
                ? "Skjul avsluttede"
                : `Vis avsluttede${finishedCount ? ` (${finishedCount})` : ""}`}
            </Button>
          </Stack>
        </Stack>

        {visibleRows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Ingen faste kostnader i denne visningen.
          </Typography>
        ) : (
          <TableContainer
            sx={{
              maxHeight: { xs: 620, lg: "calc(100vh - 310px)" },
              overflow: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
            }}
          >
            <Table stickyHeader size="small" sx={{ minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 900 }}>Kostnad</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Beløp</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 900 }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 900 }}>
                    Handlinger
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {visibleRows.map((expense) => {
                  const id = String(expense._id || expense.id);
                  const typeKey = normalizeRecurringType(expense.type);
                  const typeMeta = TYPE_META_BY_KEY[typeKey];
                  const typeLabel = typeMeta?.label ?? expense.type;

                  const amount = Number(expense.amount ?? expense.monthlyPayment ?? 0);
                  const estimateMin = Number(expense.estimateMin ?? expense.estimate?.min ?? 0);
                  const estimateMax = Number(expense.estimateMax ?? expense.estimate?.max ?? 0);
                  const showEstimateRange =
                    !isMortgageType(expense.type) && (estimateMin > 0 || estimateMax > 0);
                  const priceLabel = showEstimateRange
                    ? `${formatCurrency(estimateMin)} - ${formatCurrency(Math.max(estimateMax, estimateMin))}`
                    : formatCurrency(amount);

                  const pauses = Array.isArray(expense.pausePeriods)
                    ? expense.pausePeriods
                        .slice()
                        .sort((a, b) => new Date(a.from) - new Date(b.from))
                    : [];
                  const isMortgage = isMortgageType(expense.type);
                  const isActive = expense.isActive !== false;

                  return (
                    <TableRow
                      key={id}
                      hover
                      sx={{
                        opacity: isActive ? 1 : 0.72,
                        "&:last-child td": { borderBottom: 0 },
                      }}
                    >
                      <TableCell sx={{ minWidth: 260 }}>
                        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                            <Typography fontWeight={900} noWrap sx={{ minWidth: 0 }}>
                              {expense.title}
                            </Typography>
                            <Chip
                              size="small"
                              label={typeLabel}
                              color={typeMeta?.color}
                              variant="outlined"
                              sx={{ fontWeight: 800 }}
                            />
                          </Stack>

                          {isMortgage && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {expense.mortgageHolder || "Lån"}
                              {expense.mortgageKind ? ` - ${expense.mortgageKind}` : ""}
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell sx={{ minWidth: 170 }}>
                        <Typography fontWeight={900}>{priceLabel}</Typography>
                        {isMortgage ? (
                          <Typography variant="caption" color="text.secondary">
                            {Number(expense.interestRate || 0)}% rente
                            {expense.remainingBalance
                              ? ` - ${formatCurrency(Number(expense.remainingBalance || 0))} rest`
                              : ""}
                          </Typography>
                        ) : showEstimateRange ? (
                          <Typography variant="caption" color="text.secondary">
                            Estimat
                          </Typography>
                        ) : null}
                      </TableCell>

                      <TableCell sx={{ minWidth: 155 }}>
                        <Typography variant="body2" fontWeight={800}>
                          {expense.dueDay ? `Dag ${expense.dueDay}` : "Ingen forfall"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {expense.billingIntervalMonths
                            ? `Hver ${expense.billingIntervalMonths}. måned`
                            : "Månedlig"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ minWidth: 230 }}>
                        <Stack spacing={0.75}>
                          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                            <Chip
                              size="small"
                              color={isActive ? "success" : "default"}
                              label={isActive ? "Aktiv" : "Avsluttet"}
                              sx={{ fontWeight: 800 }}
                            />
                            {pauses.length === 0 && (
                              <Chip size="small" variant="outlined" label="Ingen pause" />
                            )}
                          </Stack>

                          {pauses.length > 0 && (
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                              {pauses.map((pause) => {
                                const pauseId = String(pause._id);
                                const from = toPeriodKey(pause.from);
                                const to = toPeriodKey(pause.to);
                                const pausePayload = { from, to, note: pause.note || "" };

                                return (
                                  <Chip
                                    key={pauseId}
                                    size="small"
                                    color="info"
                                    variant="outlined"
                                    label={pauseLabel(pause)}
                                    onClick={
                                      isActive
                                        ? () =>
                                            onOpenPauseEdit?.(
                                              { recurringExpenseId: id, title: expense.title, pauseId },
                                              pausePayload,
                                            )
                                        : undefined
                                    }
                                    onDelete={
                                      isActive
                                        ? () => onUnpause?.({ recurringExpenseId: id, pauseId })
                                        : undefined
                                    }
                                    deleteIcon={<Close />}
                                  />
                                );
                              })}
                            </Stack>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell align="right" sx={{ minWidth: 190 }}>
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {isActive ? (
                            <>
                              <ActionButton
                                title="Endre beløp"
                                onClick={() => onOpenTerms?.({ ...expense, recurringExpenseId: id }, dayjs().format("YYYY-MM"))}
                              >
                                <AttachMoney fontSize="small" />
                              </ActionButton>

                              <ActionButton
                                title="Pause"
                                color="info"
                                onClick={() => onOpenPauseCreate?.({ recurringExpenseId: id, title: expense.title }, dayjs().format("YYYY-MM"))}
                              >
                                <PauseCircleOutline fontSize="small" />
                              </ActionButton>

                              <ActionButton title="Rediger" onClick={() => onEdit?.(expense)}>
                                <Edit fontSize="small" />
                              </ActionButton>

                              <ActionButton
                                title="Avslutt"
                                color="error"
                                onClick={() => onFinish?.(id)}
                              >
                                <Archive fontSize="small" />
                              </ActionButton>
                            </>
                          ) : (
                            <ActionButton
                              title="Gjenåpne"
                              color="success"
                              onClick={() => onRestore?.(id)}
                            >
                              <Replay fontSize="small" />
                            </ActionButton>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
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
