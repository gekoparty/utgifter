import React, { useMemo, useState } from "react";
import { Alert, Box, Button, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import { useRecurringHistory } from "../hooks/useRecurringHistory";
import { RECURRING_TYPES, normalizeRecurringType } from "../utils/recurringTypes";
import { useTranslation } from "../../../i18n/useTranslation";

export default function FixedCostTrends() {
  const { language } = useTranslation();
  const en = language === "en";
  const theme = useTheme();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().subtract(1, "month").format("YYYY-MM"));
  const [months, setMonths] = useState(12);
  const [chartType, setChartType] = useState("bar");
  const [category, setCategory] = useState("all");
  const [group, setGroup] = useState("total");
  const [agreement, setAgreement] = useState("all");
  const [includeExtra, setIncludeExtra] = useState(false);
  const to = dayjs().format("YYYY-MM");
  const from = dayjs().subtract(months - 1, "month").format("YYYY-MM");
  const { data, isLoading, isError } = useRecurringHistory({ from: dayjs(`${from}-01`).subtract(1, "month").format("YYYY-MM"), to });
  const categoryLabels = {
    MORTGAGE: en ? "All mortgages" : "Alle boliglån",
    INSURANCE: en ? "All insurance" : "Alle forsikringer",
    UTILITY: en ? "All utilities" : "All strøm og forsyning",
    SUBSCRIPTION: en ? "All subscriptions" : "Alle abonnementer",
  };
  const filteredAgreements = (data?.agreements || []).filter((item) =>
    category === "all" || normalizeRecurringType(item.type) === category
  );
  const filteredIds = new Set(filteredAgreements.map((item) => String(item._id)));
  const money = new Intl.NumberFormat(en ? "en-GB" : "nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 });
  const { keys, series } = useMemo(() => {
    const keys = Array.from({ length: months }, (_, i) => dayjs(`${from}-01`).add(i, "month").format("YYYY-MM"));
    const agreements = new Map((data?.agreements || []).map((item) => [String(item._id), item]));
    const typeName = (type) => ({ MORTGAGE: en ? "Mortgages" : "Boliglån", HOUSING: en ? "Mortgages" : "Boliglån", UTILITY: en ? "Utilities / electricity" : "Strøm / forsyning", SUBSCRIPTION: en ? "Subscriptions" : "Abonnementer", INSURANCE: en ? "Insurance" : "Forsikring" }[type] || type);
    const groups = new Map();
    for (const payment of data?.payments || []) {
      if (!keys.includes(payment.periodKey) || payment.status === "SKIPPED") continue;
      if (!includeExtra && (payment.kind === "EXTRA" || payment.status === "EXTRA")) continue;
      const id = String(payment.recurringExpenseId);
      if (agreement !== "all" && id !== agreement) continue;
      const item = agreements.get(id);
      if (category !== "all" && normalizeRecurringType(item?.type) !== category) continue;
      const name = group === "total" ? (categoryLabels[category] || (en ? "All fixed costs" : "Alle faste kostnader")) : group === "type" ? typeName(item?.type || "Annet") : item?.title || (en ? "Deleted agreement" : "Slettet avtale");
      const key = group === "agreement" ? id : name;
      if (!groups.has(key)) groups.set(key, { name, values: new Map() });
      const values = groups.get(key).values;
      values.set(payment.periodKey, (values.get(payment.periodKey) || 0) + Number(payment.amount || 0));
    }
    return { keys, series: [...groups.values()].map(({ name, values }) => ({ name, type: chartType, stack: chartType === "bar" ? "paid" : undefined, connectNulls: false, barMaxWidth: 42, data: keys.map((key) => values.has(key) ? Math.round(values.get(key) * 100) / 100 : null) })) };
  }, [data, months, from, group, agreement, includeExtra, en, category, chartType]);
  const monthLabel = (key) => new Intl.DateTimeFormat(en ? "en-GB" : "nb-NO", { month: "short", year: "numeric" }).format(new Date(`${key}-01T12:00:00`));
  const detailMonth = keys.includes(selectedMonth) ? selectedMonth : keys[keys.length - 1];
  const agreementsById = new Map((data?.agreements || []).map((item) => [String(item._id), item]));
  const breakdown = new Map();
  for (const payment of data?.payments || []) {
    if (payment.periodKey !== detailMonth || payment.status === "SKIPPED") continue;
    if (!includeExtra && (payment.kind === "EXTRA" || payment.status === "EXTRA")) continue;
    const id = String(payment.recurringExpenseId);
    if (agreement !== "all" && agreement !== id) continue;
    if (category !== "all" && !filteredIds.has(id)) continue;
    const item = agreementsById.get(id);
    const row = breakdown.get(id) || { id, title: item?.title || (en ? "Deleted agreement" : "Slettet avtale"), amount: 0 };
    row.amount += Number(payment.amount || 0);
    breakdown.set(id, row);
  }
  const detailRows = [...breakdown.values()].sort((a, b) => b.amount - a.amount);
  const detailTotal = detailRows.reduce((sum, row) => sum + row.amount, 0);
  const previousMonth = dayjs(`${detailMonth}-01`).subtract(1, "month").format("YYYY-MM");
  const previousAmounts = new Map();
  for (const payment of data?.payments || []) {
    if (payment.periodKey !== previousMonth || payment.status === "SKIPPED") continue;
    if (!includeExtra && (payment.kind === "EXTRA" || payment.status === "EXTRA")) continue;
    const id = String(payment.recurringExpenseId);
    if (agreement !== "all" && agreement !== id) continue;
    if (category !== "all" && !filteredIds.has(id)) continue;
    previousAmounts.set(id, (previousAmounts.get(id) || 0) + Number(payment.amount || 0));
  }
  const changes = detailRows.filter((row) => previousAmounts.has(row.id)).map((row) => ({
    ...row,
    previous: previousAmounts.get(row.id),
    change: Math.round((row.amount - previousAmounts.get(row.id)) * 100) / 100,
  })).sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  const comparisonBefore = changes.reduce((sum, row) => sum + row.previous, 0);
  const comparisonAfter = changes.reduce((sum, row) => sum + row.amount, 0);
  const difference = Math.round((comparisonAfter - comparisonBefore) * 100) / 100;
  const unmatched = new Set([...breakdown.keys(), ...previousAmounts.keys()]).size - changes.length;
  const signedMoney = (value) => `${value > 0 ? "+" : ""}${money.format(value)}`;
  const percent = comparisonBefore > 0
    ? new Intl.NumberFormat(en ? "en-GB" : "nb-NO", { style: "percent", maximumFractionDigits: 1, signDisplay: "exceptZero" }).format(difference / comparisonBefore)
    : null;
  const changeOption = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: signedMoney },
    grid: { left: 12, right: 80, top: 15, bottom: 30, containLabel: true },
    xAxis: {
      type: "value",
      axisLabel: { color: theme.palette.text.secondary },
      splitLine: { lineStyle: { color: theme.palette.divider } },
    },
    yAxis: {
      type: "category", inverse: true, data: changes.map((row) => row.title),
      axisLabel: { color: theme.palette.text.primary, width: 130, overflow: "truncate" },
    },
    series: [{
      type: "bar", barMaxWidth: 24,
      data: changes.map((row) => ({
        value: row.change,
        itemStyle: { color: row.change > 0 ? theme.palette.warning.main : theme.palette.success.main },
      })),
    }],
  };
  const option = {
    color: ["#4e8cff", "#edaa36", "#21b6a8", "#ed7186", "#ac8bf5", "#88bd44"],
    textStyle: { color: theme.palette.text.secondary },
    tooltip: { trigger: "axis", valueFormatter: (value) => value == null ? "—" : money.format(value) },
    legend: { type: "scroll", bottom: 0, textStyle: { color: theme.palette.text.primary } },
    grid: { left: 70, right: 20, top: 25, bottom: 85 },
    xAxis: { type: "category", data: keys, axisLabel: { color: theme.palette.text.secondary, formatter: (key) => monthLabel(key) } },
    yAxis: { type: "value", axisLabel: { color: theme.palette.text.secondary, formatter: (value) => new Intl.NumberFormat(en ? "en-GB" : "nb-NO", { notation: "compact" }).format(value) }, splitLine: { lineStyle: { color: theme.palette.divider } } }, series,
  };
  return <Box sx={{ py: 2, minWidth: 0 }}>
    <Typography variant="h6">{en ? "Fixed costs over time" : "Faste kostnader over tid"}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{en ? "Recorded payments by billing month. Select a month in the chart to see the agreements behind the total. Missing payments are not included." : "Registrerte betalinger per regningsmåned. Velg en måned i grafen for å se avtalene bak summen. Uregistrerte betalinger er ikke inkludert."}</Typography>
    <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
      <TextField select size="small" label={en ? "Period" : "Periode"} value={months} onChange={(e) => setMonths(Number(e.target.value))}>{[6,12,24,36].map((n) => <MenuItem key={n} value={n}>{n} {en ? "months" : "måneder"}</MenuItem>)}</TextField>
      <TextField select size="small" label={en ? "Show" : "Vis"} value={group} onChange={(e) => { setGroup(e.target.value); setAgreement("all"); }} sx={{ minWidth: 170 }}>{[["total", en ? "Combined" : "Samlet"], ["type", en ? "By category" : "Per type"], ["agreement", en ? "By agreement" : "Per avtale"]].map(([value,label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
      {group === "agreement" && <TextField select size="small" label={en ? "Agreement" : "Avtale"} value={agreement} onChange={(e) => setAgreement(e.target.value)} sx={{ minWidth: 200, maxWidth: "100%" }}><MenuItem value="all">{en ? "All agreements" : "Alle avtaler"}</MenuItem>{filteredAgreements.map((item) => <MenuItem key={item._id} value={String(item._id)}>{item.title}</MenuItem>)}</TextField>}
      <TextField select size="small" label={en ? "Chart" : "Graf"} value={chartType}
        onChange={(event) => setChartType(event.target.value)} sx={{ minWidth: 140 }}>
        <MenuItem value="line">{en ? "Trend line" : "Trendlinje"}</MenuItem>
        <MenuItem value="bar">{en ? "Monthly bars" : "Månedssøyler"}</MenuItem>
      </TextField>
      <FormControlLabel control={<Switch checked={includeExtra} onChange={(e) => setIncludeExtra(e.target.checked)} />} label={en ? "Include extra payments" : "Ta med ekstrabetalinger"} />
    </Stack>
    <Box sx={{ mb: 2 }}>
      <Typography variant="body2" fontWeight={750} sx={{ mb: 1 }}>
        {en ? "Which costs do you want to see?" : "Hvilke kostnader vil du se?"}
      </Typography>
      <Stack direction="row" gap={1} flexWrap="wrap" aria-label={en ? "Category" : "Kategori"}>
        {[{ key: "all" }, ...RECURRING_TYPES].map(({ key }) => (
          <Button key={key} variant={category === key ? "contained" : "outlined"}
            aria-pressed={category === key}
            onClick={() => { setCategory(key); setAgreement("all"); setChartType("line"); }}>
            {categoryLabels[key] || (en ? "All categories" : "Alle kategorier")}
          </Button>
        ))}
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        {categoryLabels[category] || (en ? "All categories" : "Alle kategorier")}
        {" · "}
        {group === "agreement"
          ? (en ? "One line per agreement" : "Én linje per avtale")
          : group === "type"
            ? (en ? "One combined series per category" : "Én samlet serie per kategori")
            : (en ? "One combined total" : "Én samlet sum")}
      </Typography>
    </Box>
    {isError ? <Alert severity="error">{en ? "Could not load history" : "Kunne ikke laste historikk"}</Alert> : isLoading ? <Typography>{en ? "Loading…" : "Laster…"}</Typography> : !series.length ? <Alert severity="info">{en ? "No registered payments in this period" : "Ingen registrerte betalinger i perioden"}</Alert> : <>
      <ReactECharts onEvents={{ click: (event) => { if (keys.includes(event.name)) setSelectedMonth(event.name); } }} option={option} notMerge style={{ height: 380, width: "100%" }} />
      <Box sx={{ mt: 3, p: { xs: 1.5, sm: 2.5 }, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h6">{en ? "What makes up the total?" : "Hva består summen av?"}</Typography>
            <Typography variant="body2" color="text.secondary">{en ? "Recorded payments for the selected billing month" : "Registrerte betalinger for valgt regningsmåned"}</Typography>
          </Box>
          <TextField select size="small" label={en ? "Billing month" : "Regningsmåned"} value={detailMonth} onChange={(event) => setSelectedMonth(event.target.value)} sx={{ minWidth: 190 }}>
            {[...keys].reverse().map((key) => <MenuItem key={key} value={key}>{monthLabel(key)}</MenuItem>)}
          </TextField>
        </Stack>
        {detailMonth === to && <Alert severity="info" sx={{ mb: 2 }}>{en ? "This month is still in progress. The total only includes payments registered so far." : "Måneden pågår. Summen inkluderer bare betalinger som er registrert så langt."}</Alert>}
        <Typography variant="h5" fontWeight={800}>{money.format(detailTotal)}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{monthLabel(detailMonth)} · {detailRows.length} {en ? "agreements with payments" : "avtaler med betaling"}</Typography>
        <Box sx={{ my: 2, p: 2, bgcolor: "action.hover", borderRadius: 2 }}>
          <Typography variant="h6">{en ? "Up or down?" : "Opp eller ned?"}</Typography>
          <Typography variant="body2" color="text.secondary">
            {monthLabel(detailMonth)} {en ? "compared with" : "sammenlignet med"} {monthLabel(previousMonth)}
          </Typography>
          {changes.length ? <>
            <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}
              color={difference > 0 ? "warning.main" : difference < 0 ? "success.main" : "text.primary"}>
              {difference > 0 ? "↑ " : difference < 0 ? "↓ " : "→ "}{signedMoney(difference)}{percent ? ` (${percent})` : ""}
            </Typography>
            <Typography variant="body2">
              {money.format(comparisonBefore)} → {money.format(comparisonAfter)}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {en
                ? `Comparing recorded payments for the same ${changes.length} agreements in both months. Orange means higher payments, green means lower.`
                : `Sammenligner registrerte betalinger for de samme ${changes.length} avtalene i begge måneder. Oransje betyr økning, grønt betyr nedgang.`}
            </Typography>
            {difference === 0 && <Typography variant="body2">{en ? "The combined amount is unchanged." : "Samlet beløp er uendret."}</Typography>}
            <ReactECharts option={changeOption} notMerge style={{ height: Math.max(150, changes.length * 40 + 60), width: "100%" }} />
          </> : <Typography sx={{ mt: 1 }}>{en ? "No agreements have registered payments in both months." : "Ingen avtaler har registrerte betalinger i begge måneder."}</Typography>}
          {unmatched > 0 && <Alert severity="info" sx={{ mt: 1 }}>
            {en
              ? `${unmatched} agreements have payments in only one month and are excluded from the comparison. This can reflect billing intervals, new or ended agreements, or missing registrations.`
              : `${unmatched} avtaler har betaling bare i én måned og er utelatt fra sammenligningen. Det kan skyldes betalingsintervall, nye eller avsluttede avtaler, eller manglende registrering.`}
          </Alert>}
        </Box>
        {detailRows.map((row) => (
          <Box key={row.id} sx={{ py: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
            <Stack direction="row" justifyContent="space-between" spacing={2}>
              <Typography sx={{ overflowWrap: "anywhere", minWidth: 0 }}>{row.title}</Typography>
              <Typography fontWeight={750} sx={{ whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{money.format(row.amount)}</Typography>
            </Stack>
            <Box sx={{ mt: 1, height: 4, bgcolor: "action.hover", borderRadius: 1 }}>
              <Box sx={{ width: `${detailTotal > 0 ? Math.max(0, row.amount / detailTotal * 100) : 0}%`, height: "100%", bgcolor: "primary.main", borderRadius: 1 }} />
            </Box>
          </Box>
        ))}
        {!detailRows.length && <Typography color="text.secondary">{en ? "No payments registered for this selection." : "Ingen betalinger registrert for dette utvalget."}</Typography>}
      </Box>
    </>}
  </Box>;
}
