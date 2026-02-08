import React, { memo, useMemo } from "react";
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
  onOpenPay,
  registerPaymentPending,
  registerPaymentError,
  formatCurrency,
}) {
  const sortedItems = useMemo(() => {
    const items = selected?.items ?? [];
    return items
      .slice()
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  }, [selected?.items]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, p: 2 } }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 1 }}
      >
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
                    : `${formatCurrency(it.expected.min)} – ${formatCurrency(it.expected.max)}`
                  : formatCurrency(0);

              const paidLabel = it.actual
                ? `${formatCurrency(it.actual.amount)} (${new Date(
                    it.actual.paidDate,
                  ).toLocaleDateString("nb-NO")})`
                : null;

              const typeKey = normalizeRecurringType(it.type);
              const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? it.type;

              const key = `${selected.key}-${it.recurringExpenseId}-${String(it.dueDate)}`;

              return (
                <React.Fragment key={key}>
                  <ListItem
                    sx={{
                      px: 1,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "action.hover" },
                      alignItems: "flex-start",
                    }}
                    secondaryAction={
                      <Stack
                        direction="column"
                        alignItems="flex-end"
                        spacing={0.5}
                        sx={{ pt: 0.25 }}
                      >
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
                            disabled={registerPaymentPending}
                            onClick={() => onOpenPay(it)}
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
                          {typeLabel}
                          {" • "}
                          {dueShortLabel(it.dueDate)}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider sx={{ opacity: 0.4 }} />
                </React.Fragment>
              );
            })}
          </List>

          {registerPaymentError && (
            <Typography color="error" sx={{ mt: 1 }}>
              Kunne ikke registrere betaling.
            </Typography>
          )}
        </>
      )}
    </Drawer>
  );
}

export default memo(MonthDrawer);
