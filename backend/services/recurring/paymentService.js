import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringPayment from "../../models/recurringPaymentSchema.js";

export const normalizePeriodKey = (value) => {
  const periodKey = String(value || "").trim();
  return /^\d{4}-\d{2}$/.test(periodKey) ? periodKey : null;
};

export const normalizePaymentKind = (value) => {
  const kind = String(value || "").toUpperCase();
  return kind === "EXTRA" ? "EXTRA" : "MAIN";
};

export const normalizePaymentStatus = ({ kind, status }) => {
  if (kind === "EXTRA") return "EXTRA";
  return String(status || "PAID").toUpperCase();
};

export const toNonNegativeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, number) : NaN;
};

export const validatePaymentStatus = ({ kind, status }) => {
  if (kind === "EXTRA") return status === "EXTRA";
  return ["PAID", "PARTIAL", "SKIPPED"].includes(status);
};

const computeMortgageRemaining = ({
  initialBalance,
  interestRate,
  monthlyFee,
  mainPayments,
  extraPaymentsByPeriod,
}) => {
  let remaining = toNonNegativeNumber(initialBalance);
  const rate = toNonNegativeNumber(interestRate);
  const fee = toNonNegativeNumber(monthlyFee);

  for (const payment of mainPayments) {
    if (!payment || payment.status === "SKIPPED") continue;

    const paid = toNonNegativeNumber(payment.amount);
    const interest = remaining > 0 ? (remaining * (rate / 100)) / 12 : 0;
    const principal = Math.max(0, paid - fee - interest);

    remaining = Math.max(0, remaining - principal);

    const extra = toNonNegativeNumber(
      extraPaymentsByPeriod.get(String(payment.periodKey)) || 0,
    );

    if (extra > 0) {
      remaining = Math.max(0, remaining - extra);
    }
  }

  return remaining;
};

export const recomputeMortgageBalance = async (recurringExpenseId) => {
  const expense = await RecurringExpense.findById(recurringExpenseId);
  if (!expense || expense.type !== "MORTGAGE") return;

  if (!Number(expense.initialBalance) && Number(expense.remainingBalance) > 0) {
    expense.initialBalance = Number(expense.remainingBalance);
  }

  if (!Number(expense.remainingBalance) && Number(expense.initialBalance) > 0) {
    expense.remainingBalance = Number(expense.initialBalance);
  }

  const payments = await RecurringPayment.find({ recurringExpenseId: expense._id })
    .sort({ periodKey: 1, paidDate: 1, createdAt: 1 })
    .lean();

  const mainPayments = payments.filter(
    (payment) => normalizePaymentKind(payment.kind) === "MAIN",
  );

  const extraPaymentsByPeriod = new Map();
  for (const payment of payments) {
    if (normalizePaymentKind(payment.kind) !== "EXTRA") continue;

    const periodKey = String(payment.periodKey);
    const previousTotal = toNonNegativeNumber(extraPaymentsByPeriod.get(periodKey));
    extraPaymentsByPeriod.set(
      periodKey,
      previousTotal + toNonNegativeNumber(payment.amount),
    );
  }

  expense.remainingBalance = computeMortgageRemaining({
    initialBalance: expense.initialBalance,
    interestRate: expense.interestRate,
    monthlyFee: expense.hasMonthlyFee ? expense.monthlyFee : 0,
    mainPayments,
    extraPaymentsByPeriod,
  });

  await expense.save();
};

export const assertRecurringExpenseExists = async (recurringExpenseId) => {
  const expense = await RecurringExpense.findById(recurringExpenseId).lean();
  return Boolean(expense);
};
