import React from "react";
import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  InputAdornment,
  Stack,
  Typography,
} from "@mui/material";
import CreatableSelect from "react-select/creatable";
import ExpenseField from "../../../../../components/commons/ExpenseField/ExpenseField";
import FieldLabel from "../../../../../components/commons/Forms/FieldLabel";
import FormSection from "../../../../../components/commons/Forms/FormSection";
import { parseDecimalOrNull } from "../../../utils/numberInput";
import DiscountCalculatorPanel from "./DiscountCalculatorPanel";

export default function PriceQuantitySection({
  expense,
  setExpense,
  selectedProduct,
  measuresOptions,
  selectStyles,
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
  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined;
  const hasVolumeOptions = Boolean(
    expense.measurementUnit && selectedProduct?.measures?.length,
  );
  const currentVolumeOption = expense.volume
    ? {
        label: String(expense.volume),
        value: String(expense.volume),
      }
    : null;
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
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
            <Box flex={1}>
              <FieldLabel>
                Volum {expense.measurementUnit ? `(${expense.measurementUnit})` : ""}
              </FieldLabel>
              <CreatableSelect
                isClearable
                options={measuresOptions}
                value={currentVolumeOption}
                onChange={(option) =>
                  option
                    ? onVolumeTextChange(String(option.value))
                    : controller.handleFieldChange?.("volume", 0, { volumeText: "" })
                }
                onCreateOption={(input) => onVolumeTextChange(input.trim())}
                placeholder="Velg eller skriv volum"
                menuPortalTarget={menuPortalTarget}
                styles={selectStyles}
                isValidNewOption={isValidVolumeOption}
                formatCreateLabel={(input) =>
                  `Bruk ${input}${expense.measurementUnit ? ` ${expense.measurementUnit}` : ""}`
                }
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.75, display: "block" }}
              >
                Velg fra listen eller skriv et nytt volum og trykk Enter.
              </Typography>
              {validationErrors?.volume ? (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.75, display: "block" }}
                >
                  {validationErrors.volume}
                </Typography>
              ) : null}
            </Box>
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
        </Stack>

        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
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
        </Stack>

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
