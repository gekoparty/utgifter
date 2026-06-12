import { buildApiUrl, requestJson } from "../../../api/httpClient";

const base = "/api/mortgages";

export const mortgageApi = {
  getPlan: ({ mortgageId, from, months = 360 }) => {
    const url = buildApiUrl(`${base}/${mortgageId}/plan`);
    url.searchParams.set("from", from);
    url.searchParams.set("months", String(months));
    return requestJson(url);
  },

  simulate: ({ mortgageId, from, months = 360, scenario }) =>
    requestJson(`${base}/${mortgageId}/simulate`, {
      method: "POST",
      data: { from, months, scenario },
    }),

  hardDelete: ({ mortgageId }) =>
    requestJson(`${base}/${mortgageId}/hard`, { method: "DELETE" }),

  purgeAllMortgages: () =>
    requestJson(`${base}/purge-all`, {
      method: "DELETE",
      headers: { "x-confirm-purge": "PURGE" },
    }),
};
