import { currencyFormatter, compactNOK, pct } from "../utils/format";

export function buildOption({
  theme,
  months,
  doCompare,
  selectedYear,
  compareYear,
  showRecurringCosts = false,
}) {
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

  const incomeSeries = months.map((m) => ({
    value: m.income ?? 0,
    net: m.net ?? 0,
  }));

  const expectedIncomeSeries = months.map((m) => ({
    value: m.expectedIncome ?? 0,
    expectedNet: m.expectedNet ?? 0,
  }));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const isPastMonth = (month) => {
    const yearNumber = Number(selectedYear);
    if (!Number.isFinite(yearNumber)) return false;
    if (yearNumber < currentYear) return true;
    if (yearNumber > currentYear) return false;
    return Number(month.monthIndex ?? 0) < currentMonthIndex;
  };

  const recurringMissingSeries = months.map((m) => ({
    value: isPastMonth(m) ? Number(m.recurringMissing ?? 0) : 0,
    totalExpected: m.recurringExpected ?? 0,
    paid: m.recurringPaid ?? 0,
  }));

  const recurringExpectedSeries = months.map((m) => ({
    value: isPastMonth(m)
      ? 0
      : Math.max(0, Number(m.recurringExpected ?? 0) - Number(m.recurringPaid ?? 0)),
    totalExpected: m.recurringExpected ?? 0,
    paid: m.recurringPaid ?? 0,
  }));

  const recurringPaidSeries = months.map((m) => ({
    value: m.recurringPaid ?? 0,
    totalExpected: m.recurringExpected ?? 0,
  }));

  const maxValue = Math.max(
    0,
    ...months.flatMap((m) =>
      doCompare
        ? [
            m.current ?? 0,
            m.previous ?? 0,
            m.income ?? 0,
            m.expectedIncome ?? 0,
            ...(showRecurringCosts
              ? [
                  (m.current ?? 0) +
                    Number(m.recurringPaid ?? 0) +
                    (isPastMonth(m)
                      ? Number(m.recurringMissing ?? 0)
                      : Math.max(0, Number(m.recurringExpected ?? 0) - Number(m.recurringPaid ?? 0))),
                ]
              : []),
          ]
        : [
            m.current ?? 0,
            m.income ?? 0,
            m.expectedIncome ?? 0,
            ...(showRecurringCosts
              ? [
                  (m.current ?? 0) +
                    Number(m.recurringPaid ?? 0) +
                    (isPastMonth(m)
                      ? Number(m.recurringMissing ?? 0)
                      : Math.max(0, Number(m.recurringExpected ?? 0) - Number(m.recurringPaid ?? 0))),
                ]
              : []),
          ],
    ),
  );
  const hasIncome = months.some((m) => Number(m.income || 0) > 0);
  const hasExpectedIncome = months.some((m) => Number(m.expectedIncome || 0) > 0);
  const hasRecurringCosts =
    showRecurringCosts &&
    months.some((m) => Number(m.recurringExpected || 0) > 0 || Number(m.recurringPaid || 0) > 0);

  const yMax = maxValue > 0 ? maxValue * 1.2 : 1000;

  return {
    backgroundColor: "transparent",
    animation: false,
    grid: { left: 80, right: 20, top: 20, bottom: 60 },

    legend:
      doCompare || hasIncome || hasExpectedIncome || hasRecurringCosts
        ? {
          bottom: 10,
          textStyle: { color: secondaryText },
          data: [
            ...(doCompare ? [String(compareYear)] : []),
            `Utgifter ${selectedYear}`,
            ...(hasIncome ? [`Inntekt ${selectedYear}`] : []),
            ...(hasExpectedIncome ? ["Planlagt inntekt"] : []),
            ...(hasRecurringCosts ? ["Faste betalt", "Faste mangler", "Faste gjenstår"] : []),
          ],
        }
      : undefined,

    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      borderWidth: 1,
      textStyle: { color: textColor },
      extraCssText:
        "box-shadow: 0 6px 20px rgba(0,0,0,0.15); border-radius: 8px;",
      formatter: (params) => {
        const monthName = params?.[0]?.axisValue ?? "";
        const lines = [`<div><strong>${monthName}</strong></div>`];

        const sorted = [...(params || [])].sort((a, b) => {
          if (a.seriesName === `Utgifter ${selectedYear}`) return -1;
          if (b.seriesName === `Utgifter ${selectedYear}`) return 1;
          return 0;
        });

        sorted.forEach((p) => {
          const value = p?.data?.value ?? p?.value ?? 0;
          if (p.seriesName === "Faste gjenstår" && value <= 0) return;
          const dot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${p.color};margin-right:8px;"></span>`;
          lines.push(
            `<div style="margin-top:6px;">
              <div>${dot}<span style="font-weight:700">${p.seriesName}:</span> ${currencyFormatter(value)}</div>
            </div>`,
          );
        });

        const incomePoint = params.find(
          (p) => p.seriesName === `Inntekt ${selectedYear}`,
        )?.data;
        const expensePoint = params.find(
          (p) => p.seriesName === `Utgifter ${selectedYear}`,
        )?.data;
        const expectedPoint = params.find((p) => p.seriesName === "Planlagt inntekt")?.data;
        const recurringPaid = Number(
          params.find((p) => p.seriesName === "Faste betalt")?.data?.value ?? 0,
        );
        const recurringExpectedRemaining = Number(
          params.find((p) => p.seriesName === "Faste gjenstår")?.data?.value ?? 0,
        );
        const recurringMissing = Number(
          params.find((p) => p.seriesName === "Faste mangler")?.data?.value ?? 0,
        );
        const recurringExpectedTotal = Number(
          params.find((p) => p.seriesName === "Faste betalt")?.data?.totalExpected ??
            params.find((p) => p.seriesName === "Faste mangler")?.data?.totalExpected ??
            params.find((p) => p.seriesName === "Faste gjenstår")?.data?.totalExpected ??
            0,
        );
        const totalExpensePressure =
          Number(expensePoint?.value ?? 0) +
          recurringPaid +
          recurringMissing +
          recurringExpectedRemaining;
        const recurringPlannedLine = hasRecurringCosts
          ? `Faste planlagt: ${currencyFormatter(recurringExpectedTotal)}<br/>`
          : "";

        if (incomePoint && expensePoint) {
          lines.push(
            `<div style="margin-top:8px;color:${secondaryText};font-size:12px;">
              ${recurringPlannedLine}
              Synlige utgifter: ${currencyFormatter(totalExpensePressure)}<br/>
              Igjen mot synlige utgifter: ${currencyFormatter((incomePoint.value ?? 0) - totalExpensePressure)}
            </div>`,
          );
        }

        if (!incomePoint && expectedPoint && expensePoint) {
          lines.push(
            `<div style="margin-top:8px;color:${secondaryText};font-size:12px;">
              ${recurringPlannedLine}
              Synlige utgifter: ${currencyFormatter(totalExpensePressure)}<br/>
              Planlagt igjen mot synlige utgifter: ${currencyFormatter((expectedPoint.value ?? 0) - totalExpensePressure)}
            </div>`,
          );
        }

        if (doCompare) {
          const current =
            params.find((p) => p.seriesName === `Utgifter ${selectedYear}`)?.data
              ?.value ?? 0;
          const previous =
            params.find((p) => p.seriesName === String(compareYear))?.data
              ?.value ?? 0;
          const currentPoint = params.find(
            (p) => p.seriesName === `Utgifter ${selectedYear}`,
          )?.data;
          const yoy =
            currentPoint?.yoyPct ??
            (previous > 0 ? ((current - previous) / previous) * 100 : null);

          lines.push(
            `<div style="margin-top:8px;color:${secondaryText};font-size:12px;">
              YoY (måned): ${yoy == null ? "—" : pct(yoy)}
            </div>`,
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
      axisLabel: { color: secondaryText, formatter: (value) => compactNOK(value) },
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
        name: `Utgifter ${selectedYear}`,
        type: "bar",
        data: currentSeries,
        stack: "visibleExpenses",
        barMaxWidth: 22,
        itemStyle: {
          color: theme.palette.primary.main,
          borderRadius: hasRecurringCosts ? [0, 0, 4, 4] : [6, 6, 0, 0],
        },
        emphasis: { focus: "series" },
      },
      ...(hasRecurringCosts
        ? [
            {
              name: "Faste betalt",
              type: "bar",
              stack: "visibleExpenses",
              data: recurringPaidSeries,
              barMaxWidth: 22,
              itemStyle: {
                color: theme.palette.secondary.main,
                borderRadius: [0, 0, 0, 0],
              },
              emphasis: { focus: "series" },
            },
            {
              name: "Faste mangler",
              type: "bar",
              stack: "visibleExpenses",
              data: recurringMissingSeries,
              barMaxWidth: 22,
              itemStyle: {
                color: theme.palette.error.main,
                borderRadius: [6, 6, 0, 0],
              },
              emphasis: { focus: "series" },
            },
            {
              name: "Faste gjenstår",
              type: "bar",
              stack: "visibleExpenses",
              data: recurringExpectedSeries,
              barMaxWidth: 22,
              itemStyle: {
                color: theme.palette.warning.main,
                borderRadius: [6, 6, 0, 0],
              },
              emphasis: { focus: "series" },
            },
          ]
        : []),
      ...(hasIncome
        ? [
            {
              name: `Inntekt ${selectedYear}`,
              type: "line",
              data: incomeSeries,
              smooth: true,
              symbolSize: 8,
              lineStyle: { color: theme.palette.success.main, width: 3 },
              itemStyle: { color: theme.palette.success.main },
              areaStyle: {
                color: theme.palette.mode === "dark"
                  ? "rgba(52, 211, 153, 0.12)"
                  : "rgba(22, 163, 74, 0.12)",
              },
              emphasis: { focus: "series" },
            },
          ]
        : []),
      ...(hasExpectedIncome
        ? [
            {
              name: "Planlagt inntekt",
              type: "line",
              data: expectedIncomeSeries,
              smooth: false,
              symbol: "none",
              lineStyle: {
                color: theme.palette.success.light,
                width: 2,
                type: "dashed",
              },
              itemStyle: { color: theme.palette.success.light },
              emphasis: { focus: "series" },
            },
          ]
        : []),
    ],
  };
}
