const VISIBILITY_STORAGE_KEY = "expensesTable.columnVisibility.v1";

export const readColumnVisibility = (fallback) => {
  try {
    const raw = localStorage.getItem(VISIBILITY_STORAGE_KEY);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fallback;

    return { ...fallback, ...parsed };
  } catch {
    return fallback;
  }
};

export const writeColumnVisibility = (value) => {
  try {
    localStorage.setItem(VISIBILITY_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore localStorage failures.
  }
};
