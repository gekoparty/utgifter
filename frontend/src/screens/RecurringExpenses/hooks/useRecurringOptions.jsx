// src/screens/RecurringExpenses/hooks/useRecurringOptions.js
import { useMemo } from "react";

const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const addMonths = (date, n) => new Date(date.getFullYear(), date.getMonth() + n, 1);
const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

export const useRecurringOptions = ({ expenses, filter, now = new Date("2026-02-03") }) => {
  const filtered = useMemo(() => {
    if (filter === "ALL") return expenses ?? [];
    return (expenses ?? []).filter((e) => e.type === filter);
  }, [expenses, filter]);

  const months = useMemo(() => {
    const base = startOfMonth(now);
    return Array.from({ length: 6 }).map((_, i) => addMonths(base, i));
  }, [now]);

  const forecast = useMemo(() => {
    return months.map((m) => {
      const key = monthKey(m);

      const items = filtered.map((e) => {
        const base = e.monthlyPayment ?? e.total ?? 0;
        const est = e.estimate ? { min: e.estimate.min, max: e.estimate.max } : { min: base, max: base };

        const due = new Date(e.dueDate);
        const dueInMonth = new Date(m.getFullYear(), m.getMonth(), Math.min(due.getDate(), 28));

        return { ...e, base, est, dueInMonth };
      });

      const fixedTotal = items.reduce((s, it) => s + (it.monthlyPayment ?? it.total ?? 0), 0);
      const estMin = items.reduce((s, it) => s + (it.est?.min ?? it.base), 0);
      const estMax = items.reduce((s, it) => s + (it.est?.max ?? it.base), 0);

      return { key, date: m, items, fixedTotal, estMin, estMax };
    });
  }, [months, filtered]);

  const nextBills = useMemo(() => {
    return filtered
      .map((e) => ({
        ...e,
        nextDue: new Date(e.dueDate),
        amount: e.monthlyPayment ?? e.total ?? 0,
      }))
      .sort((a, b) => a.nextDue - b.nextDue)
      .slice(0, 8);
  }, [filtered]);

  const selectedMonth = (selectedMonthKey) =>
    forecast.find((m) => m.key === selectedMonthKey) ?? null;

  return {
    filtered,
    forecast,
    nextBills,
    selectedMonth,
  };
};
