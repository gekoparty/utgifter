import * as echarts from "echarts/core";
import { BarChart, BoxplotChart, LineChart, PieChart } from "echarts/charts";
import {
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  BarChart,
  BoxplotChart,
  LineChart,
  PieChart,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const logChartLifecycleError = (operation, error) => {
  if (!import.meta.env.DEV) return;
  console.warn(`ECharts ${operation} skipped after lifecycle error`, error);
};

export const isChartDisposed = (chart) => !chart || chart.isDisposed?.();

export const safeChartCall = (chart, operation, callback) => {
  if (isChartDisposed(chart)) return undefined;

  try {
    return callback(chart);
  } catch (error) {
    logChartLifecycleError(operation, error);
    return undefined;
  }
};

export const safeSetChartOption = (chart, option, settings) =>
  safeChartCall(chart, "setOption", (instance) =>
    instance.setOption(option, settings),
  );

export const safeResizeChart = (chart) =>
  safeChartCall(chart, "resize", (instance) => instance.resize());

export const safeOnChart = (chart, eventName, handler) =>
  safeChartCall(chart, "event attach", (instance) =>
    instance.on(eventName, handler),
  );

export const safeOffChart = (chart, eventName, handler) =>
  safeChartCall(chart, "event detach", (instance) =>
    instance.off(eventName, handler),
  );

export const safeDisposeChart = (chart) =>
  safeChartCall(chart, "dispose", (instance) => instance.dispose());

export { echarts };
