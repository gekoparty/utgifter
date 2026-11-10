import React, { useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, IconButton, InputAdornment,
  Menu, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import AccountBalanceRoundedIcon from "@mui/icons-material/AccountBalanceRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ShieldRoundedIcon from "@mui/icons-material/ShieldRounded";
import SubscriptionsRoundedIcon from "@mui/icons-material/SubscriptionsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import dayjs from "dayjs";
import { useTranslation } from "../../../i18n/useTranslation";
import { RECURRING_TYPES, TYPE_META_BY_KEY, normalizeRecurringType } from "../utils/recurringTypes";

const CATEGORY_ICONS = { MORTGAGE: AccountBalanceRoundedIcon, UTILITY: BoltRoundedIcon, INSURANCE: ShieldRoundedIcon, SUBSCRIPTION: SubscriptionsRoundedIcon };

const toPeriodKey = (date) => dayjs(date).format("YYYY-MM");
const searchText = (value, language) =>
  String(value ?? "").toLocaleLowerCase(language).normalize("NFD").replace(/\p{M}/gu, "").replaceAll("ø", "o");

function AgreementRow({ row, formatCurrency, onEdit, onOpenActions, onOpenPauseEdit, onUnpause, t }) {
  const { expense, type, amount, minimum, hasEstimate, status, pauses } = row;
  const id = String(expense._id || expense.id);
  const CategoryIcon = CATEGORY_ICONS[type] || ReceiptLongRoundedIcon;
  const typeMeta = TYPE_META_BY_KEY[type];
  const typeLabel = typeMeta ? t(`recurring.library.types.${type}`) : expense.type;
  const interval = Number(expense.billingIntervalMonths) || 1;
  const isMortgage = type === "MORTGAGE";
  const loanDetails = [expense.mortgageHolder, expense.mortgageKind].filter(Boolean).join(" · ");
  const price = hasEstimate && minimum !== amount
    ? `${formatCurrency(minimum)} – ${formatCurrency(amount)}`
    : formatCurrency(amount);

  return (
    <Box component="li" sx={{ px: { xs: 1.5, sm: 2.5 }, py: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "background.paper", transition: "border-color 150ms", "&:hover": { borderColor: "primary.main" }, "&:focus-within": { borderColor: "primary.main" } }}>
      <Box sx={{
        display: "grid",
        gridTemplateColumns: { xs: "minmax(0, 1fr) auto", sm: "minmax(0, 1fr) minmax(160px, auto) auto" },
        gap: { xs: 1, sm: 2 },
        alignItems: "center",
      }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
          <Box sx={{
            display: { xs: "none", sm: "grid" }, placeItems: "center", flexShrink: 0,
            width: 40, height: 40, borderRadius: 2, bgcolor: "action.selected",
            color: typeMeta ? `${typeMeta.color}.main` : "text.secondary",
          }}>
            <CategoryIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
            <Typography component="h3" variant="body1" fontWeight={800}>{expense.title}</Typography>
            <Typography variant="body2" color="text.secondary">
              {typeLabel}
              {loanDetails && ` · ${loanDetails}`}
              {expense.dueDay ? ` · ${t("recurring.library.due", { day: expense.dueDay })}` : ""}
            </Typography>
            {isMortgage && (
              <Typography variant="caption" color="text.secondary">
                {t("recurring.library.interest", { rate: Number(expense.interestRate || 0) })}
                {expense.remainingBalance ? ` · ${t("recurring.library.balance", { amount: formatCurrency(expense.remainingBalance) })}` : ""}
              </Typography>
            )}
            {status !== "active" && (
              <Chip size="small" sx={{ mt: 0.5 }} color={status === "paused" ? "warning" : "default"}
                label={t(`recurring.library.${status}`)} />
            )}
          </Box>
        </Stack>

        <Box sx={{ gridColumn: { xs: 1, sm: "auto" }, gridRow: { xs: 2, sm: "auto" } }}>
          <Typography fontWeight={800} sx={{ fontVariantNumeric: "tabular-nums", overflowWrap: "anywhere" }}>{price}</Typography>
          <Typography variant="caption" color="text.secondary">
            {interval === 1 ? t("recurring.library.monthly") : t("recurring.library.interval", { count: interval })}
            {hasEstimate ? ` · ${t("recurring.library.estimate")}` : ""}
          </Typography>
        </Box>

        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ gridColumn: { xs: 2, sm: "auto" }, gridRow: { xs: "1 / 3", sm: "auto" } }}>
          {status !== "finished" && (
            <Button size="small" onClick={() => onEdit(expense)} variant="outlined">
              {t("recurring.library.edit")}
            </Button>
          )}
          <IconButton
            aria-label={t("recurring.library.actionsFor", { title: expense.title })}
            aria-haspopup="menu"
            onClick={(event) => onOpenActions(event.currentTarget, row)}
          >
            <MoreHorizRoundedIcon />
          </IconButton>
        </Stack>
      </Box>

      {pauses.length > 0 && (
        <Box component="details" sx={{ mt: 1, ml: { sm: 7 } }}>
          <Typography component="summary" variant="caption" color="text.secondary" sx={{ cursor: "pointer" }}>
            {t("recurring.library.pausePeriods", { count: pauses.length })}
          </Typography>
          <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 0.75 }}>
            {pauses.map((pause) => {
              const pauseId = String(pause._id);
              const from = toPeriodKey(pause.from);
              const to = toPeriodKey(pause.to);
              const canEdit = status !== "finished";
              return (
                <Chip key={pauseId} size="small" variant="outlined"
                  label={from === to ? from : `${from} – ${to}`}
                  onClick={canEdit ? () => onOpenPauseEdit(
                    { recurringExpenseId: id, title: expense.title, pauseId },
                    { from, to, note: pause.note || "" },
                  ) : undefined}
                  onDelete={canEdit ? () => onUnpause({ recurringExpenseId: id, pauseId }) : undefined}
                />
              );
            })}
          </Stack>
        </Box>
      )}
    </Box>
  );
}

export default function ExpenseTemplatesSection({
  expenses, isLoading, isError, onRetry, onAdd, onEdit, formatCurrency,
  onFinish, onRestore, onOpenTerms, onOpenPauseCreate, onOpenPauseEdit, onUnpause,
}) {
  const { t, language } = useTranslation();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState("current");
  const [sort, setSort] = useState("name");
  const [menu, setMenu] = useState(null);
  const currentPeriod = toPeriodKey(new Date());

  const rows = useMemo(() => expenses.map((expense) => {
    const type = normalizeRecurringType(expense.type);
    const pauses = [...(expense.pausePeriods || [])].sort((a, b) => new Date(a.from) - new Date(b.from));
    const paused = pauses.some(({ from, to }) => toPeriodKey(from) <= currentPeriod && currentPeriod <= toPeriodKey(to));
    const minimum = Number(expense.estimateMin ?? expense.estimate?.min ?? 0);
    const maximum = Number(expense.estimateMax ?? expense.estimate?.max ?? 0);
    const hasEstimate = type !== "MORTGAGE" && (minimum > 0 || maximum > 0);
    return {
      expense, type, pauses, minimum, hasEstimate,
      amount: hasEstimate ? Math.max(minimum, maximum) : Number(expense.amount ?? expense.monthlyPayment ?? 0),
      status: expense.isActive === false ? "finished" : paused ? "paused" : "active",
    };
  }), [expenses, currentPeriod]);

  const visible = useMemo(() => {
    const tokens = searchText(query.trim(), language).split(/\s+/);
    const compareName = (a, b) => a.expense.title.localeCompare(b.expense.title, language);
    return rows.filter((row) => {
      if (status === "current" && row.status === "finished") return false;
      if (status !== "all" && status !== "current" && row.status !== status) return false;
      if (category !== "all" && row.type !== category) return false;
      const { title, mortgageHolder, mortgageKind } = row.expense;
      const typeLabel = TYPE_META_BY_KEY[row.type] ? t(`recurring.library.types.${row.type}`) : row.expense.type;
      const haystack = searchText([title, mortgageHolder, mortgageKind, typeLabel, TYPE_META_BY_KEY[row.type]?.label].join(" "), language);
      return tokens.every((token) => haystack.includes(token));
    }).sort((a, b) => {
      if (sort === "amount") return b.amount - a.amount || compareName(a, b);
      return compareName(a, b);
    });
  }, [rows, query, language, status, category, sort, t]);

  const filtersChanged = Boolean(query || category !== "all" || status !== "current");
  const onlyFinished = rows.length > 0 && rows.every((row) => row.status === "finished");
  const reset = () => {
    setQuery("");
    setCategory("all");
    setStatus("current");
  };
  const selectAction = (action) => {
    setMenu(null);
    action();
  };
  const expense = menu?.row.expense;
  const id = expense && String(expense._id || expense.id);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2.5, minWidth: 0 }}>
      <Stack spacing={2} sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Box>
          <Typography component="h2" variant="h6" fontWeight={850}>{t("recurring.library.title")}</Typography>
          <Typography variant="body2" color="text.secondary">{t("recurring.library.subtitle")}</Typography>
        </Box>
        <Box aria-label={t("recurring.library.category")} sx={{
          display: "grid", gap: 1,
          gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: "repeat(5, minmax(0, 1fr))" },
        }}>
          {[{ key: "all" }, ...RECURRING_TYPES].map(({ key }) => {
            const Icon = CATEGORY_ICONS[key] || ReceiptLongRoundedIcon;
            const count = rows.filter((row) =>
              (key === "all" || row.type === key) &&
              (status === "all" || (status === "current" ? row.status !== "finished" : row.status === status))
            ).length;
            return (
              <Button key={key} onClick={() => setCategory(key)} aria-pressed={category === key}
                variant="outlined" sx={{
                  p: 1.5, textTransform: "none", justifyContent: "flex-start", textAlign: "left",
                  borderRadius: 2, gap: 1.25,
                  gridColumn: { xs: key === "all" ? "1 / -1" : "auto", md: "auto" },
                  borderColor: category === key ? "primary.main" : "divider",
                  bgcolor: category === key ? "action.selected" : "background.paper",
                  color: category === key ? "primary.main" : "text.secondary",
                }}>
                <Icon fontSize="small" />
                <Box>
                  <Typography component="span" variant="body2" fontWeight={750} sx={{ display: "block" }}>
                    {key === "all" ? t("recurring.library.allCategories") : t(`recurring.library.types.${key}`)}
                  </Typography>
                  <Typography component="span" variant="h6" fontWeight={800}>
                    {isLoading || isError ? "–" : count}
                  </Typography>
                </Box>
              </Button>
            );
          })}
        </Box>
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "minmax(230px, 2fr) repeat(2, minmax(150px, 1fr))",
        } }}>
          <TextField
            label={t("recurring.library.search")}
            type="search"
            size="small"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchRoundedIcon fontSize="small" /></InputAdornment> } }}
          />
          <TextField select label={t("recurring.library.status")} size="small" value={status} onChange={(event) => setStatus(event.target.value)}>
            {["current", "active", "paused", "finished", "all"].map((key) => <MenuItem key={key} value={key}>{t(`recurring.library.${key}`)}</MenuItem>)}
          </TextField>
          <TextField select label={t("recurring.library.sort")} size="small" value={sort} onChange={(event) => setSort(event.target.value)} >
            <MenuItem value="name">{t("recurring.library.nameSort")}</MenuItem>
            <MenuItem value="amount">{t("recurring.library.amountSort")}</MenuItem>
          </TextField>
        </Box>
        {!isLoading && !isError && (
          <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} sx={{ minHeight: 30 }}>
            <Typography variant="body2" color="text.secondary" role="status">
              {t("recurring.library.results", { count: visible.length, total: rows.length })}
            </Typography>
            {filtersChanged && <Button size="small" onClick={reset}>{t("recurring.library.reset")}</Button>}
          </Stack>
        )}
      </Stack>

      {isLoading ? (
        <Stack alignItems="center" sx={{ pb: 3 }}>
          <CircularProgress size={24} aria-label={t("recurring.loading")} />
        </Stack>
      ) : isError ? (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }} action={<Button color="inherit" size="small" onClick={onRetry}>{t("recurring.library.retry")}</Button>}>
          {t("recurring.fetchFailed")}
        </Alert>
      ) : visible.length ? (
        <Box component="ul" sx={{ listStyle: "none", px: { xs: 1.5, sm: 2.5 }, pb: 2.5, pt: 0, m: 0, display: "grid", gap: 1 }}>
          {visible.map((row) => (
            <AgreementRow key={row.expense._id || row.expense.id} row={row} t={t}
              formatCurrency={formatCurrency} onEdit={onEdit} onOpenActions={(anchor, row) => setMenu({ anchor, row })}
              onOpenPauseEdit={onOpenPauseEdit} onUnpause={onUnpause} />
          ))}
        </Box>
      ) : (
        <Stack alignItems="center" spacing={1} sx={{ px: 2, py: 4, borderTop: "1px solid", borderColor: "divider", textAlign: "center" }}>
          <ReceiptLongRoundedIcon color="disabled" />
          <Typography fontWeight={800}>
            {t(!rows.length ? "recurring.library.empty" : onlyFinished && !filtersChanged
              ? "recurring.library.noCurrent" : "recurring.library.noMatches")}
          </Typography>
          {onlyFinished && !filtersChanged ? (
            <Button onClick={() => setStatus("finished")}>{t("recurring.library.showFinished")}</Button>
          ) : (
            <Button onClick={rows.length ? reset : onAdd}>
              {t(rows.length ? "recurring.library.reset" : "recurring.add")}
            </Button>
          )}
        </Stack>
      )}

      <Menu anchorEl={menu?.anchor} open={Boolean(menu)} onClose={() => setMenu(null)}>
        {menu?.row.status === "finished" ? (
          <MenuItem onClick={() => selectAction(() => onRestore(id))}>{t("recurring.library.restore")}</MenuItem>
        ) : [
          <MenuItem key="edit" onClick={() => selectAction(() => onEdit(expense))}>{t("recurring.library.edit")}</MenuItem>,
          <MenuItem key="terms" onClick={() => selectAction(() => onOpenTerms({ ...expense, recurringExpenseId: id }, currentPeriod))}>{t("recurring.library.terms")}</MenuItem>,
          <MenuItem key="pause" onClick={() => selectAction(() => onOpenPauseCreate({ recurringExpenseId: id, title: expense.title }, currentPeriod))}>{t("recurring.library.pause")}</MenuItem>,
          <MenuItem key="finish" sx={{ color: "error.main" }} onClick={() => selectAction(() => onFinish(id))}>{t("recurring.library.finish")}</MenuItem>,
        ]}
      </Menu>
    </Paper>
  );
}
