import React, { useMemo } from "react";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";

import { buildApiUrl, requestJson } from "../../../../api/httpClient";
import { transformExpenseData } from "../../../../features/Expenses/utils/expenseTransform";
import DecisionLabel from "../../../commons/DataDisplay/DecisionLabel";

const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
  maximumFractionDigits: 2,
});

const monthRange = (month) => {
  const parsed = dayjs(`${month}-01`);
  if (!parsed.isValid()) return null;
  return [parsed.startOf("month").format("YYYY-MM-DD"), parsed.endOf("month").format("YYYY-MM-DD")];
};

const monthLabel = (month) => {
  const parsed = dayjs(`${month}-01`);
  return parsed.isValid() ? parsed.format("MMMM YYYY") : "Valgt periode";
};

const expenseFilterIdByKind = {
  category: "category",
  shops: "shopName",
  brands: "brandName",
  locations: "locationName",
};

const buildExpensesUrl = (drilldown) => {
  const url = buildApiUrl("/api/expenses");
  const filters = [];
  const range = monthRange(drilldown?.month);

  if (range) filters.push({ id: "purchaseDate", value: range });

  const filterId = drilldown?.filterId || expenseFilterIdByKind[drilldown?.type] || null;
  const filterValue = drilldown?.filterValue || drilldown?.row?.name || drilldown?.name || "";

  if (filterId && filterValue) filters.push({ id: filterId, value: filterValue });

  url.searchParams.set("start", "0");
  url.searchParams.set("size", "25");
  url.searchParams.set("sorting", JSON.stringify([{ id: "purchaseDate", desc: true }]));
  url.searchParams.set("columnFilters", JSON.stringify(filters));
  url.searchParams.set("globalFilter", "");
  return url;
};

const monthDistance = (month) => {
  const target = dayjs(`${month}-01`);
  if (!target.isValid()) return { pastMonths: 12, months: 12 };
  const current = dayjs().startOf("month");
  const diff = target.diff(current, "month");
  return {
    pastMonths: Math.max(12, Math.abs(Math.min(diff, 0)) + 2),
    months: Math.max(12, Math.max(diff, 0) + 2),
  };
};

const buildRecurringUrl = (drilldown) => {
  const url = buildApiUrl("/api/recurring-expenses/summary");
  const { pastMonths, months } = monthDistance(drilldown?.month);
  url.searchParams.set("filter", "ALL");
  url.searchParams.set("pastMonths", String(pastMonths));
  url.searchParams.set("months", String(months));
  return url;
};

const useDrilldownData = (open, drilldown) => {
  const isFixedCosts = drilldown?.kind === "fixed-costs";

  return useQuery({
    queryKey: ["stats-drilldown", drilldown],
    enabled: open && Boolean(drilldown),
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      if (isFixedCosts) {
        const summary = await requestJson(buildRecurringUrl(drilldown), { signal });
        const month = (summary?.forecast || []).find((item) => item.key === drilldown.month);
        return { type: "fixed", month };
      }

      const expenses = transformExpenseData(await requestJson(buildExpensesUrl(drilldown), { signal }));
      return { type: "expenses", expenses: expenses.expenses, meta: expenses.meta };
    },
  });
};

const expenseTitle = (drilldown) => {
  const name = drilldown?.row?.name || drilldown?.name || drilldown?.filterValue;
  if (drilldown?.type === "shops") return `Kjøp hos ${name}`;
  if (drilldown?.type === "brands") return `Kjøp med ${name}`;
  if (drilldown?.type === "locations") return `Kjøp på ${name}`;
  if (drilldown?.kind === "category") return `Kjøp i ${name}`;
  return "Månedens kjøp";
};

function ExpenseRows({ rows = [] }) {
  if (!rows.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Ingen kjøp funnet for dette utvalget.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {rows.map((expense) => (
        <Box
          key={expense._id}
          sx={{
            p: 1,
            borderRadius: 1.5,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" justifyContent="space-between" spacing={1.5}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={950} noWrap>
                {expense.productName || "Ukjent produkt"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {[expense.shopName, expense.brandName, expense.variantName].filter(Boolean).join(" · ")}
              </Typography>
            </Box>
            <Typography variant="body2" fontWeight={950} sx={{ whiteSpace: "nowrap" }}>
              {NOK.format(Number(expense.finalPrice ?? expense.price ?? 0))}
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">
            {expense.purchaseDateDisplay || expense.purchaseDate || expense.registeredDateDisplay || ""}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

function FixedCostRows({ month }) {
  const items = month?.items || [];
  if (!items.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        Ingen faste kostnader funnet for denne måneden.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {items.map((item) => {
        const paid = item.status === "PAID";
        const skipped = item.status === "SKIPPED";
        const paused = item.status === "PAUSED";
        const amount = Number(item.actual?.amount ?? item.expected?.max ?? 0);
        const statusLabel = paid ? "Betalt" : skipped ? "Hoppet over" : paused ? "Pauset" : "Mangler";
        const statusColor = paid ? "success" : skipped || paused ? "default" : "warning";

        return (
          <Box
            key={`${item.recurringExpenseId}-${item.periodKey}-${item.dueDate}`}
            sx={{
              p: 1,
              borderRadius: 1.5,
              bgcolor: "background.default",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" justifyContent="space-between" spacing={1.5}>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={950} noWrap>
                  {item.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {dayjs(item.dueDate).isValid() ? dayjs(item.dueDate).format("DD. MMM YYYY") : item.periodKey}
                </Typography>
              </Box>
              <Stack alignItems="flex-end" spacing={0.5}>
                <Typography variant="body2" fontWeight={950} sx={{ whiteSpace: "nowrap" }}>
                  {NOK.format(amount)}
                </Typography>
                <Chip
                  size="small"
                  color={statusColor}
                  label={statusLabel}
                  sx={{ height: 22, fontWeight: 850 }}
                />
              </Stack>
            </Stack>
          </Box>
        );
      })}
    </Stack>
  );
}

export default function StatsDrilldownDrawer({ open, drilldown, onClose, onOpenFullView }) {
  const { data, isLoading, isError } = useDrilldownData(open, drilldown);
  const isFixedCosts = drilldown?.kind === "fixed-costs";
  const month = data?.month;
  const expenseRows = data?.expenses || [];
  const expenseTotal = expenseRows.reduce(
    (sum, row) => sum + Number(row.finalPrice ?? row.price ?? 0),
    0,
  );
  const paidCount = (month?.items || []).filter((item) => item.status === "PAID").length;
  const missingCount = (month?.items || []).filter((item) => item.status === "UNPAID").length;

  const title = isFixedCosts ? `Faste kostnader ${monthLabel(drilldown?.month)}` : expenseTitle(drilldown);
  const subtitle = drilldown?.month ? monthLabel(drilldown.month) : "Valgt utvalg";

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 460, md: 520 },
          bgcolor: "background.paper",
        },
      }}
    >
      <Box sx={{ p: 2, display: "grid", gap: 1.5, height: "100%" }}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 1.5,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            {isFixedCosts ? <WarningAmberRoundedIcon /> : <ReceiptLongRoundedIcon />}
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="h6" fontWeight={950} noWrap>
              {title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Lukk">
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        {isLoading ? <LinearProgress /> : null}

        {isError ? (
          <DecisionLabel tone="error" label="Kunne ikke hente drilldown-data" />
        ) : null}

        {!isLoading && !isError ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {isFixedCosts ? (
              <>
                <DecisionLabel tone="success" label={`${paidCount} betalt`} />
                <DecisionLabel
                  tone={missingCount ? "warning" : "success"}
                  label={missingCount ? `${missingCount} mangler` : "Alt er betalt"}
                />
              </>
            ) : (
              <>
                <DecisionLabel tone="info" label={`${data?.meta?.totalRowCount ?? expenseRows.length} kjøp`} />
                <DecisionLabel tone="neutral" label={NOK.format(expenseTotal)} />
              </>
            )}
          </Stack>
        ) : null}

        <Divider />

        <Box sx={{ minHeight: 0, overflow: "auto", pr: 0.5 }}>
          {isFixedCosts ? <FixedCostRows month={month} /> : <ExpenseRows rows={expenseRows} />}
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ pt: 0.5 }}>
          <Button variant="outlined" color="inherit" onClick={onClose} fullWidth>
            Lukk
          </Button>
          <Button
            variant="contained"
            endIcon={<OpenInNewRoundedIcon />}
            onClick={() => onOpenFullView?.(drilldown)}
            fullWidth
          >
            Åpne full visning
          </Button>
        </Stack>
      </Box>
    </Drawer>
  );
}
