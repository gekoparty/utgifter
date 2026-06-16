import React, { memo } from "react";
import { Box } from "@mui/material";
import { Add } from "@mui/icons-material";
import PageHeader from "../../../components/commons/Layout/PageHeader";

function HeaderBar({ onAdd }) {
  return (
    <Box sx={{ px: { xs: 1.5, md: 3 }, pt: { xs: 1.5, md: 3 }, pb: 1.5 }}>
      <PageHeader
        title="Faste kostnader"
        subtitle="Få oversikt over faste regninger, forfall og betalinger."
        actionLabel="Legg til fast kostnad"
        actionIcon={<Add />}
        onAction={onAdd}
        sx={{ mb: 0 }}
      />
    </Box>
  );
}

export default memo(HeaderBar);
