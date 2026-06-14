import React, { memo } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { Edit, Event, Paid } from "@mui/icons-material";
import dayjs from "dayjs";
import { TYPE_META_BY_KEY, normalizeRecurringType } from "../utils/recurringTypes";
import { dueShortLabel } from "../utils/recurringFormatters";

const statusMeta = (status) => {
  const normalized = String(status || "").toUpperCase();
  if (normalized === "PAID") return { label: "Betalt", color: "success" };
  if (normalized === "SKIPPED") return { label: "Hoppet over", color: "default" };
  return { label: "Mangler", color: "warning" };
};

function NextBillsCard({
  nextBills = [],
  formatCurrency,
  onOpenPay,
  onOpenMonth,
  pending = false,
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2.25 } }}>
        <Stack
          direction="row"
          spacing={1.25}
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 1.5 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={950}>
              Betalingskø
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Neste regninger og betalinger som trenger oppfølging.
            </Typography>
          </Box>

          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={`${nextBills.length} neste`}
            sx={{ fontWeight: 800 }}
          />
        </Stack>

        {nextBills.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Ingen kommende forfall i valgt periode.
          </Typography>
        ) : (
          <Stack
            divider={<Divider flexItem sx={{ opacity: 0.6 }} />}
            sx={{
              maxHeight: { xs: "none", xl: 560 },
              overflow: { xs: "visible", xl: "auto" },
              pr: { xl: 0.5 },
            }}
          >
            {nextBills.map((bill) => {
              const status = statusMeta(bill.status);
              const typeKey = normalizeRecurringType(bill.type);
              const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? bill.type;
              const amount = bill.expected?.max ?? bill.expectedMax ?? 0;
              const dueDate = dayjs(bill.dueDate);
              const periodKey = bill.periodKey || (dueDate.isValid() ? dueDate.format("YYYY-MM") : "");
              const dueDay = dueDate.isValid() ? dueDate.format("D") : "";
              const dueMonth = dueDate.isValid()
                ? new Date(bill.dueDate).toLocaleDateString("nb-NO", { month: "short" })
                : "";
              const hasPayment = Boolean(bill.actual?.paymentId);
              const canOpenPay =
                typeof onOpenPay === "function" &&
                !["SKIPPED", "PAUSED"].includes(String(bill.status || "").toUpperCase());

              return (
                <Box
                  key={`${bill.recurringExpenseId}-${String(bill.dueDate)}`}
                  sx={{
                    py: 1.05,
                    display: "grid",
                    gap: 1.25,
                    gridTemplateColumns: {
                      xs: "56px minmax(0, 1fr)",
                      sm: "56px minmax(0, 1fr) auto",
                    },
                    alignItems: "center",
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      display: "grid",
                      placeItems: "center",
                      bgcolor: "action.selected",
                      border: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    <Box sx={{ textAlign: "center", lineHeight: 1 }}>
                      <Typography fontWeight={950} sx={{ lineHeight: 1 }}>
                        {dueDay}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ textTransform: "uppercase", fontWeight: 800 }}
                      >
                        {dueMonth}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      fontWeight={900}
                      sx={{
                        lineHeight: 1.25,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {bill.title}
                    </Typography>

                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.45 }}>
                      <Chip
                        size="small"
                        label={status.label}
                        color={status.color}
                        sx={{ height: 22, fontWeight: 800 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {typeLabel}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography variant="caption" color="text.secondary">
                        {dueShortLabel(bill.dueDate)}
                      </Typography>
                      <Typography variant="caption" fontWeight={900}>
                        {formatCurrency(amount)}
                      </Typography>
                    </Stack>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={0.75}
                    alignItems="center"
                    justifyContent={{ xs: "flex-start", sm: "flex-end" }}
                    sx={{
                      gridColumn: { xs: "2 / 3", sm: "auto" },
                    }}
                  >
                    {onOpenMonth && (
                      <Tooltip title="Vis måned">
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => onOpenMonth(periodKey)}
                            disabled={!periodKey}
                          >
                            <Event fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    )}

                    {canOpenPay && (
                      <Button
                        size="small"
                        variant={hasPayment ? "outlined" : "contained"}
                        startIcon={hasPayment ? <Edit /> : <Paid />}
                        disabled={pending}
                        onClick={() => onOpenPay({ ...bill, paymentKind: "MAIN" })}
                        sx={{ whiteSpace: "nowrap" }}
                      >
                        {hasPayment ? "Rediger" : "Registrer"}
                      </Button>
                    )}
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(NextBillsCard);
