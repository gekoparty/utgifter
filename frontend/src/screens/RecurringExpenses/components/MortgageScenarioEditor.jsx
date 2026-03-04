// components/MortgageScenarioEditor.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Stack,
  TextField,
  Typography,
  IconButton,
  Button,
  Divider,
  Collapse,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";

const isPeriodKey = (v) => /^\d{4}-\d{2}$/.test(String(v || ""));
const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

export default function MortgageScenarioEditor({ from, value, onChange }) {
  // ✅ must be inside component
  const [whatIfOpen, setWhatIfOpen] = useState(false);

  // value is the backend scenario shape
  const initial = useMemo(() => {
    const v = value || {};
    const firstRate = Array.isArray(v?.rateOverrides) ? v.rateOverrides[0] : null;

    return {
      // single override UI (we emit rateOverrides array)
      overrideRate: n(firstRate?.interestRate ?? 0),
      overrideFrom: String(firstRate?.from ?? ""),

      recurringExtra: n(v?.recurringExtra?.amount ?? 0),
      recurringExtraFrom: String(v?.recurringExtra?.from ?? ""),

      // editable list
      lumpSums: Array.isArray(v?.oneTimeExtras)
        ? v.oneTimeExtras.map((x) => ({
            periodKey: String(x.periodKey || ""),
            amount: n(x.amount || 0),
          }))
        : [],

      // quick add single payment inputs (UI-only)
      quickLumpMonth: String(from || ""),
      quickLumpAmount: "",

      // downpayment (advanced)
      downPayment: v?.downPayment != null ? n(v.downPayment) : 0,
      showAdvanced: false,

      err: "",
    };
  }, [value, from]);

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
          setS((p) => ({
            ...p,
            err: "Ugyldig måned i engangsinnbetaling (YYYY-MM)",
          }));
          return;
        }
      }

      const scenario = {};

      // rateOverrides
      if (n(next.overrideRate) > 0) {
        scenario.rateOverrides = [
          {
            from: next.overrideFrom || from || "",
            interestRate: n(next.overrideRate),
          },
        ].filter((x) => isPeriodKey(x.from));
      } else {
        scenario.rateOverrides = [];
      }

      // recurringExtra
      if (n(next.recurringExtra) > 0) {
        const f = next.recurringExtraFrom || from || "";
        if (isPeriodKey(f)) {
          scenario.recurringExtra = { from: f, amount: n(next.recurringExtra) };
        }
      }

      // oneTimeExtras
      scenario.oneTimeExtras = (next.lumpSums || [])
        .filter((x) => n(x.amount) > 0 && isPeriodKey(x.periodKey))
        .map((x) => ({ periodKey: String(x.periodKey), amount: n(x.amount) }));

      // downPayment (only include if > 0)
      if (n(next.downPayment) > 0) {
        scenario.downPayment = n(next.downPayment);
      }

      onChange?.(scenario);
    },
    [onChange, from],
  );

  const patch = useCallback(
    (p) => {
      setS((prev) => {
        const next = { ...prev, ...p, err: "" };
        queueMicrotask(() => emit(next));
        return next;
      });
    },
    [emit],
  );

  // ✅ UI-only patch (no emit) for fields that shouldn't reset while typing
  const patchUI = useCallback((p) => {
    setS((prev) => ({ ...prev, ...p, err: "" }));
  }, []);

  // list ops
  const addLumpRow = useCallback(() => {
    patch({
      lumpSums: [...(s.lumpSums || []), { periodKey: from || "", amount: 0 }],
    });
  }, [patch, s.lumpSums, from]);

  const updateLump = useCallback(
    (idx, p) => {
      const next = (s.lumpSums || []).map((x, i) =>
        i === idx ? { ...x, ...p } : x,
      );
      patch({ lumpSums: next });
    },
    [patch, s.lumpSums],
  );

  const removeLump = useCallback(
    (idx) => {
      patch({ lumpSums: (s.lumpSums || []).filter((_, i) => i !== idx) });
    },
    [patch, s.lumpSums],
  );

  // quick add -> merges by month and sorts
  const addQuickLump = useCallback(() => {
    const pk = String(s.quickLumpMonth || "").trim();
    const amt = n(s.quickLumpAmount);

    if (!isPeriodKey(pk)) {
      patchUI({ err: "Ugyldig måned i engangsinnbetaling (YYYY-MM)" });
      return;
    }
    if (amt <= 0) return;

    const list = Array.isArray(s.lumpSums) ? [...s.lumpSums] : [];
    const idx = list.findIndex((x) => String(x.periodKey) === pk);

    if (idx >= 0) list[idx] = { ...list[idx], amount: n(list[idx].amount) + amt };
    else list.push({ periodKey: pk, amount: amt });

    list.sort((a, b) => String(a.periodKey).localeCompare(String(b.periodKey)));

    patch({
      lumpSums: list,
      quickLumpAmount: "",
      quickLumpMonth: pk,
    });
  }, [s.quickLumpMonth, s.quickLumpAmount, s.lumpSums, patch, patchUI]);

  const hasAnyWhatIf = useMemo(() => {
    return (
      n(s.overrideRate) > 0 ||
      n(s.recurringExtra) > 0 ||
      (Array.isArray(s.lumpSums) && s.lumpSums.some((x) => n(x.amount) > 0 && isPeriodKey(x.periodKey)))
    );
  }, [s.overrideRate, s.recurringExtra, s.lumpSums]);

  return (
    <Stack spacing={2}>
      {/* ✅ Nice accordion */}
      <Accordion
        expanded={whatIfOpen}
        onChange={(_, expanded) => setWhatIfOpen(expanded)}
        disableGutters
        elevation={0}
        sx={{
          border: (t) => `1px solid ${t.palette.divider}`,
          borderRadius: 2,
          overflow: "hidden",
          "&:before": { display: "none" },
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack spacing={0.25} sx={{ width: "100%" }}>
            <Typography fontWeight={900}>What-if simulering</Typography>
            <Typography variant="caption" color="text.secondary">
              {hasAnyWhatIf ? "Aktivert (endringer lagt inn)" : "Klikk for å åpne"}
            </Typography>
          </Stack>
        </AccordionSummary>

        <AccordionDetails>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Ny rente (%)"
                type="number"
                value={s.overrideRate}
                onChange={(e) => patch({ overrideRate: n(e.target.value) })}
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
                onChange={(e) => patch({ recurringExtra: n(e.target.value) })}
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

            <Divider />

            {/* single payment quick add */}
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                Engangsinnbetaling (legg til én)
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Måned (YYYY-MM)"
                  value={s.quickLumpMonth}
                  onChange={(e) => patchUI({ quickLumpMonth: e.target.value })}
                  placeholder={from || "2026-02"}
                  sx={{ width: { xs: "100%", sm: 220 } }}
                />
                <TextField
                  label="Beløp"
                  type="number"
                  value={s.quickLumpAmount}
                  onChange={(e) => patchUI({ quickLumpAmount: e.target.value })}
                  fullWidth
                />
                <Button variant="contained" onClick={addQuickLump}>
                  Legg til
                </Button>
              </Stack>
            </Stack>

            {/* list */}
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Engangsinnbetalinger (liste)
                </Typography>
                <Button onClick={addLumpRow}>Ny rad</Button>
              </Stack>

              {(s.lumpSums || []).map((ls, idx) => (
                <Stack
                  key={`${idx}-${ls.periodKey}`}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
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
                    onChange={(e) => updateLump(idx, { amount: n(e.target.value) })}
                    fullWidth
                  />
                  <IconButton onClick={() => removeLump(idx)}>
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              ))}
            </Stack>

            <Divider />

            {/* downpayment hidden by default */}
            <Stack spacing={1}>
              <Button
                variant="text"
                onClick={() => patch({ showAdvanced: !s.showAdvanced })}
                sx={{ alignSelf: "flex-start" }}
              >
                {s.showAdvanced ? "Skjul avansert" : "Vis avansert"}
              </Button>

              <Collapse in={Boolean(s.showAdvanced)}>
                <Stack spacing={2} sx={{ pt: 1 }}>
                  <TextField
                    label="Egenkapital (downpayment)"
                    type="number"
                    value={s.downPayment}
                    onChange={(e) => patch({ downPayment: n(e.target.value) })}
                    helperText="Valgfritt. Skjult som standard."
                    fullWidth
                  />
                </Stack>
              </Collapse>
            </Stack>

            {s.err && <Typography color="error">{s.err}</Typography>}
          </Stack>
        </AccordionDetails>
      </Accordion>
    </Stack>
  );
}

MortgageScenarioEditor.propTypes = {
  from: PropTypes.string,
  value: PropTypes.object,
  onChange: PropTypes.func,
};