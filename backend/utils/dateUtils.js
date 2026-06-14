import { format, parse, isValid } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

export const TIME_ZONE = "Europe/Oslo";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const parseDateOnlyParts = (value) => {
  if (typeof value !== "string" || !DATE_ONLY_RE.test(value)) return null;

  const [year, month, day] = value.split("-").map(Number);
  if (month < 1 || month > 12) return null;

  const maxDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  if (day < 1 || day > maxDay) return null;

  return { year, month, day };
};

export function formatDate(date) {
  if (!date) return "";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "";
  return format(toZonedTime(parsedDate, TIME_ZONE), "dd MMMM yyyy");
}

export function parseDateInput(value) {
  if (!value) return null;
  const now = new Date();
  
  const formats = ["dd MMMM yyyy", "dd MMMM", "MMMM", "yyyy"];
  for (const fmt of formats) {
    const parsed = parse(value, fmt, new Date());
    if (isValid(parsed)) {
      return fmt === "dd MMMM"
        ? new Date(now.getFullYear(), parsed.getMonth(), parsed.getDate())
        : fmt === "MMMM"
        ? new Date(now.getFullYear(), parsed.getMonth(), 1)
        : fmt === "yyyy"
        ? new Date(parsed.getFullYear(), 0, 1)
        : parsed;
    }
  }
  return null;
}

const localDatePartsToUtc = (year, month, day, endOfDay = false) => {
  const localDate = new Date(
    year,
    month - 1,
    day,
    endOfDay ? 23 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 59 : 0,
    endOfDay ? 999 : 0
  );

  return fromZonedTime(localDate, TIME_ZONE);
};

export function parseDateForStorage(value) {
  if (!value) return null;

  const dateOnly = parseDateOnlyParts(value);
  if (dateOnly) {
    return localDatePartsToUtc(dateOnly.year, dateOnly.month, dateOnly.day);
  }
  if (typeof value === "string" && DATE_ONLY_RE.test(value)) return null;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function convertToUTC(date) {
  if (!date) return null;

  const dateOnly = parseDateOnlyParts(date);
  if (dateOnly) {
    return {
      start: localDatePartsToUtc(dateOnly.year, dateOnly.month, dateOnly.day),
      end: localDatePartsToUtc(dateOnly.year, dateOnly.month, dateOnly.day, true),
    };
  }
  if (typeof date === "string" && DATE_ONLY_RE.test(date)) return null;

  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return null;

  const zonedDate = toZonedTime(parsedDate, TIME_ZONE);
  const startOfDayLocal = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate(), 0, 0, 0, 0);
  const endOfDayLocal = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate(), 23, 59, 59, 999);
  return {
    start: fromZonedTime(startOfDayLocal, TIME_ZONE),
    end: fromZonedTime(endOfDayLocal, TIME_ZONE),
  };
}
