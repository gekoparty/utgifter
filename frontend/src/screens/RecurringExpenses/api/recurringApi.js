import axios from "axios";
import { API_URL } from "../../../components/commons/Consts/constants";

const base = `${API_URL}/api/recurring-expenses`;

export const recurringApi = {
  // ✅ Change price/interest/etc from a given month
  setTermsFromMonth: async (expenseId, payload) => {
    const res = await axios.post(`${base}/${expenseId}/terms`, payload);
    return res.data;
  },

  // ✅ Pause expense in a month range
  createPause: async (expenseId, payload) => {
    const res = await axios.post(`${base}/${expenseId}/pause`, payload);
    return res.data;
  },

  // ✅ Edit pause range/note
  updatePause: async (expenseId, pauseId, payload) => {
    const res = await axios.put(`${base}/${expenseId}/pause/${pauseId}`, payload);
    return res.data;
  },

  // ✅ Remove pause (unpause)
  deletePause: async (expenseId, pauseId) => {
    const res = await axios.delete(`${base}/${expenseId}/pause/${pauseId}`);
    return res.data;
  },
};

