// components/MortgageCenter.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  CardContent,
  Stack,
  Typography,
  TextField,
  MenuItem,
  Button,
  Divider,
  Box,
} from "@mui/material";
import dayjs from "dayjs";
import { mortgageApi } from "../api/mortgageApi";
import MortgageScenarioEditor from "./MortgageScenarioEditor";
import HardDeleteMortgageDialog from "./HardDeleteMortgageDialog";

const isPeriodKey = (v) => /^\d{4}-\d{2}$/.test(String(v || ""));

const pickNum = (row, keys, fallback = 0) => {
  for (const k of keys) {
    const v = row?.[k];
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return fallback;
};

const summarizeRows = (rows) => {
  const arr = Array.isArray(rows) ? rows : [];
  if (arr.length === 0) {
    return {
      months: 0,
      payoffKey: null,
      totalInterest: 0,
      totalPaid: 0,
      finalRemaining: 0,
    };
  }

  let totalInterest = 0;
  let totalPaid = 0;
  let payoffKey = null;

  for (const r of arr) {
    const interest = pickNum(r, ["interest", "interestAmount", "interestPaid"], 0);
    const paid = pickNum(r, ["paidTotal", "paid", "payment", "paidAmount"], 0);
    const remaining = pickNum(r, ["remainingBalance", "remaining", "balance"], 0);

    totalInterest += interest;
    totalPaid += paid;

    // payoff = first month where remaining hits 0 (or below)
    if (payoffKey == null && remaining <= 0) {
      payoffKey = String(r.key || r.periodKey || "");
    }
  }

  const last = arr[arr.length - 1];
  const finalRemaining = pickNum(last, ["remainingBalance", "remaining", "balance"], 0);

  // months until payoff: index of payoffKey + 1 (or horizon length if not paid off)
  const payoffIndex = payoffKey
    ? arr.findIndex((r) => String(r.key || r.periodKey || "") === payoffKey)
    : -1;

  const months = payoffIndex >= 0 ? payoffIndex + 1 : arr.length;

  return {
    months,
    payoffKey: payoffKey || null,
    totalInterest,
    totalPaid,
    finalRemaining,
  };
};

const formatDelta = (n, formatCurrency) => {
  const v = Number(n || 0);
  if (!Number.isFinite(v) || v === 0) return "0";
  const sign = v > 0 ? "+" : "-";
  return `${sign}${formatCurrency?.(Math.abs(v)) ?? Math.abs(v)}`;
};

export default function MortgageCenter({
  mortgages,
  formatCurrency,
  onHardDeleteMortgage,
  onPurgeMortgages,
}) {
  const thisMonth = useMemo(() => dayjs().format("YYYY-MM"), []);
  const [selectedId, setSelectedId] = useState("");
  const [from, setFrom] = useState(thisMonth);
  const [months, setMonths] = useState(360);

  const [scenario, setScenario] = useState({});
  const [plan, setPlan] = useState(null);
  const [sim, setSim] = useState(null);

  const [pending, setPending] = useState(false);
  const [err, setErr] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);

  const selected = useMemo(() => {
    const id = String(selectedId || "");
    return (mortgages || []).find((m) => String(m._id) === id) || null;
  }, [mortgages, selectedId]);

  useEffect(() => {
    if (!selectedId && (mortgages || []).length > 0) {
      setSelectedId(String(mortgages[0]._id));
    }
  }, [mortgages, selectedId]);

  const loadPlan = useCallback(async () => {
    setErr("");
    setPending(true);
    setSim(null);
    try {
      if (!selectedId) return;
      if (!isPeriodKey(from)) throw new Error("Ugyldig måned (YYYY-MM)");
      const data = await mortgageApi.getPlan({
        mortgageId: selectedId,
        from,
        months,
      });
      setPlan(data);
    } catch (e) {
      setErr(e?.message || "Kunne ikke hente plan");
      setPlan(null);
    } finally {
      setPending(false);
    }
  }, [selectedId, from, months]);

  const runSim = useCallback(async () => {
    setErr("");
    setPending(true);
    try {
      if (!selectedId) return;
      if (!isPeriodKey(from)) throw new Error("Ugyldig måned (YYYY-MM)");
      const data = await mortgageApi.simulate({
        mortgageId: selectedId,
        from,
        months,
        scenario,
      });
      setSim(data);
    } catch (e) {
      setErr(e?.message || "Kunne ikke simulere");
      setSim(null);
    } finally {
      setPending(false);
    }
  }, [selectedId, from, months, scenario]);

  useEffect(() => {
    if (!selectedId) return;
    loadPlan();
  }, [selectedId, from, months, loadPlan]);

  const planRows = useMemo(() => (Array.isArray(plan?.rows) ? plan.rows : []), [plan]);
  const simRows = useMemo(() => (Array.isArray(sim?.rows) ? sim.rows : []), [sim]);

  const showRows = useMemo(() => (sim ? simRows : planRows), [sim, simRows, planRows]);
  const headRows = useMemo(() => showRows.slice(0, 12), [showRows]);

  const title = selected?.title || plan?.mortgage?.title || sim?.mortgage?.title || "";

  // ✅ Difference summary data
  const planSum = useMemo(() => summarizeRows(planRows), [planRows]);
  const simSum = useMemo(() => summarizeRows(simRows), [simRows]);

  const diff = useMemo(() => {
    if (!sim) return null;

    const monthsDelta = planSum.months - simSum.months; // positive = months saved
    const interestDelta = planSum.totalInterest - simSum.totalInterest; // positive = interest saved
    const paidDelta = planSum.totalPaid - simSum.totalPaid; // positive = paid less total

    return {
      monthsSaved: monthsDelta,
      interestSaved: interestDelta,
      paidLessTotal: paidDelta,
      payoffKeyPlan: planSum.payoffKey,
      payoffKeySim: simSum.payoffKey,
      finalRemainingPlan: planSum.finalRemaining,
      finalRemainingSim: simSum.finalRemaining,
    };
  }, [sim, planSum, simSum]);

  const doHardDelete = useCallback(async () => {
    try {
      if (!selectedId) return;
      setPending(true);
      setErr("");
      await onHardDeleteMortgage?.(selectedId);
      setDeleteOpen(false);
      setPlan(null);
      setSim(null);
      setSelectedId("");
    } catch (e) {
      setErr(e?.message || "Kunne ikke slette");
    } finally {
      setPending(false);
    }
  }, [selectedId, onHardDeleteMortgage]);

  const doPurge = useCallback(async () => {
    try {
      setPending(true);
      setErr("");
      await onPurgeMortgages?.();
      setPurgeOpen(false);
      setPlan(null);
      setSim(null);
      setSelectedId("");
    } catch (e) {
      setErr(e?.message || "Kunne ikke purge");
    } finally {
      setPending(false);
    }
  }, [onPurgeMortgages]);

  if (!mortgages || mortgages.length === 0) {
    return (
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Typography fontWeight={800}>Boliglån</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Ingen boliglån funnet.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card sx={{ mt: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography fontWeight={900}>Boliglån</Typography>
              <Stack direction="row" spacing={1}>
                <Button color="error" variant="outlined" onClick={() => setDeleteOpen(true)} disabled={!selectedId || pending}>
                  Slett
                </Button>
                <Button color="error" variant="contained" onClick={() => setPurgeOpen(true)} disabled={pending}>
                  Purge alle
                </Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Velg boliglån"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                fullWidth
              >
                {(mortgages || []).map((m) => (
                  <MenuItem key={String(m._id)} value={String(m._id)}>
                    {m.title}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Fra måned (YYYY-MM)"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder={thisMonth}
                sx={{ width: { xs: "100%", sm: 220 } }}
              />

              <TextField
                label="Måneder"
                type="number"
                value={months}
                onChange={(e) => setMonths(Math.max(1, Math.min(600, Number(e.target.value || 360))))}
                sx={{ width: { xs: "100%", sm: 140 } }}
              />
            </Stack>

            <Divider />

            <MortgageScenarioEditor
              from={from}
              value={scenario}
              onChange={(s) => setScenario(s || {})}
            />

            <Stack direction="row" spacing={1}>
              <Button onClick={loadPlan} disabled={pending || !selectedId}>
                Oppdater plan
              </Button>
              <Button variant="contained" onClick={runSim} disabled={pending || !selectedId}>
                Simuler
              </Button>
              <Button
                variant="outlined"
                onClick={() => {
                  setScenario({});
                  setSim(null);
                }}
                disabled={pending}
              >
                Nullstill what-if
              </Button>
            </Stack>

            {err && <Typography color="error">{err}</Typography>}

            {/* ✅ Difference summary */}
            {diff && (
              <>
                <Divider />
                <Typography fontWeight={900}>Forskjell (Plan vs What-if)</Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Nedbetalt (plan)</Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {diff.payoffKeyPlan || `Ikke innen ${planSum.months} mnd`}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Nedbetalt (what-if)</Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {diff.payoffKeySim || `Ikke innen ${simSum.months} mnd`}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Måneder spart</Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {Number.isFinite(diff.monthsSaved) ? `${diff.monthsSaved}` : "-"}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Renter spart</Typography>
                    <Typography variant="body1" fontWeight={700}>
                      {formatDelta(diff.interestSaved, formatCurrency)}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Total betalt (plan)</Typography>
                    <Typography variant="body2">{formatCurrency?.(planSum.totalPaid)}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Total betalt (what-if)</Typography>
                    <Typography variant="body2">{formatCurrency?.(simSum.totalPaid)}</Typography>
                  </Stack>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  (Beregnet fra rows: summerer interest + paid, payoff = første måned remaining ≤ 0)
                </Typography>
              </>
            )}

            <Divider />

            <Typography fontWeight={800}>
              {sim ? "Simulering" : "Plan"}
              {title ? `: ${title}` : ""}
            </Typography>

            {pending && (
              <Typography variant="body2" color="text.secondary">
                Laster…
              </Typography>
            )}

            {!pending && headRows.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                Ingen rader.
              </Typography>
            )}

            {!pending && headRows.length > 0 && (
              <Stack spacing={0.5}>
                {headRows.map((r) => (
                  <Stack
                    key={String(r.key || r.periodKey || Math.random())}
                    direction="row"
                    justifyContent="space-between"
                  >
                    <Typography variant="body2" sx={{ width: 70 }}>
                      {String(r.key || r.periodKey || "")}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Rest: {formatCurrency?.(pickNum(r, ["remainingBalance", "remaining", "balance"], 0))}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Betalt: {formatCurrency?.(pickNum(r, ["paidTotal", "paid", "payment", "paidAmount"], 0))}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      Rente: {formatCurrency?.(pickNum(r, ["interest", "interestAmount", "interestPaid"], 0))}
                    </Typography>
                  </Stack>
                ))}
                {showRows.length > 12 && (
                  <Typography variant="caption" color="text.secondary">
                    Viser 12 av {showRows.length} rader
                  </Typography>
                )}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <HardDeleteMortgageDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={doHardDelete}
        title={title}
        confirmWord="SLETT"
      />

      <HardDeleteMortgageDialog
        open={purgeOpen}
        onClose={() => setPurgeOpen(false)}
        onConfirm={doPurge}
        title="ALLE boliglån"
        confirmWord="PURGE"
      />
    </>
  );
}

MortgageCenter.propTypes = {
  mortgages: PropTypes.array,
  formatCurrency: PropTypes.func,
  onHardDeleteMortgage: PropTypes.func,
  onPurgeMortgages: PropTypes.func,
};