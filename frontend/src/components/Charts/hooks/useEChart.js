import { useEffect, useRef } from "react";
import {
  echarts,
  isChartDisposed,
  safeDisposeChart,
  safeOffChart,
  safeOnChart,
  safeResizeChart,
  safeSetChartOption,
} from "../echartsCore";

const DEFAULT_CHART_SETTINGS = { notMerge: true, lazyUpdate: true };

export default function useEChart({
  option,
  enabled = true,
  events,
  settings = DEFAULT_CHART_SETTINGS,
}) {
  const elementRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element) return undefined;

    const chart = echarts.getInstanceByDom(element) ?? echarts.init(element);
    chartRef.current = chart;

    return () => {
      chartRef.current = null;
      safeDisposeChart(chart);
    };
  }, [enabled]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!enabled || isChartDisposed(chart)) return;

    safeSetChartOption(chart, option, settings);
    requestAnimationFrame(() => safeResizeChart(chart));
  }, [enabled, option, settings]);

  useEffect(() => {
    const chart = chartRef.current;
    if (!enabled || isChartDisposed(chart) || !events) return undefined;

    Object.entries(events).forEach(([eventName, handler]) => {
      if (typeof handler === "function") safeOnChart(chart, eventName, handler);
    });

    return () => {
      Object.entries(events).forEach(([eventName, handler]) => {
        if (typeof handler === "function") safeOffChart(chart, eventName, handler);
      });
    };
  }, [enabled, events]);

  useEffect(() => {
    const element = elementRef.current;
    if (!enabled || !element || typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(() => safeResizeChart(chartRef.current));
    observer.observe(element);
    return () => observer.disconnect();
  }, [enabled]);

  return { chartRef, elementRef };
}
