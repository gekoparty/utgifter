import React, { memo } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";

function HeaderBar({ onAdd }) {
  return (
    <Box sx={{ px: { xs: 1.5, md: 3 }, pt: { xs: 1.5, md: 3 }, pb: 1.5 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            fontWeight={900}
            sx={{ fontSize: { xs: "1.7rem", md: "2.125rem" } }}
          >
            Faste kostnader
          </Typography>
          <Typography color="text.secondary">
            Få oversikt over faste regninger, forfall og betalinger.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={onAdd}
          sx={{ width: { xs: "100%", sm: "auto" }, alignSelf: { md: "center" } }}
        >
          Legg til fast kostnad
        </Button>
      </Stack>
    </Box>
  );
}

export default memo(HeaderBar);
