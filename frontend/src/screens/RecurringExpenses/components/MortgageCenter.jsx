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
import { mortgageApi } from "../api/mortageApi";
import MortgageScenarioEditor from "./MortgageScenarioEditor";
import HardDeleteMortgageDialog from "./HardDeleteMortgageDialog";

const isPeriodKey = (v) => /^\d{4}-\d{2}$/.test(String(v || ""));

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};

const deltaLabel = (value, fmt) => {
  const v = n(value);
  if (v === 0) return "0";
  const sign = v > 0 ? "+" : "-";
  return `${sign}${fmt(Math.abs(v))}`;
};

const monthsDeltaLabel = (value) => {
  const v = n(value);
  if (v === 0) return "0";
  const sign = v > 0 ? "+" : "-";
  return `${sign}${Math.abs(v)}`;
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

  /**
   * ✅ Keep selectedId always valid for the available mortgages.
   */
  useEffect(() => {
    const list = Array.isArray(mortgages) ? mortgages : [];
    const ids = list.map((m) => String(m._id));

    if (ids.length === 0) {
      if (selectedId !== "") setSelectedId("");
      return;
    }

    if (!selectedId) {
      setSelectedId(ids[0]);
      return;
    }

    if (!ids.includes(String(selectedId))) {
      setSelectedId(ids[0]);
    }
  }, [mortgages, selectedId]);

  /**
   * ✅ Best fix: start plan from firstPaymentMonth if present.
   * This ensures your plan starts at March 2026 when you entered 20.03.2026.
   */
  useEffect(() => {
    if (!selected) return;

    const pk = String(selected.firstPaymentMonth || "").trim();
    if (/^\d{4}-\d{2}$/.test(pk) && pk !== from) {
      setFrom(pk);
    }
  }, [selected, from]);

  const loadPlan = useCallback(async () => {
    setErr("");
    setPending(true);
    setSim(null);

    try {
      if (!selectedId) {
        setPlan(null);
        return;
      }
      if (!selected) {
        setPlan(null);
        return;
      }
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
  }, [selectedId, selected, from, months]);

  const runSim = useCallback(async () => {
    setErr("");
    setPending(true);

    try {
      if (!selectedId) {
        setSim(null);
        return;
      }
      if (!selected) {
        setSim(null);
        return;
      }
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
  }, [selectedId, selected, from, months, scenario]);

  useEffect(() => {
    if (!selectedId) return;
    loadPlan();
  }, [selectedId, from, months, loadPlan]);

  const planSchedule = useMemo(
    () => (Array.isArray(plan?.schedule) ? plan.schedule : []),
    [plan]
  );
  const simSchedule = useMemo(
    () => (Array.isArray(sim?.schedule) ? sim.schedule : []),
    [sim]
  );

  const showSchedule = useMemo(
    () => (sim ? simSchedule : planSchedule),
    [sim, simSchedule, planSchedule]
  );
  const headRows = useMemo(() => showSchedule.slice(0, 12), [showSchedule]);

  const title = selected?.title || plan?.mortgage?.title || sim?.mortgage?.title || "";

  const planTotals = plan?.totals || { totalInterest: 0, totalFees: 0, totalPrincipal: 0 };
  const simTotals = sim?.totals || { totalInterest: 0, totalFees: 0, totalPrincipal: 0 };

  const diff = useMemo(() => {
    if (!sim) return null;

    const planM = plan?.monthsToPayoff ?? null;
    const simM = sim?.monthsToPayoff ?? null;

    const monthsSaved = planM != null && simM != null ? n(planM) - n(simM) : 0;

    const interestSaved = n(planTotals.totalInterest) - n(simTotals.totalInterest);
    const feesSaved = n(planTotals.totalFees) - n(simTotals.totalFees);

    const totalPaidPlan = n(planTotals.totalInterest) + n(planTotals.totalFees) + n(planTotals.totalPrincipal);
    const totalPaidSim = n(simTotals.totalInterest) + n(simTotals.totalFees) + n(simTotals.totalPrincipal);
    const totalPaidDelta = totalPaidPlan - totalPaidSim;

    return {
      payoffPlan: plan?.payoffPeriodKey || null,
      payoffSim: sim?.payoffPeriodKey || null,
      monthsToPayoffPlan: planM,
      monthsToPayoffSim: simM,
      monthsSaved,
      interestSaved,
      feesSaved,
      totalPaidPlan,
      totalPaidSim,
      totalPaidDelta,
    };
  }, [sim, plan, planTotals, simTotals]);

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
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => setDeleteOpen(true)}
                  disabled={!selectedId || pending}
                >
                  Slett
                </Button>
                <Button
                  color="error"
                  variant="contained"
                  onClick={() => setPurgeOpen(true)}
                  disabled={pending}
                >
                  Purge alle
                </Button>
              </Stack>
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                label="Velg boliglån"
                value={selected ? selectedId : ""}
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
                onChange={(e) =>
                  setMonths(Math.max(1, Math.min(600, Number(e.target.value || 360))))
                }
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
              <Button onClick={loadPlan} disabled={pending || !selectedId || !selected}>
                Oppdater plan
              </Button>
              <Button variant="contained" onClick={runSim} disabled={pending || !selectedId || !selected}>
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

            {diff && (
              <>
                <Divider />
                <Typography fontWeight={900}>Forskjell (Plan vs What-if)</Typography>

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Nedbetalt (plan)</Typography>
                    <Typography fontWeight={700}>{diff.payoffPlan || "Ikke innen horisont"}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Nedbetalt (what-if)</Typography>
                    <Typography fontWeight={700}>{diff.payoffSim || "Ikke innen horisont"}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Måneder til nedbetalt (plan)</Typography>
                    <Typography>{diff.monthsToPayoffPlan ?? "-"}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Måneder til nedbetalt (what-if)</Typography>
                    <Typography>{diff.monthsToPayoffSim ?? "-"}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Måneder spart</Typography>
                    <Typography fontWeight={800}>{monthsDeltaLabel(diff.monthsSaved)}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Renter spart</Typography>
                    <Typography fontWeight={800}>{deltaLabel(diff.interestSaved, formatCurrency)}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Gebyr spart</Typography>
                    <Typography fontWeight={800}>{deltaLabel(diff.feesSaved, formatCurrency)}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Total betalt (plan)</Typography>
                    <Typography>{formatCurrency(diff.totalPaidPlan)}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Total betalt (what-if)</Typography>
                    <Typography>{formatCurrency(diff.totalPaidSim)}</Typography>
                  </Stack>

                  <Stack spacing={0.25}>
                    <Typography variant="body2" color="text.secondary">Forskjell total betalt</Typography>
                    <Typography fontWeight={800}>{deltaLabel(diff.totalPaidDelta, formatCurrency)}</Typography>
                  </Stack>
                </Box>

                <Typography variant="caption" color="text.secondary">
                  (Bruker backend totals + monthsToPayoff)
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
              <Stack spacing={0.75}>
                {headRows.map((r) => {
                  const pk = String(r.periodKey || "");
                  const row = r.schedule || {};
                  return (
                    <Stack key={pk} direction="row" justifyContent="space-between">
                      <Typography variant="body2" sx={{ width: 70 }}>
                        {pk}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Rest: {formatCurrency(row.balanceEnd)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Betalt: {formatCurrency(row.paymentTotal)}
                      </Typography>

                      <Typography variant="body2" color="text.secondary">
                        Rente: {formatCurrency(row.interest)}
                      </Typography>
                    </Stack>
                  );
                })}
                {showSchedule.length > 12 && (
                  <Typography variant="caption" color="text.secondary">
                    Viser 12 av {showSchedule.length} rader
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
  formatCurrency: PropTypes.func.isRequired,
  onHardDeleteMortgage: PropTypes.func,
  onPurgeMortgages: PropTypes.func,
};