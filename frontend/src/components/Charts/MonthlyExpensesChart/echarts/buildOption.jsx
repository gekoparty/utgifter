import { currencyFormatter, compactNOK, pct } from "../utils/format";

export function buildOption({ theme, months, doCompare, selectedYear, compareYear }) {
  const textColor = theme.palette.text.primary;
  const secondaryText = theme.palette.text.secondary;
  const gridLine = theme.palette.divider;

  const xMonths = months.map((m) => m.month);

  const currentSeries = months.map((m) => ({
    value: m.current ?? 0,
    yoyPct: m.yoyPct ?? null,
  }));

  const previousSeries = months.map((m) => ({
    value: m.previous ?? 0,
  }));

  const maxValue = Math.max(
    0,
    ...months.flatMap((m) => (doCompare ? [m.current ?? 0, m.previous ?? 0] : [m.current ?? 0]))
  );

  const yMax = maxValue > 0 ? maxValue * 1.2 : 1000;

  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { left: 80, right: 20, top: 20, bottom: 60 },

    legend: doCompare
      ? {
          bottom: 10,
          textStyle: { color: secondaryText },
          data: [String(compareYear), String(selectedYear)],
        }
      : undefined,

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      borderWidth: 1,
      textStyle: { color: textColor },
      extraCssText: "box-shadow: 0 6px 20px rgba(0,0,0,0.15); border-radius: 8px;",
      formatter: (params) => {
        const monthName = params?.[0]?.axisValue ?? "";
        const lines = [`<div><strong>${monthName}</strong></div>`];

        // show current year first
        const sorted = [...(params || [])].sort((a, b) => {
          if (a.seriesName === String(selectedYear)) return -1;
          if (b.seriesName === String(selectedYear)) return 1;
          return 0;
        });

        sorted.forEach((p) => {
          const v = p?.data?.value ?? p?.value ?? 0;
          const dot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:8px;"></span>`;
          lines.push(
            `<div style="margin-top:6px;">
              <div>${dot}<span style="font-weight:700">${p.seriesName}:</span> ${currencyFormatter(v)}</div>
            </div>`
          );
        });

        // month YoY (already computed by backend)
        if (doCompare) {
          const cur = params.find((p) => p.seriesName === String(selectedYear))?.data?.value ?? 0;
          const prev = params.find((p) => p.seriesName === String(compareYear))?.data?.value ?? 0;

          // Prefer backend yoyPct from currentSeries point
          const curPoint = params.find((p) => p.seriesName === String(selectedYear))?.data;
          const yoy = curPoint?.yoyPct ?? (prev > 0 ? ((cur - prev) / prev) * 100 : null);

          lines.push(
            `<div style="margin-top:8px;color:${secondaryText};font-size:12px;">
              YoY (måned): ${yoy == null ? "—" : pct(yoy)}
            </div>`
          );
        }

        return `<div style="max-width:260px;">${lines.join("")}</div>`;
      },
    },

    xAxis: {
      type: "category",
      data: xMonths,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: gridLine } },
      axisLabel: { color: secondaryText },
    },

    yAxis: {
      type: "value",
      max: yMax,
      axisLabel: { color: secondaryText, formatter: (v) => compactNOK(v) },
      splitLine: { lineStyle: { color: gridLine, type: "dashed" } },
    },

    series: [
      ...(doCompare
        ? [
            {
              name: String(compareYear),
              type: "bar",
              data: previousSeries,
              barMaxWidth: 22,
              itemStyle: {
                color: theme.palette.grey[500],
                borderRadius: [6, 6, 0, 0],
              },
              emphasis: { focus: "series" },
            },
          ]
        : []),
      {
        name: String(selectedYear),
        type: "bar",
        data: currentSeries,
        barMaxWidth: 22,
        itemStyle: {
          color: theme.palette.primary.main,
          borderRadius: [6, 6, 0, 0],
        },
        emphasis: { focus: "series" },
      },
    ],
  };
}
