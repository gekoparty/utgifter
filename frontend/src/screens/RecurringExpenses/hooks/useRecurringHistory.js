import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { API_URL } from "../../../components/commons/Consts/constants";

export function useRecurringHistory({ from, to }) {
  return useQuery({
    queryKey: ["recurring-history", from, to],
    queryFn: async () => {
      const url = `${API_URL}/api/recurring-payments/history?from=${from}&to=${to}`;
      const res = await axios.get(url);
      return res.data;
    },
  });
}