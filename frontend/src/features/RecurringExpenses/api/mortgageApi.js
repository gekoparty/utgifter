// api/mortgageApi.js
import axios from "axios";
import { API_URL } from "../../../components/commons/Consts/constants";

const base = `${API_URL}/api/mortgages`;

export const mortgageApi = {
  getPlan: async ({ mortgageId, from, months = 360 }) => {
    const res = await axios.get(`${base}/${mortgageId}/plan`, {
      params: { from, months },
    });
    return res.data;
  },

  simulate: async ({ mortgageId, from, months = 360, scenario }) => {
    const res = await axios.post(`${base}/${mortgageId}/simulate`, {
      from,
      months,
      scenario,
    });
    return res.data;
  },

  // ✅ hard delete a single mortgage + all its history
  hardDelete: async ({ mortgageId }) => {
    await axios.delete(`${base}/${mortgageId}/hard`);
  },

  // ✅ purge all mortgages (dev/test only)
  purgeAllMortgages: async () => {
    await axios.delete(`${base}/purge-all`, {
      headers: { "x-confirm-purge": "PURGE" },
    });
  },
};