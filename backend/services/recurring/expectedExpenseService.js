import { isMortgageType, round2 } from "./scheduleService.js";

const MAIN_PAYMENT_STATUSES = new Set(["PAID", "PARTIAL"]);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

const weightedAverage = (samples) => {
  const totalWeight = samples.reduce((sum, sample) => sum + sample.weight, 0);
  if (totalWeight <= 0) return 0;

  return samples.reduce(
    (sum, sample) => sum + sample.amount * sample.weight,
    0,
  ) / totalWeight;
};

const standardDeviation = (values) => {
  if (values.length < 2) return 0;

  const avg = average(values);
  const variance = average(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
};

const parsePeriodKey = (periodKey) => {
  const [year, month] = String(periodKey || "").split("-").map(Number);
  if (!year || !month) return null;
  return { year, month };
};

const monthsBetween = (fromKey, toKey) => {
  const from = parsePeriodKey(fromKey);
  const to = parsePeriodKey(toKey);
  if (!from || !to) return 0;

  return (to.year - from.year) * 12 + (to.month - from.month);
};

const getTemplateRange = (terms) => {
  const fixed = Number(terms.amount ?? 0);
  const min = Number(terms.estimateMin ?? 0);
  const max = Number(terms.estimateMax ?? 0);

  if (min > 0 || max > 0) {
    const normalizedMin = min > 0 ? min : max;
    const normalizedMax = max > 0 ? max : normalizedMin;

    return {
      fixed: 0,
      min: normalizedMin,
      max: Math.max(normalizedMin, normalizedMax),
      midpoint: (normalizedMin + Math.max(normalizedMin, normalizedMax)) / 2,
    };
  }

  return {
    fixed,
    min: fixed,
    max: fixed,
    midpoint: fixed,
  };
};

export const buildPaymentHistoryIndex = (payments = []) => {
  const index = new Map();

  for (const payment of payments) {
    const kind = String(payment.kind || "MAIN").toUpperCase();
    const status = String(payment.status || "").toUpperCase();
    const amount = Number(payment.amount || 0);

    if (kind !== "MAIN") continue;
    if (!MAIN_PAYMENT_STATUSES.has(status)) continue;
    if (!Number.isFinite(amount) || amount <= 0) continue;

    const expenseId = String(payment.recurringExpenseId);
    const periodKey = String(payment.periodKey || "");
    if (!/^\d{4}-\d{2}$/.test(periodKey)) continue;

    if (!index.has(expenseId)) index.set(expenseId, []);
    index.get(expenseId).push({
      periodKey,
      amount,
      paidDate: payment.paidDate,
    });
  }

  for (const [expenseId, rows] of index.entries()) {
    rows.sort((a, b) => a.periodKey.localeCompare(b.periodKey));
    index.set(expenseId, rows);
  }

  return index;
};

export const estimateExpectedExpense = ({
  expense,
  terms,
  periodKey,
  paymentHistoryIndex,
}) => {
  const template = getTemplateRange(terms);

  if (isMortgageType(expense.type)) {
    return {
      fixed: template.fixed,
      min: template.min,
      max: template.max,
      source: "TERMS_HISTORY",
      confidence: 0,
      sampleSize: 0,
    };
  }

  const target = parsePeriodKey(periodKey);
  if (!target) {
    return {
      fixed: template.fixed,
      min: template.min,
      max: template.max,
      source: "TERMS_HISTORY",
      confidence: 0,
      sampleSize: 0,
    };
  }

  const rows = (paymentHistoryIndex.get(String(expense._id)) || [])
    .filter((row) => row.periodKey < periodKey);

  if (!rows.length) {
    return {
      fixed: template.fixed,
      min: template.min,
      max: template.max,
      source: "TERMS_HISTORY",
      confidence: 0,
      sampleSize: 0,
    };
  }

  const recentRows = rows.slice(-6);
  const previousRows = rows.slice(-12, -6);
  const sameMonthRows = rows.filter((row) => {
    const parsed = parsePeriodKey(row.periodKey);
    return parsed?.month === target.month;
  });

  const recentSamples = recentRows.map((row, index) => ({
    amount: row.amount,
    weight: index + 1,
  }));

  const seasonalSamples = sameMonthRows.map((row) => {
    const monthsOld = Math.max(1, monthsBetween(row.periodKey, periodKey));
    return {
      amount: row.amount,
      weight: 1 / Math.max(1, monthsOld / 12),
    };
  });

  const recentAverage = weightedAverage(recentSamples);
  const seasonalAverage = seasonalSamples.length
    ? weightedAverage(seasonalSamples)
    : 0;

  let historyEstimate = recentAverage;
  if (seasonalSamples.length >= 2) {
    historyEstimate = seasonalAverage * 0.85 + recentAverage * 0.15;
  } else if (seasonalSamples.length === 1) {
    historyEstimate = seasonalAverage * 0.45 + recentAverage * 0.55;
  }

  if (previousRows.length >= 3 && recentRows.length >= 3) {
    const previousAverage = average(previousRows.map((row) => row.amount));
    if (previousAverage > 0) {
      const trendRatio = clamp(recentAverage / previousAverage, 0.9, 1.15);
      historyEstimate *= 1 + (trendRatio - 1) * 0.35;
    }
  }

  const confidence = clamp(
    rows.length / 10 + sameMonthRows.length / 10,
    0.15,
    seasonalSamples.length >= 2 ? 0.85 : 0.7,
  );

  const midpoint = template.midpoint > 0
    ? template.midpoint * (1 - confidence) + historyEstimate * confidence
    : historyEstimate;

  const variationSamples = sameMonthRows.length >= 2 ? sameMonthRows : recentRows;
  const amounts = variationSamples.map((row) => row.amount);
  const deviation = standardDeviation(amounts);
  const coefficient = midpoint > 0 ? deviation / midpoint : 0;
  const marginRate = clamp(coefficient || 0.08, 0.08, 0.3);

  const min = round2(Math.max(0, midpoint * (1 - marginRate)));
  const max = round2(Math.max(min, midpoint * (1 + marginRate)));

  return {
    fixed: round2(midpoint),
    min,
    max,
    source: seasonalSamples.length ? "PAYMENT_HISTORY_SEASONAL" : "PAYMENT_HISTORY_RECENT",
    confidence: round2(confidence),
    sampleSize: rows.length,
    seasonalSampleSize: sameMonthRows.length,
  };
};
