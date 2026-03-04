// src/components/Charts/ProductPriceChart/echarts/useEChartEvents.js
import { useMemo } from "react";

export function useEChartEvents({ mode, setHiddenSeries, setHighlightSeries }) {
  return useMemo(() => {
    if (mode !== "shops" && mode !== "yearly") return undefined;

    return {
      legendselectchanged: (e) => {
        setHiddenSeries(() => {
          const next = new Set();
          Object.entries(e.selected || {}).forEach(([name, isSelected]) => {
            if (!isSelected) next.add(name);
          });
          return next;
        });
      },
      legendmouseover: (e) => setHighlightSeries(e.name),
      legendmouseout: () => setHighlightSeries(null),
    };
  }, [mode, setHiddenSeries, setHighlightSeries]);
}
