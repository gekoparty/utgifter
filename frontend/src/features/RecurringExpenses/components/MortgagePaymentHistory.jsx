import React, { useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Divider,
  Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "../../../i18n/useTranslation";

export default function MortgagePaymentHistory({ history, mortgage, formatCurrency, onOpenPay, pending }) {
  const { t, language } = useTranslation();
  const [filter, setFilter] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(20);
  const entries = [...(history?.entries || [])].reverse();
  const filtered = entries.filter((entry) => filter === "ALL" || entry.kind === filter);
  const date = new Intl.DateTimeFormat(language === "en" ? "en-GB" : "nb-NO", {
    timeZone: "Europe/Oslo", day: "numeric", month: "short", year: "numeric",
  });
  const formatDate = (value) => date.format(new Date(value));
  const label = (key) => t(`mortgageHistory.${key}`);
  const openPayment = (entry) => onOpenPay?.({
    recurringExpenseId: mortgage._id,
    title: mortgage.title,
    type: mortgage.type,
    periodKey: entry.periodKey,
    paymentKind: entry.kind,
    actual: entry.kind === "MAIN" ? entry : null,
    extraPayment: entry.kind === "EXTRA" ? entry : null,
  });

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1.5}>
        <Box>
          <Typography component="h2" variant="h6" fontWeight={800}>{label("title")}</Typography>
          <Typography variant="body2" color="text.secondary">{label("description")}</Typography>
        </Box>
        <ToggleButtonGroup
          exclusive size="small" value={filter} aria-label={label("filter")}
          onChange={(_, value) => { if (value) { setFilter(value); setVisibleCount(20); } }}
          sx={{ alignSelf: "flex-start" }}
        >
          <ToggleButton value="ALL">{label("all")}</ToggleButton>
          <ToggleButton value="MAIN">{label("main")}</ToggleButton>
          <ToggleButton value="EXTRA">{label("extra")}</ToggleButton>
        </ToggleButtonGroup>
      </Stack>
      {history && (
        <Typography variant="body2" color="text.secondary">
          {label("balance")}{" "}
          <Box component="strong" sx={{ color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
            {formatCurrency(history.remainingBalance)}
          </Box>
        </Typography>
      )}
      {onOpenPay && (
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          {["MAIN", "EXTRA"].map((kind) => (
            <Button key={kind} variant={kind === "MAIN" ? "contained" : "outlined"} size="small" disabled={pending}
              onClick={() => {
                const parts = new Intl.DateTimeFormat("en-CA", {
                  timeZone: "Europe/Oslo", year: "numeric", month: "2-digit",
                }).formatToParts(new Date());
                const part = (type) => parts.find((entry) => entry.type === type).value;
                const periodKey = `${part("year")}-${part("month")}`;
                onOpenPay({
                  recurringExpenseId: mortgage._id, title: mortgage.title, type: mortgage.type,
                  periodKey,
                  actual: kind === "MAIN" ? entries.find((entry) => entry.kind === "MAIN" && entry.periodKey === periodKey) : null,
                  paymentKind: kind, expected: { max: mortgage.amount || 0 },
                });
              }}
            >
              {label(kind === "MAIN" ? "register" : "addExtra")}
            </Button>
          ))}
        </Stack>
      )}
      {!filtered.length && <Typography variant="body2" color="text.secondary">{label("empty")}</Typography>}
      {filtered.slice(0, visibleCount).map((entry) => (
        <Accordion
          key={entry.paymentId} disableGutters elevation={0}
          sx={{ border: "1px solid", borderColor: "divider", borderRadius: "12px !important", "&:before": { display: "none" } }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls={`payment-${entry.paymentId}`} id={`payment-title-${entry.paymentId}`}>
            <Stack spacing={1} sx={{ flex: 1, pr: 1.5, minWidth: 0 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Box>
                  <Typography variant="body2" fontWeight={750}>{formatDate(entry.paidDate)}</Typography>
                  <Chip size="small" variant="outlined" color={entry.kind === "EXTRA" ? "success" : "default"}
                    label={label(entry.kind === "EXTRA" ? "extra" : "main")} sx={{ mt: 0.5 }} />
                </Box>
                <Typography fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{formatCurrency(entry.amount)}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {label("balanceAfter")}{" "}
                <Box component="strong" sx={{ color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
                  {formatCurrency(entry.balanceAfter)}
                </Box>
              </Typography>
            </Stack>
          </AccordionSummary>
          <AccordionDetails id={`payment-${entry.paymentId}`}>
            <Stack spacing={1.5}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                {[
                  ["balanceBefore", entry.balanceBefore], ["principal", entry.principal],
                  ["interestPaid", entry.interestPaid], ["fee", entry.fee],
                ].map(([key, value]) => (
                  <Stack key={key} direction="row" justifyContent="space-between" spacing={1}>
                    <Typography variant="body2" color="text.secondary">{label(key)}</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatCurrency(value)}</Typography>
                  </Stack>
                ))}
              </Box>
              {entry.interestOutstanding > 0 && (
                <Typography variant="body2" color="text.secondary">
                  {label("interestOutstanding")} {formatCurrency(entry.interestOutstanding)}
                </Typography>
              )}
              <Divider />
              <Typography variant="subtitle2">{label("calculation")}</Typography>
              <Typography variant="caption" color="text.secondary">
                {t("mortgageHistory.basis", { days: history.dayBasis })}
              </Typography>
              {entry.interestSegments.length > 0 ? (
                <TableContainer>
                  <Table size="small" aria-label={label("calculation")}>
                    <TableHead><TableRow>
                      {["period", "days", "rate", "balanceBefore", "interest"].map((key, index) => (
                        <TableCell key={key} align={index ? "right" : "left"} sx={{ whiteSpace: "nowrap" }}>{label(key)}</TableCell>
                      ))}
                    </TableRow></TableHead>
                    <TableBody>
                      {entry.interestSegments.map((segment, index) => (
                        <TableRow key={index}>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(segment.from)} – {formatDate(segment.to)}</TableCell>
                          <TableCell align="right">{segment.days}</TableCell>
                          <TableCell align="right">{segment.rate}%</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{formatCurrency(segment.balance)}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>{formatCurrency(segment.interest)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : <Typography variant="body2" color="text.secondary">{label("sameDay")}</Typography>}
              <Typography variant="caption" color="text.secondary">{label("billingPeriod")} {entry.periodKey}</Typography>
              {entry.note && <Typography variant="body2">{entry.note}</Typography>}
              {onOpenPay && (
                <Button size="small" variant="outlined" onClick={() => openPayment(entry)} disabled={pending} sx={{ alignSelf: "flex-start" }}>
                  {t("actions.edit")}
                </Button>
              )}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
      {visibleCount < filtered.length && (
        <Button onClick={() => setVisibleCount((count) => count + 20)} sx={{ alignSelf: "center" }}>{label("more")}</Button>
      )}
    </Stack>
  );
}
