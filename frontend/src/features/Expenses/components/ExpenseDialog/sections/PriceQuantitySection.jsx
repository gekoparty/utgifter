import React from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import ExpenseField from "../../../../../components/commons/ExpenseField/ExpenseField";
import FormSection from "../../../../../components/commons/Forms/FormSection";
import { parseDecimalOrNull } from "../../../utils/numberInput";
import DiscountCalculatorPanel from "./DiscountCalculatorPanel";

export default function PriceQuantitySection({
  expense,
  setExpense,
  selectedProduct,
  measuresOptions,
  controller,
  validationErrors,
  priceInputValue,
  volumeInputValue,
  discountValueInputValue,
  discountAmountInputValue,
  onPriceTextChange,
  onVolumeTextChange,
  onDiscountValueTextChange,
  onDiscountAmountTextChange,
  discountCalculatorOpen,
  onToggleDiscountCalculator,
  knownDiscountedPrice,
  onKnownDiscountedPriceChange,
  knownDiscountPercent,
  onKnownDiscountPercentChange,
  calculatedOriginalPrice,
  discountCalculatorError,
  onClearDiscountCalculatorError,
  onApplyDiscountCalculator,
}) {
  const hasVolumeOptions = Boolean(
    expense.measurementUnit && selectedProduct?.measures?.length,
  );
  const isValidVolumeOption = (input) => {
    const value = parseDecimalOrNull(input);
    if (value == null || value <= 0) return false;

    return !measuresOptions.some(
      (option) => Number(option.value) === Number(value),
    );
  };

  return (
    <FormSection title="Pris og mengde">
      <Stack spacing={2}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
            alignItems: "start",
          }}
        >
          <ExpenseField
            label="Pris"
            type="text"
            value={priceInputValue}
            onChange={(event) => onPriceTextChange(event.target.value)}
            inputProps={{ inputMode: "decimal" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">Kr</InputAdornment>
              ),
            }}
            fullWidth
          />

          {hasVolumeOptions ? (
            <Autocomplete
              freeSolo
              clearOnBlur={false}
              handleHomeEndKeys
              options={measuresOptions}
              value={volumeInputValue || ""}
              inputValue={volumeInputValue}
              getOptionLabel={(option) =>
                typeof option === "string" ? option : option?.label || ""
              }
              isOptionEqualToValue={(option, value) =>
                String(option?.value ?? option) === String(value?.value ?? value)
              }
              onInputChange={(event, value, reason) => {
                if (reason === "input") onVolumeTextChange(value);
                if (reason === "clear") {
                  controller.handleFieldChange?.("volume", 0, { volumeText: "" });
                }
              }}
              onChange={(event, option) => {
                if (!option) {
                  controller.handleFieldChange?.("volume", 0, { volumeText: "" });
                  return;
                }

                onVolumeTextChange(
                  typeof option === "string" ? option : String(option.value),
                );
              }}
              filterOptions={(options, params) => {
                const filtered = options.filter((option) =>
                  String(option.label)
                    .toLowerCase()
                    .includes(params.inputValue.toLowerCase()),
                );

                if (isValidVolumeOption(params.inputValue)) {
                  filtered.push({
                    label: `Bruk ${params.inputValue}${
                      expense.measurementUnit ? ` ${expense.measurementUnit}` : ""
                    }`,
                    value: params.inputValue,
                  });
                }

                return filtered;
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={`Volum ${
                    expense.measurementUnit ? `(${expense.measurementUnit})` : ""
                  }`}
                  error={Boolean(validationErrors?.volume)}
                  helperText={validationErrors?.volume}
                />
              )}
              sx={{ minWidth: 0 }}
            />
          ) : (
            <ExpenseField
              label="Volum (manuelt)"
              type="text"
              value={volumeInputValue}
              onChange={(event) => onVolumeTextChange(event.target.value)}
              inputProps={{ inputMode: "decimal" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {expense.measurementUnit}
                  </InputAdornment>
                ),
              }}
              error={Boolean(validationErrors?.volume)}
              helperText={validationErrors?.volume}
              fullWidth
            />
          )}

          <ExpenseField
            label={`Pris per ${expense.measurementUnit || ""}`}
            value={expense.pricePerUnit ?? 0}
            InputProps={{ readOnly: true }}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
            alignItems: "start",
          }}
        >
          <ExpenseField
            label="Antall"
            type="number"
            value={expense.quantity}
            onChange={(event) =>
              setExpense((previous) => ({
                ...previous,
                quantity: Number(event.target.value) || 1,
              }))
            }
            fullWidth
          />

          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              minHeight: 56,
              px: 1,
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(expense.hasDiscount)}
                  onChange={controller.handleDiscountToggle}
                />
              }
              label="Rabatt?"
            />
          </Box>

          <ExpenseField
            label="Sluttpris"
            value={expense.finalPrice ?? 0}
            InputProps={{
              readOnly: true,
              startAdornment: (
                <InputAdornment position="start">Kr</InputAdornment>
              ),
            }}
            fullWidth
          />
        </Box>

        {expense.hasDiscount ? (
          <>
            <Divider sx={{ borderStyle: "dashed" }} />

            <Box>
              <DiscountCalculatorPanel
                open={discountCalculatorOpen}
                onToggle={onToggleDiscountCalculator}
                knownDiscountedPrice={knownDiscountedPrice}
                onKnownDiscountedPriceChange={onKnownDiscountedPriceChange}
                knownDiscountPercent={knownDiscountPercent}
                onKnownDiscountPercentChange={onKnownDiscountPercentChange}
                calculatedOriginalPrice={calculatedOriginalPrice}
                error={discountCalculatorError}
                onClearError={onClearDiscountCalculatorError}
                onApply={onApplyDiscountCalculator}
              />
            </Box>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <ExpenseField
                label="Rabatt (%)"
                type="text"
                value={discountValueInputValue}
                onChange={(event) => onDiscountValueTextChange(event.target.value)}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">%</InputAdornment>
                  ),
                }}
                fullWidth
              />

              <ExpenseField
                label="Rabatt (kr)"
                type="text"
                value={discountAmountInputValue}
                onChange={(event) => onDiscountAmountTextChange(event.target.value)}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Kr</InputAdornment>
                  ),
                }}
                fullWidth
              />
            </Stack>
          </>
        ) : null}
      </Stack>
    </FormSection>
  );
}
