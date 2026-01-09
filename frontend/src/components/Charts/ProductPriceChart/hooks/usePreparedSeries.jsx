import { useMemo } from "react";
import dayjs from "dayjs";
import _ from "lodash";
import { quantile } from "../utils/stats";
import { toISODate } from "../utils/dates";

export function usePreparedSeries({
  history,
  mode,
  topN,
  visibleShops,
  overviewBucket,
}) {
  const shops = useMemo(() => {
    const counts = _.countBy(history, "shopName");
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [history]);

  const topShops = useMemo(() => shops.slice(0, topN).map((s) => s.name), [shops, topN]);

  const activeShops = useMemo(() => {
    if (mode !== "shops") return [];
    if (visibleShops?.length) return visibleShops;
    return topShops;
  }, [mode, visibleShops, topShops]);

  const sortedHistory = useMemo(() => {
    return history
      .slice()
      .filter((d) => Number.isFinite(d.pricePerUnit) && d.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [history]);

  const overviewBuckets = useMemo(() => {
    if (mode !== "overview" || !sortedHistory.length) return [];
    const grouped = _.groupBy(sortedHistory, (d) =>
      overviewBucket === "month"
        ? dayjs(d.date).startOf("month").format("YYYY-MM-DD")
        : dayjs(d.date).startOf("week").format("YYYY-MM-DD")
    );

    return Object.entries(grouped)
      .map(([bucketDate, items]) => {
        const prices = items
          .map((i) => i.pricePerUnit)
          .filter(Number.isFinite)
          .sort((a, b) => a - b);
        if (!prices.length) return null;

        return {
          x: bucketDate,
          min: prices[0],
          max: prices[prices.length - 1],
          median: quantile(prices, 0.5),
          count: prices.length,
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.x) - new Date(b.x));
  }, [sortedHistory, mode, overviewBucket]);

  const shopSeriesData = useMemo(() => {
    if (mode !== "shops") return [];
    const filtered = sortedHistory.filter((h) => activeShops.includes(h.shopName));
    const groupedByShop = _.groupBy(filtered, "shopName");

    return Object.entries(groupedByShop).map(([shopName, records]) => ({
      id: shopName,
      points: records.map((d) => ({
        x: toISODate(d.date),
        y: d.pricePerUnit,
        hasDiscount: d.hasDiscount,
        brand: d.brandName,
      })),
    }));
  }, [sortedHistory, mode, activeShops]);

  const distributionBuckets = useMemo(() => {
    if (mode !== "distribution" || !sortedHistory.length) return [];
    const grouped = _.groupBy(sortedHistory, (d) =>
      dayjs(d.date).startOf("month").format("YYYY-MM-DD")
    );

    return Object.entries(grouped)
      .map(([monthStart, items]) => {
        const prices = items
          .map((i) => i.pricePerUnit)
          .filter(Number.isFinite)
          .sort((a, b) => a - b);
        if (!prices.length) return null;

        const min = prices[0];
        const max = prices[prices.length - 1];
        const q1 = quantile(prices, 0.25);
        const med = quantile(prices, 0.5);
        const q3 = quantile(prices, 0.75);

        return { x: monthStart, min, q1, med, q3, max, n: prices.length };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(a.x) - new Date(b.x));
  }, [sortedHistory, mode]);

  return {
    shops,
    topShops,
    activeShops,
    sortedHistory,
    overviewBuckets,
    shopSeriesData,
    distributionBuckets,
  };
}
