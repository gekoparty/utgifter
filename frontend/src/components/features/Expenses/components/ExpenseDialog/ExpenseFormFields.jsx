import React, { useMemo } from "react";
import {
  Box,
  Stack,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import VirtualizedSelect from "../../../../commons/VirtualizedSelect/VirtualizedSelect";
import ExpenseField from "../../../../commons/ExpenseField/ExpenseField";

const normalizeDecimal = (s) =>
  String(s ?? "").replace(/\s/g, "").replace(",", ".");

const parseDecimalOrNull = (s) => {
  const t = normalizeDecimal(s);
  if (t === "") return null;
  if (t === "." || t === "-" || t === "-.") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

const formatDecimalForInput = (n) => {
  if (n == null) return "";
  if (typeof n === "string") return n;
  if (!Number.isFinite(n)) return "";
  return String(n);
};

const ExpenseFormFields = ({
  expense,
  setExpense,
  selectStyles,
  productOptions,
  brandOptions,
  variantOptions,
  shopOptions,
  selectedProduct,
  hasNextPage,
  fetchNextPage,
  isLoadingProducts,
  isLoadingBrands,
  isLoadingShops,
  controller,

  validationErrors,
  clearFieldError,
}) => {
  const priceInputValue = expense.priceText ?? formatDecimalForInput(expense.price);
  const volumeInputValue = expense.volumeText ?? formatDecimalForInput(expense.volume);
  const discountValueInputValue =
    expense.discountValueText ?? formatDecimalForInput(expense.discountValue);
  const discountAmountInputValue =
    expense.discountAmountText ?? formatDecimalForInput(expense.discountAmount);

  const measuresOptions = useMemo(() => {
    const measures = selectedProduct?.measures || [];
    return measures.map((m) => ({ label: String(m), value: m }));
  }, [selectedProduct]);

  const showVariants = Boolean(selectedProduct) && (variantOptions?.length ?? 0) > 0;

  const handlePriceTextChange = (text) => {
    setExpense((prev) => ({ ...prev, priceText: text }));
    const parsed = parseDecimalOrNull(text);
    if (parsed !== null) controller.handleFieldChange?.("price", parsed);
  };

  const handleVolumeTextChange = (text) => {
    setExpense((prev) => ({ ...prev, volumeText: text }));
    const parsed = parseDecimalOrNull(text);
    if (parsed !== null) controller.handleFieldChange?.("volume", parsed);
  };

  const handleDiscountValueTextChange = (text) => {
    setExpense((prev) => ({ ...prev, discountValueText: text }));
    const parsed = parseDecimalOrNull(text);
    if (parsed !== null) controller.handleFieldChange?.("discountValue", parsed);
  };

  const handleDiscountAmountTextChange = (text) => {
    setExpense((prev) => ({ ...prev, discountAmountText: text }));
    const parsed = parseDecimalOrNull(text);
    if (parsed !== null) controller.handleFieldChange?.("discountAmount", parsed);
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        {/* PRODUCT & BRAND */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box flex={1}>
            <VirtualizedSelect
              isClearable
              options={productOptions}
              value={
                selectedProduct ??
                (expense.productName
                  ? { label: expense.productName, value: expense.productName, name: expense.productName }
                  : null)
              }
              onChange={controller.handleProductSelect}
              onInputChange={controller.handleProductInputChange}
              hasNextPage={hasNextPage}
              fetchNextPage={fetchNextPage}
              isLoading={isLoadingProducts}
              placeholder="Velg produkt"
              loadingMessage={() => "Søker etter produkter..."}
              menuPortalTarget={document.body}
              styles={selectStyles}
            />
          </Box>

          <Box flex={1}>
            <VirtualizedSelect
              isClearable
              options={brandOptions}
              value={
                expense.brandName
                  ? (brandOptions.find(
                      (o) =>
                        o.name === expense.brandName ||
                        o.label === expense.brandName ||
                        String(o.value) === String(expense.brandName)
                    ) ?? {
                      label: expense.brandName,
                      value: expense.brandName,
                      name: expense.brandName,
                    })
                  : null
              }
              onChange={(opt) => {
                clearFieldError?.("brandName");
                controller.handleBrandSelect(opt);
              }}
              placeholder={selectedProduct ? "Velg merke" : "Velg et produkt først"}
              isLoading={isLoadingBrands}
              menuPortalTarget={document.body}
              isDisabled={!selectedProduct}
              styles={selectStyles}
            />

            {validationErrors?.brandName && (
              <Typography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                {validationErrors.brandName}
              </Typography>
            )}
          </Box>
        </Stack>

        {/* VARIANT */}
        <Box>
          <VirtualizedSelect
            isClearable
            options={variantOptions ?? []}
            value={
              expense.variant
                ? ((variantOptions ?? []).find((o) => o.value === String(expense.variant)) ?? {
                    value: String(expense.variant),
                    label: expense.variantName || "Ukjent variant",
                  })
                : null
            }
            onChange={controller.handleVariantSelect}
            placeholder={
              !selectedProduct
                ? "Velg et produkt først"
                : showVariants
                  ? "Velg variant"
                  : "Ingen varianter på produktet"
            }
            isDisabled={!selectedProduct || !showVariants}
            menuPortalTarget={document.body}
            styles={selectStyles}
          />
        </Box>

        {/* SHOP & LOCATION */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box flex={1}>
            <VirtualizedSelect
              isClearable
              options={shopOptions}
              onInputChange={controller.handleShopInputChange}
              value={expense.shopName ? { label: expense.shopName, value: expense.shopName } : null}
              onChange={controller.handleShopSelect}
              placeholder="Velg butikk"
              isLoading={isLoadingShops}
              menuPortalTarget={document.body}
              styles={selectStyles}
            />
          </Box>

          <Box flex={1}>
            <ExpenseField label="Sted" value={expense.locationName || ""} InputProps={{ readOnly: true }} />
          </Box>
        </Stack>

        {/* PRICE & VOLUME */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
          <Box sx={{ flex: 1, width: "100%" }}>
            <ExpenseField
              label="Pris"
              type="text"
              value={priceInputValue}
              onChange={(e) => handlePriceTextChange(e.target.value)}
              inputProps={{ inputMode: "decimal" }}
              InputProps={{
                startAdornment: <InputAdornment position="start">Kr</InputAdornment>,
              }}
              fullWidth
            />
          </Box>

          <Box sx={{ flex: 1, width: "100%", minWidth: "200px" }}>
            {expense.measurementUnit && selectedProduct?.measures?.length ? (
              <VirtualizedSelect
                isClearable
                options={measuresOptions}
                value={expense.volume ? { label: String(expense.volume), value: expense.volume } : null}
                onChange={controller.handleVolumeChange}
                placeholder="Velg volum"
                menuPortalTarget={document.body}
                styles={selectStyles}
              />
            ) : (
              <ExpenseField
                label="Volum (manuelt)"
                type="text"
                value={volumeInputValue}
                onChange={(e) => handleVolumeTextChange(e.target.value)}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{expense.measurementUnit}</InputAdornment>
                  ),
                }}
                fullWidth
              />
            )}
          </Box>
        </Stack>

        {/* PRICE PER UNIT */}
        <Box>
          <ExpenseField
            label={`Pris per ${expense.measurementUnit || ""}`}
            value={expense.pricePerUnit ?? 0}
            InputProps={{ readOnly: true }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        {/* QUANTITY & DISCOUNT TOGGLE */}
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="center">
          <Box flex={1} width="100%">
            <ExpenseField
              label="Antall"
              type="number"
              value={expense.quantity}
              onChange={(e) =>
                setExpense((prev) => ({
                  ...prev,
                  quantity: Number(e.target.value) || 1,
                }))
              }
            />
          </Box>

          <Box flex={1} width="100%">
            <FormControlLabel
              control={<Checkbox checked={Boolean(expense.hasDiscount)} onChange={controller.handleDiscountToggle} />}
              label="Rabatt?"
            />
          </Box>
        </Stack>

        {/* DISCOUNT FIELDS */}
        {expense.hasDiscount && (
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box flex={1}>
              <ExpenseField
                label="Rabatt (%)"
                type="text"
                value={discountValueInputValue}
                onChange={(e) => handleDiscountValueTextChange(e.target.value)}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">%</InputAdornment>,
                }}
              />
            </Box>
            <Box flex={1}>
              <ExpenseField
                label="Rabatt (kr)"
                type="text"
                value={discountAmountInputValue}
                onChange={(e) => handleDiscountAmountTextChange(e.target.value)}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Kr</InputAdornment>,
                }}
              />
            </Box>
          </Stack>
        )}

        {/* FINAL PRICE */}
        <Box>
          <ExpenseField
            label="Sluttpris"
            value={expense.finalPrice ?? 0}
            InputProps={{
              readOnly: true,
              startAdornment: <InputAdornment position="start">Kr</InputAdornment>,
            }}
          />
        </Box>

        {/* TRANSACTION TYPE */}
        <Box>
          <RadioGroup
            row
            value={expense.purchased ? "kjøpt" : "registrert"}
            onChange={controller.handleTransactionType}
          >
            <FormControlLabel value="kjøpt" control={<Radio />} label="Kjøpt" />
            <FormControlLabel value="registrert" control={<Radio />} label="Registrert" />
          </RadioGroup>
        </Box>

        {/* DATE */}
        <Box>
          <DatePicker
            label="Dato"
            value={controller.pickerDate}
            onChange={controller.handleDateChange}
            slotProps={{ textField: { fullWidth: true } }}
          />
        </Box>
      </Stack>
    </Box>
  );
};

export default ExpenseFormFields;
