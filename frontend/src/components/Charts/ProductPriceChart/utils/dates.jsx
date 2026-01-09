import dayjs from "dayjs";

export function toISODate(d) {
  return dayjs(d).format("YYYY-MM-DD");
}