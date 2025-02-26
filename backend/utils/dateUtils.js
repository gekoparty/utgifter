import { format, parse, isValid, parseISO } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";

const TIME_ZONE = "Europe/Oslo";

export function formatDate(date) {
  if (!date) return "";
  const parsedDate = new Date(date);
  return isNaN(parsedDate) ? "" : format(parsedDate, "dd MMMM yyyy");
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

export function convertToUTC(date) {
  if (!date) return null;
  const zonedDate = toZonedTime(new Date(date), TIME_ZONE);
  const startOfDayLocal = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate(), 0, 0, 0, 0);
  const endOfDayLocal = new Date(zonedDate.getFullYear(), zonedDate.getMonth(), zonedDate.getDate(), 23, 59, 59, 999);
  return {
    start: fromZonedTime(startOfDayLocal, TIME_ZONE),
    end: fromZonedTime(endOfDayLocal, TIME_ZONE),
  };
}
