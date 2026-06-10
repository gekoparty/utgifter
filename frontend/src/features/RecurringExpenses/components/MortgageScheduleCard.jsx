import React, { memo } from "react";
import PropTypes from "prop-types";
import { Card, Divider, Stack, Typography } from "@mui/material";

const Row = ({ label, value, bold = false, muted = false }) => (
  <Stack direction="row" justifyContent="space-between" spacing={2}>
    <Typography variant="body2" color={muted ? "text.secondary" : "text.primary"}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      fontWeight={bold ? 900 : 700}
      color={muted ? "text.secondary" : "text.primary"}
      noWrap
    >
      {value}
    </Typography>
  </Stack>
);

function MortgageScheduleCard({ schedule, formatCurrency }) {
  if (!schedule) return null;

  const {
    days,
    dayBasis,
    nominellRate,
    paymentTotal,
    fee,
    interest,
    principal,
    extraPrincipal,
    balanceStart,
    balanceEnd,
  } = schedule;

  return (
    <Card variant="outlined" sx={{ width: "100%", p: 1.25, borderRadius: 2 }}>
      <Stack spacing={0.75}>
        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Typography variant="caption" color="text.secondary">
            Terminbeløp
          </Typography>
          <Typography variant="body2" fontWeight={900} noWrap>
            {formatCurrency(paymentTotal ?? 0)}
          </Typography>
        </Stack>

        <Divider sx={{ opacity: 0.5 }} />

        <Row label="Renter" value={formatCurrency(interest ?? 0)} />
        <Row label="Gebyr" value={formatCurrency(fee ?? 0)} />
        <Row label="Avdrag" value={formatCurrency(principal ?? 0)} bold />

        {(extraPrincipal ?? 0) > 0 && (
          <Row label="Ekstra avdrag" value={formatCurrency(extraPrincipal)} bold />
        )}

        <Divider sx={{ opacity: 0.5 }} />

        <Stack direction="row" justifyContent="space-between" spacing={2}>
          <Typography variant="caption" color="text.secondary">
            Restgjeld
          </Typography>
          <Typography variant="body2" fontWeight={900} noWrap>
            {formatCurrency(balanceEnd ?? 0)}
          </Typography>
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ pt: 0.25 }}>
          Start: {formatCurrency(balanceStart ?? 0)}
          {" • "}
          {days ?? "–"} dager
          {" • "}
          Nominell: {String(nominellRate ?? "").replace(".", ",")}%
          {dayBasis ? ` • Basis: ${dayBasis}` : ""}
        </Typography>
      </Stack>
    </Card>
  );
}

MortgageScheduleCard.propTypes = {
  schedule: PropTypes.shape({
    days: PropTypes.number,
    dayBasis: PropTypes.number,
    nominellRate: PropTypes.number,
    paymentTotal: PropTypes.number,
    fee: PropTypes.number,
    interest: PropTypes.number,
    principal: PropTypes.number,
    extraPrincipal: PropTypes.number,
    balanceStart: PropTypes.number,
    balanceEnd: PropTypes.number,
  }),
  formatCurrency: PropTypes.func.isRequired,
};

export default memo(MortgageScheduleCard);

