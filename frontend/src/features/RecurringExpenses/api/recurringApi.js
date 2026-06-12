import { requestJson } from "../../../api/httpClient";

const base = "/api/recurring-expenses";

export const recurringApi = {
  setTermsFromMonth: (expenseId, payload) =>
    requestJson(`${base}/${expenseId}/terms`, {
      method: "POST",
      data: payload,
    }),

  purgeAll: () =>
    requestJson(`${base}/purge-all`, {
      method: "DELETE",
      headers: { "x-confirm-purge": "PURGE" },
    }),

  createPause: (expenseId, payload) =>
    requestJson(`${base}/${expenseId}/pause`, {
      method: "POST",
      data: payload,
    }),

  updatePause: (expenseId, pauseId, payload) =>
    requestJson(`${base}/${expenseId}/pause/${pauseId}`, {
      method: "PUT",
      data: payload,
    }),

  archiveExpense: (expenseId) =>
    requestJson(`${base}/${expenseId}/archive`, { method: "POST" }),

  restoreExpense: (expenseId) =>
    requestJson(`${base}/${expenseId}/restore`, { method: "PATCH" }),

  deletePause: (expenseId, pauseId) =>
    requestJson(`${base}/${expenseId}/pause/${pauseId}`, {
      method: "DELETE",
    }),
};
