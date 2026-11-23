import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMortgagePaymentHistory, computeMortgageRemaining, recomputeMortgageBalance } from "../services/recurring/paymentService.js";
import RecurringExpense from "../models/recurringExpenseSchema.js";
import RecurringPayment from "../models/recurringPaymentSchema.js";
import RecurringTermsHistory from "../models/recurringTermsHistorySchema.js";
import { computeMortgageMonth } from "../services/recurring/scheduleService.js";
import { buildMortgagePlan } from "../services/mortgages/planService.js";
import { simulateMortgagePlan } from "../services/mortgages/simulateService.js";
import { buildSummary } from "../routes/recurring/summary.js";
import { parseDateForStorage } from "../utils/dateUtils.js";
import { billStatus, isOpenBill, remainingBillsTotal } from "../../frontend/src/features/RecurringExpenses/utils/remainingBills.js";

test("overpayments and extra mortgage payments cannot offset other unpaid bills", () => {
  assert.equal(remainingBillsTotal([
    { status: "PAID", expected: { max: 100 }, actual: { amount: 9000 }, extraPaymentTotal: 5000 },
    { status: "UNPAID", expected: { max: 100 } },
    { status: "PARTIAL", expected: { max: 200 }, actual: { amount: 50 } },
    { status: "SKIPPED", expected: { max: 500 } },
    { status: "PAUSED", expected: { max: 500 } },
  ]), 250);
});

const expense = {
  _id: "loan", type: "MORTGAGE", initialBalance: 100000, remainingBalance: 100000,
  interestRate: 12, amount: 2000, dueDay: 20, firstPaymentMonth: "2026-11",
  hasMonthlyFee: false, billingIntervalMonths: 1,
};
const payment = (amount, date, kind = "EXTRA") => ({
  _id: date, recurringExpenseId: "loan", amount, periodKey: date.slice(0, 7),
  paidDate: parseDateForStorage(date), kind, status: kind === "EXTRA" ? "EXTRA" : "PAID",
});
const extras = [payment(5000, "2026-11-01"), payment(5000, "2026-11-15")];
const expectedInterest = Math.round((100000 * 12 + 95000 * 14 + 90000 * 5) * .12 / 365 * 100) / 100;

test("separate extra payments reduce interest from their own calendar days", () => {
  const { schedule } = computeMortgageMonth({
    periodKey: "2026-11", dueDay: 20, balanceStart: 100000,
    nominellRate: 12, paymentTotal: 2000, extraPayments: extras,
  });
  assert.equal(schedule.interest, expectedInterest);
  assert.equal(schedule.extraPrincipal, 10000);
  assert.equal(schedule.balanceEnd, 88000 + expectedInterest);
});

test("balance replay includes extras without a main payment and handles edits/deletions", () => {
  assert.equal(computeMortgageRemaining({ expense, payments: extras }), 90000);
  assert.equal(computeMortgageRemaining({ expense, payments: extras.slice(0, 1) }), 95000);
  const balance = computeMortgageRemaining({
    expense, payments: [...extras, payment(2000, "2026-11-20", "MAIN")],
  });
  assert.equal(balance, 88000 + expectedInterest);
  const later = [payment(5000, "2026-11-15"), payment(5000, "2026-11-18"), payment(2000, "2026-11-20", "MAIN")];
  assert.ok(computeMortgageRemaining({ expense, payments: later }) > balance);
});

test("extra on due date is deducted once and extras after due date affect next period", () => {
  const payments = [payment(1000, "2026-11-20"), payment(500, "2026-11-25")];
  const plan = buildMortgagePlan({ expense, termsArr: [], payments, from: "2026-11", months: 2 });
  assert.equal(plan.schedule[0].schedule.extraPrincipal, 1000);
  assert.equal(plan.schedule[1].schedule.extraPrincipal, 500);
});

test("moving the forecast start preserves historical balance and scenario uses same engine", () => {
  const options = { expense, termsArr: [], payments: extras, from: "2026-11", months: 2 };
  const full = buildMortgagePlan(options);
  const later = buildMortgagePlan({ ...options, from: "2026-12", months: 1 });
  assert.deepEqual(later.schedule[0].schedule, full.schedule[1].schedule);
  assert.deepEqual(simulateMortgagePlan({ ...options, scenario: {} }), full);
  const earlier = buildMortgagePlan({ ...options, from: "2026-10", months: 3 });
  assert.deepEqual(earlier.schedule[0].schedule, full.schedule[0].schedule);
});

test("summary keeps partial payments open and uses dated mortgage interest", () => {
  const result = buildSummary({
    expenses: [expense], paymentsInRange: [...extras, { ...payment(2000, "2026-11-20", "MAIN"), status: "PARTIAL" }],
    timelineStart: new Date(2026, 10, 1), realNow: new Date(2026, 10, 20), months: 1,
  });
  assert.equal(result.forecast[0].items[0].status, "PARTIAL");
  assert.equal(result.forecast[0].items[0].mortgage.schedule.interest, expectedInterest);
});

test("interest counts calendar days across the daylight-saving change", () => {
  const { schedule } = computeMortgageMonth({
    periodKey: "2026-04", dueDay: 20, balanceStart: 100000, nominellRate: 12,
    paymentTotal: 2000, extraPayments: [payment(10000, "2026-03-29")],
  });
  assert.equal(schedule.interest, Math.round((100000 * 9 + 90000 * 22) * .12 / 365 * 100) / 100);
});

test("paying off the principal leaves a zero balance", () => {
  assert.equal(computeMortgageRemaining({ expense, payments: [payment(100000, "2026-11-01")] }), 0);
});

test("a concurrent balance update retries with the newer payment history", async () => {
  const originals = [RecurringExpense.findById, RecurringExpense.findOneAndUpdate,
    RecurringPayment.find, RecurringTermsHistory.find];
  let attempt = 0;
  let saved;
  try {
    RecurringExpense.findById = async () => ({ ...expense, __v: attempt });
    RecurringPayment.find = () => ({ lean: async () => extras.slice(0, attempt + 1) });
    RecurringTermsHistory.find = () => ({ sort: () => ({ lean: async () => [] }) });
    RecurringExpense.findOneAndUpdate = async (filter, update) => {
      assert.equal(filter.__v, attempt);
      if (attempt++ === 0) return null;
      saved = update.$set.remainingBalance;
      return {};
    };
    await recomputeMortgageBalance("loan");
    assert.equal(saved, 90000);
    assert.equal(attempt, 2);
  } finally {
    [RecurringExpense.findById, RecurringExpense.findOneAndUpdate,
      RecurringPayment.find, RecurringTermsHistory.find] = originals;
  }
});

test("payment history exposes the same balance and interest calculation used for repayments", () => {
  const payments = [...extras, payment(2000, "2026-11-20", "MAIN")];
  const history = buildMortgagePaymentHistory({ expense, payments });
  assert.equal(history.entries.length, 3);
  assert.equal(history.entries[0].balanceBefore, 100000);
  assert.equal(history.entries[0].balanceAfter, 95000);
  assert.equal(history.entries[1].balanceBefore, 95000);
  assert.equal(history.entries[1].balanceAfter, 90000);
  assert.equal(history.entries[2].interestPaid, expectedInterest);
  assert.equal(history.entries[2].balanceAfter, history.remainingBalance);
  assert.equal(history.remainingBalance, computeMortgageRemaining({ expense, payments }));
  assert.equal(history.entries[0].interestSegments[0].from, "2026-10-20");
  assert.equal(history.entries[0].interestSegments[0].to, "2026-11-01");
});

test("history breaks interest into segments at a rate change", () => {
  const history = buildMortgagePaymentHistory({
    expense, payments: [payment(2000, "2026-11-20", "MAIN")],
    termsArr: [{ fromDate: parseDateForStorage("2026-11-10"), interestRate: 6 }],
  });
  assert.deepEqual(history.entries[0].interestSegments.map(({ days, rate }) => [days, rate]), [[21, 12], [10, 6]]);
});

test("partial payments stay open and due-today bills are not overdue", () => {
  const item = { status: "PARTIAL", dueDate: parseDateForStorage("2026-11-20") };
  assert.equal(isOpenBill(item), true);
  assert.equal(billStatus(item, parseDateForStorage("2026-11-20")), "PARTIAL");
  assert.equal(billStatus(item, parseDateForStorage("2026-11-21")), "OVERDUE");
  assert.equal(billStatus({ ...item, status: "PAID" }, parseDateForStorage("2026-11-21")), "PAID");
});
