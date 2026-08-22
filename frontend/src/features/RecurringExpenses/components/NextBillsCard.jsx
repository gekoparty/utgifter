import React, { memo } from "react";
import {
  Box,
  Button,
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
import { Edit, Event, Paid } from "@mui/icons-material";
import dayjs from "dayjs";
import SectionCard from "../../../components/commons/Layout/SectionCard";
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
    <SectionCard
      title="Betalingskø"
      subtitle="Neste regninger og betalinger som trenger oppfølging."
      action={
        <Chip
          size="small"
          color="primary"
          variant="outlined"
          label={`${nextBills.length} neste`}
          sx={{ fontWeight: 800 }}
        />
      }
      contentSx={{ p: { xs: 1.25, sm: 1.5 } }}
    >
        {nextBills.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Ingen kommende forfall i valgt periode.
          </Typography>
        ) : (
          <TableContainer
            sx={{
              maxHeight: { xs: "none", xl: 620 },
              overflow: "auto",
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 1.5,
            }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Forfall</TableCell>
                  <TableCell>Regning</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Beløp</TableCell>
                  <TableCell align="right">Handling</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {nextBills.map((bill) => {
                  const status = statusMeta(bill.status);
                  const typeKey = normalizeRecurringType(bill.type);
                  const typeLabel = TYPE_META_BY_KEY[typeKey]?.label ?? bill.type;
                  const amount = bill.expected?.max ?? bill.expectedMax ?? 0;
                  const dueDate = dayjs(bill.dueDate);
                  const periodKey =
                    bill.periodKey || (dueDate.isValid() ? dueDate.format("YYYY-MM") : "");
                  const hasPayment = Boolean(bill.actual?.paymentId);
                  const canOpenPay =
                    typeof onOpenPay === "function" &&
                    !["SKIPPED", "PAUSED"].includes(String(bill.status || "").toUpperCase());

                  return (
                    <TableRow key={`${bill.recurringExpenseId}-${String(bill.dueDate)}`} hover>
                      <TableCell sx={{ width: 132 }}>
                        <Typography variant="body2" fontWeight={900}>
                          {dueShortLabel(bill.dueDate)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {periodKey || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          fontWeight={900}
                          sx={{
                            maxWidth: 260,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {bill.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {typeLabel}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={status.label}
                          color={status.color}
                          sx={{ height: 22, fontWeight: 800 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={950}>
                          {formatCurrency(amount)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.75} justifyContent="flex-end">
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
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
    </SectionCard>
  );
}

export default memo(NextBillsCard);
