import React, { memo, useMemo } from "react";
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
import {
  TYPE_META_BY_KEY,
  normalizeRecurringType,
} from "../utils/recurringTypes";
import { formatMonthsLeft } from "../utils/recurringFormatters";

function ExpenseTemplateCard({ expense, onEdit, onDelete, formatCurrency }) {
  const id = expense._id || expense.id;

  // ✅ normalize once
  const typeKey = useMemo(
    () => normalizeRecurringType(expense.type),
    [expense.type],
  );

  // ✅ use normalized type everywhere
  const isMortgage = typeKey === "MORTGAGE";

  // ✅ meta lookup (will also handle HOUSING because it normalizes -> MORTGAGE)
  const meta = TYPE_META_BY_KEY[typeKey];

  const monthlyPayment = Number(expense.amount ?? 0);
  const monthlyFee = Number(expense.monthlyFee ?? 0);

  const monthsLeft = expense?.derived?.monthsLeft ?? null;
  const estInterest = expense?.derived?.estInterest ?? null;
  const estPrincipal = expense?.derived?.estPrincipal ?? null;

  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="flex-start"
          spacing={1}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography fontWeight={900} noWrap>
              {expense.title}
            </Typography>

            <Typography variant="caption" color="text.secondary" noWrap>
              {/* ✅ THIS is where meta?.label ?? expense.type goes */}
              {meta?.label ?? expense.type}
              {isMortgage && expense.mortgageKind
                ? ` • ${expense.mortgageKind}`
                : ""}
              {isMortgage && expense.mortgageHolder
                ? ` • ${expense.mortgageHolder}`
                : ""}
            </Typography>
          </Box>

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            <Button size="small" onClick={() => onEdit(expense)}>
              Rediger
            </Button>
            <Button
              size="small"
              color="error"
              onClick={() => onDelete(expense)}
            >
              Fullfør
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
          (Number(expense.estimateMin) > 0 ||
            Number(expense.estimateMax) > 0) && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Template-estimat: {formatCurrency(expense.estimateMin)} –{" "}
              {formatCurrency(expense.estimateMax)}
            </Typography>
          )}

        {isMortgage && monthsLeft && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Estimert tid igjen: <strong>{formatMonthsLeft(monthsLeft)}</strong>
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
          {expense.dueDay ? `Dag ${expense.dueDay}` : "—"}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default memo(ExpenseTemplateCard);
