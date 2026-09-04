import { requestJson } from "../../../api/httpClient";

const base = "/api/incomes";

export const incomeApi = {
  list: ({ signal } = {}) => requestJson(base, { signal }),
  create: (data) => requestJson(base, { method: "POST", data }),
  update: (id, data) => requestJson(`${base}/${id}`, { method: "PUT", data }),
  delete: (id) => requestJson(`${base}/${id}`, { method: "DELETE" }),
};
