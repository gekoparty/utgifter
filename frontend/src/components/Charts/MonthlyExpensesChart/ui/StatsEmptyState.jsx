import React from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import SectionCard from "../../../commons/Layout/SectionCard";

export default function StatsEmptyState({
  title,
  message,
  loading = false,
  error = false,
}) {
  return (
    <SectionCard
      title={title}
      sx={{ minHeight: 260 }}
      contentSx={{
        minHeight: 260,
        display: "grid",
        placeItems: "center",
        textAlign: "center",
      }}
    >
      <Box>
        {loading ? <CircularProgress size={30} sx={{ mb: 1.5 }} /> : null}
        <Typography
          color={error ? "error" : "text.secondary"}
          sx={{ maxWidth: 520, mx: "auto" }}
        >
          {message}
        </Typography>
      </Box>
    </SectionCard>
  );
}
