// src/components/Charts/ProductPriceChart/echarts/buildOption.js
import dayjs from "dayjs";

export function buildOption({
  mode,
  theme,
  measurementUnit,
  overviewBuckets,
  shopSeriesData,
  distributionBuckets,
  hiddenSeries,
  highlightSeries,

  // ✅ NEW
  yearlySeriesData,
}) {
  const textColor = theme.palette.text.primary;
  const secondaryText = theme.palette.text.secondary;
  const gridLine = theme.palette.divider;

  const base = {
    backgroundColor: "transparent",
    animation: false,
    grid: { left: 60, right: mode === "shops" || mode === "yearly" ? 160 : 40, top: 30, bottom: 60 },
    textStyle: { color: textColor, fontSize: 12 },
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "line" },
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      borderWidth: 1,
      textStyle: { color: textColor },
      extraCssText: "box-shadow: 0 6px 20px rgba(0,0,0,0.15); border-radius: 6px;",
    },
    dataZoom: [
      { type: "inside", xAxisIndex: 0 },
      { type: "slider", xAxisIndex: 0, height: 18, bottom: 10 },
    ],
  };

  if (mode === "overview") {
    const minData = overviewBuckets.map((p) => [p.x, p.min]);
    const rangeData = overviewBuckets.map((p) => [p.x, Math.max(0, p.max - p.min)]);
    const medianData = overviewBuckets.map((p) => [p.x, p.median]);

    return {
      ...base,
      xAxis: {
        type: "time",
        axisLabel: { color: secondaryText },
        axisLine: { lineStyle: { color: gridLine } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: secondaryText },
        axisLine: { lineStyle: { color: gridLine } },
        splitLine: { lineStyle: { color: gridLine, type: "dashed" } },
        name: `Kr per ${measurementUnit}`,
        nameTextStyle: { color: secondaryText },
      },
      tooltip: {
        ...base.tooltip,
        formatter: (params) => {
          const ts = params?.[0]?.value?.[0];
          const dateStr = dayjs(ts).format("DD. MMM YYYY");
          const dayKey = dayjs(ts).format("YYYY-MM-DD");
          const bucket = overviewBuckets.find((b) => b.x === dayKey);

          const median = params.find((x) => x.seriesName === "Median")?.value?.[1];
          const min = bucket?.min;
          const max = bucket?.max;

          return `
            <div>
              <strong>Median (oversikt)</strong><br/>
              ${dateStr}<br/>
              <span style="font-weight:700">${Number(median).toFixed(2)} kr</span> per ${measurementUnit}<br/>
              <span style="color:${secondaryText}">
                Min: ${Number(min).toFixed(2)} / Maks: ${Number(max).toFixed(2)}
              </span>
            </div>
          `;
        },
      },
      series: [
        { name: "Min", type: "line", stack: "band", data: minData, showSymbol: false, lineStyle: { opacity: 0 }, emphasis: { disabled: true }, tooltip: { show: false } },
        { name: "Range", type: "line", stack: "band", data: rangeData, showSymbol: false, lineStyle: { opacity: 0 }, areaStyle: { opacity: 0.08 }, emphasis: { disabled: true }, tooltip: { show: false } },
        { name: "Median", type: "line", data: medianData, showSymbol: false, lineStyle: { width: 3 } },
      ],
    };
  }

  if (mode === "shops") {
    const legendData = shopSeriesData.map((s) => s.id);

    const selected = {};
    legendData.forEach((name) => {
      selected[name] = !hiddenSeries.has(name);
    });

    return {
      ...base,
      xAxis: {
        type: "time",
        axisLabel: { color: secondaryText },
        axisLine: { lineStyle: { color: gridLine } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: secondaryText },
        axisLine: { lineStyle: { color: gridLine } },
        splitLine: { lineStyle: { color: gridLine, type: "dashed" } },
        name: `Kr per ${measurementUnit}`,
        nameTextStyle: { color: secondaryText },
      },
      legend: {
        type: "scroll",
        orient: "vertical",
        right: 10,
        top: 30,
        bottom: 30,
        textStyle: { color: textColor },
        data: legendData,
        selected,
      },
      tooltip: {
        ...base.tooltip,
        formatter: (params) => {
          const p = Array.isArray(params) ? params[0] : params;
          const dateStr = dayjs(p.value[0]).format("DD. MMM YYYY");
          const y = p.value[1];
          const hasDiscount = !!p.value[2];
          const brand = p.value[3];
          const variant = p.value[4];

          return `
            <div>
              <strong>${p.seriesName}</strong><br/>
              ${dateStr}<br/>
              <span style="font-weight:700">${Number(y).toFixed(2)} kr</span> per ${measurementUnit}<br/>
              <span style="color:${secondaryText}">
                Merke: ${brand ?? "—"}${variant ? ` / Variant: ${variant}` : ""}
              </span>
              ${hasDiscount ? `<div><span style="font-weight:700">Tilbud!</span></div>` : ""}
            </div>
          `;
        },
      },
      series: shopSeriesData.map((s) => {
        const isHighlighted = !!highlightSeries && s.id === highlightSeries;
        const isFaded = !!highlightSeries && s.id !== highlightSeries;

        return {
          name: s.id,
          type: "line",
          data: s.points.map((p) => [p.x, p.y, p.hasDiscount, p.brand, p.variant]),
          showSymbol: false,
          lineStyle: {
            width: isHighlighted ? 3 : 2,
            opacity: isFaded ? 0.18 : 0.95,
          },
          emphasis: { focus: "series" },
        };
      }),
    };
  }

  // ✅ NEW: yearly
  if (mode === "yearly") {
    const legendData = yearlySeriesData.map((s) => s.id);

    const selected = {};
    legendData.forEach((name) => {
      selected[name] = !hiddenSeries.has(name);
    });

    // gather all years across series
    const yearSet = new Set();
    yearlySeriesData.forEach((s) => s.points.forEach((p) => yearSet.add(p.year)));
    const years = [...yearSet].sort((a, b) => Number(a) - Number(b));

    return {
      ...base,
      dataZoom: [], // yearly is usually small; keep clean
      xAxis: {
        type: "category",
        data: years,
        axisLabel: { color: secondaryText },
        axisLine: { lineStyle: { color: gridLine } },
        splitLine: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: secondaryText },
        axisLine: { lineStyle: { color: gridLine } },
        splitLine: { lineStyle: { color: gridLine, type: "dashed" } },
        name: `Kr per ${measurementUnit}`,
        nameTextStyle: { color: secondaryText },
      },
      legend: {
        type: "scroll",
        orient: "vertical",
        right: 10,
        top: 30,
        bottom: 30,
        textStyle: { color: textColor },
        data: legendData,
        selected,
      },
      tooltip: {
        ...base.tooltip,
        formatter: (params) => {
          // params: one per visible series at this year
          if (!Array.isArray(params) || !params.length) return "";
          const year = params[0].axisValue;

          // show best (lowest) first for readability
          const sorted = params
            .slice()
            .sort((a, b) => (a.value?.[1] ?? Infinity) - (b.value?.[1] ?? Infinity))
            .slice(0, 12);

          const rows = sorted
            .map((p) => {
              const avg = p.value?.[1];
              const purchases = p.value?.[2];
              const yoy = p.value?.[3];
              const since = p.value?.[4];

              const fmt = (n) => (typeof n === "number" ? `${n.toFixed(1)}%` : "—");

              return `
                <div style="margin-top:6px">
                  <strong>${p.seriesName}</strong><br/>
                  <span style="font-weight:700">${Number(avg).toFixed(2)} kr</span> per ${measurementUnit}
                  <span style="color:${secondaryText}"> (${purchases ?? 0} kjøp)</span><br/>
                  <span style="color:${secondaryText}">
                    YoY: ${fmt(yoy)} / Siden start: ${fmt(since)}
                  </span>
                </div>
              `;
            })
            .join("");

          return `<div><strong>${year}</strong>${rows}</div>`;
        },
      },
      series: yearlySeriesData.map((s) => {
        const isHighlighted = !!highlightSeries && s.id === highlightSeries;
        const isFaded = !!highlightSeries && s.id !== highlightSeries;

        // map to [year, avg, purchases, yoyPct, sinceStartPct]
        const map = new Map(s.points.map((p) => [p.year, p]));
        const data = years.map((y) => {
          const p = map.get(y);
          if (!p) return [y, null, 0, null, null];
          return [y, p.avg, p.purchases, p.yoyPct, p.sinceStartPct];
        });

        return {
          name: s.id,
          type: "line",
          data,
          connectNulls: true,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: {
            width: isHighlighted ? 3 : 2,
            opacity: isFaded ? 0.18 : 0.95,
          },
          emphasis: { focus: "series" },
        };
      }),
    };
  }

  // distribution
  const cats = distributionBuckets.map((d) => dayjs(d.x).format("MMM YYYY"));
  const boxData = distributionBuckets.map((d) => [d.min, d.q1, d.med, d.q3, d.max]);

  return {
    ...base,
    dataZoom: [],
    xAxis: {
      type: "category",
      data: cats,
      axisLabel: { color: secondaryText },
      axisLine: { lineStyle: { color: gridLine } },
      splitLine: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: secondaryText },
      axisLine: { lineStyle: { color: gridLine } },
      splitLine: { lineStyle: { color: gridLine, type: "dashed" } },
      name: `Kr per ${measurementUnit}`,
      nameTextStyle: { color: secondaryText },
    },
    tooltip: {
      ...base.tooltip,
      trigger: "item",
      formatter: (p) => {
        const idx = p.dataIndex;
        const d = distributionBuckets[idx];
        return `
          <div>
            <strong>Fordeling</strong><br/>
            ${dayjs(d.x).format("MMM YYYY")} (${d.n} obs)<br/>
            <span style="color:${secondaryText}">
              Min: ${d.min.toFixed(2)}<br/>
              Q1: ${d.q1.toFixed(2)}<br/>
              Median: ${d.med.toFixed(2)}<br/>
              Q3: ${d.q3.toFixed(2)}<br/>
              Maks: ${d.max.toFixed(2)}
            </span>
          </div>
        `;
      },
    },
    series: [{ name: "Fordeling", type: "boxplot", data: boxData }],
  };
}