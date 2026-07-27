const ADD_EXPENSE_DRAFT_KEY = "utgifter:add-expense-draft:v1";
const ADD_EXPENSE_DIALOG_OPEN_KEY = "utgifter:add-expense-dialog-open:v1";

const canUseStorage = () => typeof window !== "undefined" && window.localStorage;

export const readAddExpenseDraft = () => {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(ADD_EXPENSE_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
};

export const writeAddExpenseDraft = (expense) => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(
      ADD_EXPENSE_DRAFT_KEY,
      JSON.stringify({
        ...expense,
        savedAt: new Date().toISOString(),
      }),
    );
  } catch {
    // Draft persistence is best-effort.
  }
};

export const clearAddExpenseDraft = () => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(ADD_EXPENSE_DRAFT_KEY);
  } catch {
    // Draft persistence is best-effort.
  }
};

export const markAddExpenseDialogOpen = () => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(ADD_EXPENSE_DIALOG_OPEN_KEY, "1");
  } catch {
    // Dialog restore is best-effort.
  }
};

export const clearAddExpenseDialogOpen = () => {
  if (!canUseStorage()) return;

  try {
    window.localStorage.removeItem(ADD_EXPENSE_DIALOG_OPEN_KEY);
  } catch {
    // Dialog restore is best-effort.
  }
};

export const shouldRestoreAddExpenseDialog = () => {
  if (!canUseStorage()) return false;

  try {
    return window.localStorage.getItem(ADD_EXPENSE_DIALOG_OPEN_KEY) === "1";
  } catch {
    return false;
  }
};
