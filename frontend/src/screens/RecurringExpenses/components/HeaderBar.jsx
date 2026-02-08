import React, { memo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";

function HeaderBar({ onAdd }) {
  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 }, pb: 2 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={900}>
            Faste kostnader
          </Typography>
          <Typography color="text.secondary">
            Kommende måneder • estimater • forfall • betalt
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<Add />} onClick={onAdd}>
          Legg til
        </Button>
      </Stack>
    </Box>
  );
}

export default memo(HeaderBar);