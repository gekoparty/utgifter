// components/MortgageScenarioEditor.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Stack, TextField, Typography, IconButton, Button } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

const isPeriodKey = (v) => /^\d{4}-\d{2}$/.test(String(v || ""));

export default function MortgageScenarioEditor({ from, value, onChange }) {
  // value is the backend scenario shape
  const initial = useMemo(() => {
    const v = value || {};
    const firstRate = Array.isArray(v?.rateOverrides) ? v.rateOverrides[0] : null;

    return {
      // single override UI (we emit rateOverrides array)
      overrideRate: Number(firstRate?.interestRate ?? 0),
      overrideFrom: String(firstRate?.from ?? ""),

      recurringExtra: Number(v?.recurringExtra?.amount ?? 0),
      recurringExtraFrom: String(v?.recurringExtra?.from ?? ""),

      lumpSums: Array.isArray(v?.oneTimeExtras)
        ? v.oneTimeExtras.map((x) => ({
            periodKey: String(x.periodKey || ""),
            amount: Number(x.amount || 0),
          }))
        : [],

      err: "",
    };
  }, [value]);

  const [s, setS] = useState(initial);

  useEffect(() => setS(initial), [initial]);

  const emit = useCallback(
    (next) => {
      // validate
      if (next.overrideFrom && !isPeriodKey(next.overrideFrom)) {
        setS((p) => ({ ...p, err: "Ugyldig måned for rente (YYYY-MM)" }));
        return;
      }
      if (next.recurringExtraFrom && !isPeriodKey(next.recurringExtraFrom)) {
        setS((p) => ({ ...p, err: "Ugyldig måned for ekstra (YYYY-MM)" }));
        return;
      }
      for (const ls of next.lumpSums || []) {
        if (ls.periodKey && !isPeriodKey(ls.periodKey)) {
          setS((p) => ({ ...p, err: "Ugyldig måned i engangsinnbetaling (YYYY-MM)" }));
          return;
        }
      }

      const scenario = {};

      // rateOverrides
      if (Number(next.overrideRate) > 0) {
        scenario.rateOverrides = [
          {
            from: next.overrideFrom || from || "",
            interestRate: Number(next.overrideRate),
          },
        ].filter((x) => isPeriodKey(x.from));
      } else {
        scenario.rateOverrides = [];
      }

      // recurringExtra
      if (Number(next.recurringExtra) > 0) {
        const f = next.recurringExtraFrom || from || "";
        if (isPeriodKey(f)) {
          scenario.recurringExtra = {
            from: f,
            amount: Number(next.recurringExtra),
          };
        }
      }

      // oneTimeExtras
      scenario.oneTimeExtras = (next.lumpSums || [])
        .filter((x) => Number(x.amount) > 0 && isPeriodKey(x.periodKey))
        .map((x) => ({ periodKey: String(x.periodKey), amount: Number(x.amount) }));

      onChange?.(scenario);
    },
    [onChange, from]
  );

  const patch = useCallback(
    (p) => {
      setS((prev) => {
        const next = { ...prev, ...p, err: "" };
        queueMicrotask(() => emit(next));
        return next;
      });
    },
    [emit]
  );

  const addLump = useCallback(() => {
    patch({
      lumpSums: [...(s.lumpSums || []), { periodKey: from || "", amount: 0 }],
    });
  }, [patch, s.lumpSums, from]);

  const updateLump = useCallback(
    (idx, p) => {
      const next = (s.lumpSums || []).map((x, i) => (i === idx ? { ...x, ...p } : x));
      patch({ lumpSums: next });
    },
    [patch, s.lumpSums]
  );

  const removeLump = useCallback(
    (idx) => {
      patch({ lumpSums: (s.lumpSums || []).filter((_, i) => i !== idx) });
    },
    [patch, s.lumpSums]
  );

  return (
    <Stack spacing={2}>
      <Typography fontWeight={800}>What-if</Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Ny rente (%)"
          type="number"
          value={s.overrideRate}
          onChange={(e) => patch({ overrideRate: Number(e.target.value) })}
          fullWidth
        />
        <TextField
          label="Rente fra måned (YYYY-MM)"
          value={s.overrideFrom}
          onChange={(e) => patch({ overrideFrom: e.target.value })}
          placeholder={from || "2026-02"}
          fullWidth
        />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          label="Ekstra pr mnd"
          type="number"
          value={s.recurringExtra}
          onChange={(e) => patch({ recurringExtra: Number(e.target.value) })}
          fullWidth
        />
        <TextField
          label="Ekstra fra måned (YYYY-MM)"
          value={s.recurringExtraFrom}
          onChange={(e) => patch({ recurringExtraFrom: e.target.value })}
          placeholder={from || "2026-02"}
          fullWidth
        />
      </Stack>

      <Stack spacing={1}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" color="text.secondary">
            Engangsinnbetalinger
          </Typography>
          <Button onClick={addLump}>Legg til</Button>
        </Stack>

        {(s.lumpSums || []).map((ls, idx) => (
          <Stack key={`${idx}-${ls.periodKey}`} direction="row" spacing={1} alignItems="center">
            <TextField
              label="Måned"
              value={ls.periodKey}
              onChange={(e) => updateLump(idx, { periodKey: e.target.value })}
              placeholder={from || "2026-02"}
              sx={{ width: 140 }}
            />
            <TextField
              label="Beløp"
              type="number"
              value={ls.amount}
              onChange={(e) => updateLump(idx, { amount: Number(e.target.value) })}
              fullWidth
            />
            <IconButton onClick={() => removeLump(idx)}>
              <DeleteIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>

      {s.err && <Typography color="error">{s.err}</Typography>}
    </Stack>
  );
}

MortgageScenarioEditor.propTypes = {
  from: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func,
};