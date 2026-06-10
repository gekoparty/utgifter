import slugify from "slugify";
import RecurringTermsHistory from "../../models/recurringTermsHistorySchema.js";

const clampDueDay = (day, type) => {
  const maxDueDay = type === "MORTGAGE" ? 31 : 28;
  return Math.min(maxDueDay, Math.max(1, Number(day || 1)));
};

const clampMonth = (month) => Math.min(12, Math.max(1, Number(month || 1)));

const clampInterval = (value) =>
  [1, 3, 6, 12].includes(Number(value)) ? Number(value) : 1;

const normalizeFirstPaymentMonth = (value) => {
  const periodKey = String(value || "").trim();
  return /^\d{4}-\d{2}$/.test(periodKey) ? periodKey : "";
};

export const normalizeRecurringExpensePayload = (body = {}) => {
  const type = body.type === "HOUSING" ? "MORTGAGE" : body.type;

  const payload = {
    title: String(body.title ?? "").trim(),
    type,
    dueDay: clampDueDay(body.dueDay, type),
    billingIntervalMonths: clampInterval(body.billingIntervalMonths ?? 1),
    startMonth: clampMonth(body.startMonth ?? new Date().getMonth() + 1),
    amount: Number(body.amount ?? 0),
    estimateMin: Number(body.estimateMin ?? 0),
    estimateMax: Number(body.estimateMax ?? 0),
    mortgageHolder: String(body.mortgageHolder ?? "").trim(),
    mortgageKind: String(body.mortgageKind ?? "").trim(),
    remainingBalance: Number(body.remainingBalance ?? 0),
    interestRate: Number(body.interestRate ?? 0),
    hasMonthlyFee: Boolean(body.hasMonthlyFee),
    monthlyFee: Boolean(body.hasMonthlyFee) ? Number(body.monthlyFee ?? 0) : 0,
    firstPaymentMonth: normalizeFirstPaymentMonth(body.firstPaymentMonth),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    endDate: body.endDate ? new Date(body.endDate) : null,
    startDate: body.startDate ? new Date(body.startDate) : null,
  };

  payload.slug = slugify(payload.title, { lower: true, strict: true });

  if (payload.type !== "MORTGAGE") {
    payload.mortgageHolder = "";
    payload.mortgageKind = "";
    payload.remainingBalance = 0;
    payload.interestRate = 0;
    payload.hasMonthlyFee = false;
    payload.monthlyFee = 0;
    payload.firstPaymentMonth = "";
  } else {
    payload.billingIntervalMonths = 1;
    payload.estimateMin = 0;
    payload.estimateMax = 0;
  }

  return payload;
};

export const createInitialTermsSnapshot = async (expense, now = new Date()) => {
  const fromDate = new Date(now.getFullYear(), now.getMonth(), 1);

  return RecurringTermsHistory.findOneAndUpdate(
    { recurringExpenseId: expense._id, fromDate },
    {
      $set: {
        recurringExpenseId: expense._id,
        fromDate,
        amount: expense.amount,
        estimateMin: expense.estimateMin,
        estimateMax: expense.estimateMax,
        interestRate: expense.interestRate,
        hasMonthlyFee: expense.hasMonthlyFee,
        monthlyFee: expense.monthlyFee,
        remainingBalance: expense.remainingBalance,
        note: "Auto snapshot from create",
      },
    },
    { upsert: true, new: true },
  );
};
