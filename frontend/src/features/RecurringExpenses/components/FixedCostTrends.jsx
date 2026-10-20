import React, { useMemo, useState } from "react";
import { Alert, Box, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import dayjs from "dayjs";
import ReactECharts from "echarts-for-react";
import { useRecurringHistory } from "../hooks/useRecurringHistory";
import { useTranslation } from "../../../i18n/useTranslation";

export default function FixedCostTrends() {
  const { language } = useTranslation();
  const en = language === "en";
  const theme = useTheme();
  const [months, setMonths] = useState(12);
  const [group, setGroup] = useState("total");
  const [agreement, setAgreement] = useState("all");
  const [includeExtra, setIncludeExtra] = useState(false);
  const to = dayjs().format("YYYY-MM");
  const from = dayjs().subtract(months - 1, "month").format("YYYY-MM");
  const { data, isLoading, isError } = useRecurringHistory({ from, to });
  const money = new Intl.NumberFormat(en ? "en-GB" : "nb-NO", { style: "currency", currency: "NOK", maximumFractionDigits: 0 });
  const { keys, series } = useMemo(() => {
    const keys = Array.from({ length: months }, (_, i) => dayjs(`${from}-01`).add(i, "month").format("YYYY-MM"));
    const agreements = new Map((data?.agreements || []).map((item) => [String(item._id), item]));
    const typeName = (type) => ({ MORTGAGE: en ? "Mortgages" : "Boliglån", HOUSING: en ? "Mortgages" : "Boliglån", UTILITY: en ? "Utilities / electricity" : "Strøm / forsyning", SUBSCRIPTION: en ? "Subscriptions" : "Abonnementer", INSURANCE: en ? "Insurance" : "Forsikring" }[type] || type);
    const groups = new Map();
    for (const payment of data?.payments || []) {
      if (!includeExtra && (payment.kind === "EXTRA" || payment.status === "EXTRA")) continue;
      const id = String(payment.recurringExpenseId);
      if (agreement !== "all" && id !== agreement) continue;
      const item = agreements.get(id);
      const name = group === "total" ? (en ? "All fixed costs" : "Alle faste kostnader") : group === "type" ? typeName(item?.type || "Annet") : item?.title || (en ? "Deleted agreement" : "Slettet avtale");
      const key = group === "agreement" ? id : name;
      if (!groups.has(key)) groups.set(key, { name, values: new Map() });
      const values = groups.get(key).values;
      values.set(payment.periodKey, (values.get(payment.periodKey) || 0) + Number(payment.amount || 0));
    }
    return { keys, series: [...groups.values()].map(({ name, values }) => ({ name, type: "line", connectNulls: false, showSymbol: true, data: keys.map((key) => values.has(key) ? Math.round(values.get(key) * 100) / 100 : null) })) };
  }, [data, months, from, group, agreement, includeExtra, en]);
  const option = {
    color: ["#4e8cff", "#edaa36", "#21b6a8", "#ed7186", "#ac8bf5", "#88bd44"],
    textStyle: { color: theme.palette.text.secondary },
    tooltip: { trigger: "axis", valueFormatter: (value) => value == null ? "—" : money.format(value) },
    legend: { type: "scroll", bottom: 0, textStyle: { color: theme.palette.text.primary } },
    grid: { left: 70, right: 20, top: 25, bottom: 85 },
    xAxis: { type: "category", data: keys }, yAxis: { type: "value" }, series,
  };
  return <Box sx={{ py: 2, minWidth: 0 }}>
    <Typography variant="h6">{en ? "Fixed costs over time" : "Faste kostnader over tid"}</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{en ? "Actual payments by billing month. Gaps mean no payment registered; the current month may be incomplete." : "Faktisk betalt per regningsmåned. Hull betyr ingen registrert betaling; inneværende måned kan være ufullstendig."}</Typography>
    <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mb: 2 }}>
      <TextField select size="small" label={en ? "Period" : "Periode"} value={months} onChange={(e) => setMonths(Number(e.target.value))}>{[6,12,24,36].map((n) => <MenuItem key={n} value={n}>{n} {en ? "months" : "måneder"}</MenuItem>)}</TextField>
      <TextField select size="small" label={en ? "Show" : "Vis"} value={group} onChange={(e) => setGroup(e.target.value)} sx={{ minWidth: 170 }}>{[["total", en ? "Combined" : "Samlet"], ["type", en ? "By category" : "Per type"], ["agreement", en ? "By agreement" : "Per avtale"]].map(([value,label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
      <TextField select size="small" label={en ? "Agreement" : "Avtale"} value={agreement} onChange={(e) => setAgreement(e.target.value)} sx={{ minWidth: 200, maxWidth: "100%" }}><MenuItem value="all">{en ? "All agreements" : "Alle avtaler"}</MenuItem>{(data?.agreements || []).map((item) => <MenuItem key={item._id} value={String(item._id)}>{item.title}</MenuItem>)}</TextField>
      <FormControlLabel control={<Switch checked={includeExtra} onChange={(e) => setIncludeExtra(e.target.checked)} />} label={en ? "Include extra payments" : "Ta med ekstrabetalinger"} />
    </Stack>
    {isError ? <Alert severity="error">{en ? "Could not load history" : "Kunne ikke laste historikk"}</Alert> : isLoading ? <Typography>{en ? "Loading…" : "Laster…"}</Typography> : !series.length ? <Alert severity="info">{en ? "No registered payments in this period" : "Ingen registrerte betalinger i perioden"}</Alert> : <>
      <ReactECharts option={option} notMerge style={{ height: 380, width: "100%" }} />
      <Box sx={{ overflowX: "auto", mt: 2 }}><Box component="table" sx={{ width: "100%", borderCollapse: "collapse", "& td, & th": { textAlign: "right", p: 1, borderBottom: "1px solid", borderColor: "divider" }, "& td:first-of-type, & th:first-of-type": { textAlign: "left" } }}>
        <thead><tr>{[en ? "Cost" : "Kostnad", en ? "First recorded month" : "Første registrerte måned", en ? "Last recorded month" : "Siste registrerte måned", en ? "Change" : "Endring"].map((label) => <th key={label}>{label}</th>)}</tr></thead>
        <tbody>{series.map((item, index) => { const points = item.data.map((amount, i) => ({ amount, key: keys[i] })).filter((point) => point.amount != null); const first = points[0]; const last = points[points.length - 1]; const diff = last.amount - first.amount; return <tr key={`${item.name}-${index}`}><td>{item.name}</td><td>{first.key}: {money.format(first.amount)}</td><td>{last.key}: {money.format(last.amount)}</td><td>{points.length < 2 ? (en ? "Insufficient history" : "For lite historikk") : `${diff > 0 ? "+" : ""}${money.format(diff)}${first.amount > 0 ? ` (${(diff / first.amount * 100).toFixed(1)}%)` : ""}`}</td></tr>; })}</tbody>
      </Box></Box>
    </>}
  </Box>;
}
