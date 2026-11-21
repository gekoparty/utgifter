import RecurringExpense from "../../models/recurringExpenseSchema.js";
import RecurringPayment from "../../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";
import { daysBetweenDueDates, isMortgageType, pickRecurringTermsForMonth, round2 } from "./scheduleService.js";
import { isExtraPayment, paymentDay, DAY_BASIS } from "../mortgages/paymentTimeline.js";

export const normalizePeriodKey = (value) => {
  const periodKey = String(value || "").trim();
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(periodKey) ? periodKey : null;
};

export const normalizePaymentKind = (value) =>
  String(value || "").toUpperCase() === "EXTRA" ? "EXTRA" : "MAIN";

export const normalizePaymentStatus = ({ kind, status }) =>
  kind === "EXTRA" ? "EXTRA" : String(status || "PAID").toUpperCase();

export const toNonNegativeNumber = (value) => {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.max(0, number) : NaN;
};

export const validatePaymentStatus = ({ kind, status }) =>
  kind === "EXTRA" ? status === "EXTRA" : ["PAID", "PARTIAL", "SKIPPED"].includes(status);

// Replaying transactions makes edits and deletions recalculate every later payment.
export const computeMortgageRemaining = ({ expense, payments, termsArr = [] }) => {
  let balance = Number(expense.initialBalance || expense.remainingBalance || 0);
  const events = payments.filter((payment) => payment.status !== "SKIPPED")
    .map((payment) => ({ ...payment, day: paymentDay(payment.paidDate) }))
    .sort((a, b) => a.day - b.day || Number(isExtraPayment(a)) - Number(isExtraPayment(b)));
  if (!events.length) return round2(balance);

  const firstPeriod = [expense.firstPaymentMonth, ...events.map((event) => event.periodKey)]
    .filter(normalizePeriodKey).sort()[0];
  const { start } = daysBetweenDueDates(firstPeriod, expense.dueDay);
  let cursor = Math.min(Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()), events[0].day);
  let accruedInterest = 0;
  const chargedFees = new Set();
  const rateChanges = termsArr.map((terms) => ({ ...terms, day: paymentDay(terms.fromDate) }))
    .sort((a, b) => a.day - b.day);

  for (const event of events) {
    const boundaries = rateChanges.filter((terms) => terms.day > cursor && terms.day < event.day)
      .map((terms) => terms.day);
    for (const end of [...new Set(boundaries), event.day]) {
      const localDate = new Date(cursor);
      const terms = pickRecurringTermsForMonth({ expense, termsArr, monthStartDate: localDate });
      accruedInterest += balance * Number(terms.interestRate || 0) / 100 *
        ((end - cursor) / 86400000) / DAY_BASIS;
      cursor = end;
    }

    if (isExtraPayment(event)) {
      balance = Math.max(0, balance - Number(event.amount || 0));
      continue;
    }
    const terms = pickRecurringTermsForMonth({ expense, termsArr, monthStartDate: new Date(event.day) });
    const fee = !chargedFees.has(event.periodKey) && terms.hasMonthlyFee ? Number(terms.monthlyFee || 0) : 0;
    chargedFees.add(event.periodKey);
    const available = Math.max(0, Number(event.amount || 0) - fee);
    balance = Math.max(0, balance - Math.max(0, available - accruedInterest));
    accruedInterest = Math.max(0, accruedInterest - available);
  }
  return round2(balance);
};

export const recomputeMortgageBalance = async (recurringExpenseId) => {
  const expense = await RecurringExpense.findById(recurringExpenseId);
  if (!expense || !isMortgageType(expense.type)) return;
  if (!Number(expense.initialBalance) && Number(expense.remainingBalance) > 0) {
    expense.initialBalance = Number(expense.remainingBalance);
  }
  const [payments, termsArr] = await Promise.all([
    RecurringPayment.find({ recurringExpenseId: expense._id }).lean(),
    RecurringTermsHistory.find({ recurringExpenseId: expense._id }).sort({ fromDate: 1 }).lean(),
  ]);
  const remainingBalance = computeMortgageRemaining({ expense, payments, termsArr });
  const updated = await RecurringExpense.findOneAndUpdate(
    { _id: expense._id, __v: expense.__v },
    { $set: { initialBalance: expense.initialBalance, remainingBalance }, $inc: { __v: 1 } },
    { new: true },
  );
  // Another payment may finish its replay while this one is reading history.
  if (!updated) await recomputeMortgageBalance(recurringExpenseId);
};

export const assertRecurringExpenseExists = async (recurringExpenseId) =>
  Boolean(await RecurringExpense.findById(recurringExpenseId).lean());
