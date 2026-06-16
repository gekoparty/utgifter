import React from "react";
import {
  Alert,
  Button,
  Collapse,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ExpenseField from "../../../../../components/commons/ExpenseField/ExpenseField";

export default function DiscountCalculatorPanel({
  open,
  onToggle,
  knownDiscountedPrice,
  onKnownDiscountedPriceChange,
  knownDiscountPercent,
  onKnownDiscountPercentChange,
  calculatedOriginalPrice,
  error,
  onClearError,
  onApply,
}) {
  return (
    <>
      <Button
        variant="outlined"
        size="small"
        onClick={onToggle}
        sx={{
          alignSelf: "flex-start",
          borderRadius: 2,
          textTransform: "none",
          fontWeight: 800,
        }}
      >
        Regn ut førpris
      </Button>

      <Collapse in={open} timeout={220}>
        <Paper
          variant="outlined"
          sx={{
            mt: 1.5,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.035)",
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" color="text.secondary">
              Bruk denne når du bare vet sluttprisen og rabattprosenten.
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <ExpenseField
                label="Sluttpris betalt"
                type="text"
                value={knownDiscountedPrice}
                onChange={(event) => {
                  onKnownDiscountedPriceChange(event.target.value);
                  onClearError?.();
                }}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Kr</InputAdornment>
                  ),
                }}
                fullWidth
              />

              <ExpenseField
                label="Rabatt"
                type="text"
                value={knownDiscountPercent}
                onChange={(event) => {
                  onKnownDiscountPercentChange(event.target.value);
                  onClearError?.();
                }}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">%</InputAdornment>
                  ),
                }}
                fullWidth
              />
            </Stack>

            {calculatedOriginalPrice != null && (
              <Typography variant="body2" sx={{ fontWeight: 800 }}>
                Førpris: {calculatedOriginalPrice} kr
              </Typography>
            )}

            {error ? <Alert severity="warning">{error}</Alert> : null}

            <Button
              variant="contained"
              onClick={onApply}
              sx={{
                alignSelf: { xs: "stretch", sm: "flex-start" },
                borderRadius: 2,
                textTransform: "none",
                fontWeight: 800,
              }}
            >
              Bruk i skjemaet
            </Button>
          </Stack>
        </Paper>
      </Collapse>
    </>
  );
}
