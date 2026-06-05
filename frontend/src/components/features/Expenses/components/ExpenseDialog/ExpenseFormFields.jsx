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
  Paper,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import VirtualizedSelect from "../../../../commons/VirtualizedSelect/VirtualizedSelect";
import ExpenseField from "../../../../commons/ExpenseField/ExpenseField";

const FieldLabel = ({ children }) => (
  <Typography
    variant="caption"
    sx={{
      display: "block",
      mb: 0.75,
      fontWeight: 800,
      color: "text.secondary",
    }}
  >
    {children}
  </Typography>
);

const Section = ({ title, children }) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 1.75, sm: 2.25 },
      borderRadius: { xs: 2, sm: 3 },
      bgcolor: "rgba(255,255,255,0.035)",
      backgroundImage:
        "linear-gradient(135deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018))",
      border: "1px solid",
      borderColor: "rgba(255,255,255,0.12)",
      boxShadow: "0 18px 45px rgba(0,0,0,0.22)",
    }}
  >
    <Typography
      variant="subtitle1"
      sx={{
        mb: 2,
        fontWeight: 900,
        color: "text.primary",
      }}
    >
      {title}
    </Typography>

    {children}
  </Paper>
);

const normalizeDecimal = (s) =>
  String(s ?? "")
    .replace(/\s/g, "")
    .replace(",", ".");

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
  const priceInputValue =
    expense.priceText ?? formatDecimalForInput(expense.price);
  const volumeInputValue =
    expense.volumeText ?? formatDecimalForInput(expense.volume);
  const discountValueInputValue =
    expense.discountValueText ?? formatDecimalForInput(expense.discountValue);
  const discountAmountInputValue =
    expense.discountAmountText ?? formatDecimalForInput(expense.discountAmount);

  const measuresOptions = useMemo(() => {
    const measures = selectedProduct?.measures || [];
    return measures.map((m) => ({ label: String(m), value: m }));
  }, [selectedProduct]);

  const showVariants =
    Boolean(selectedProduct) && (variantOptions?.length ?? 0) > 0;

  const selectedShopValue = useMemo(() => {
    const id = String(expense.shopId || "").trim();
    if (!id) return null;

    return (
      shopOptions.find((o) => String(o.value) === id) ?? {
        value: id,
        label: expense.shopName || "Ukjent butikk",
        name: expense.shopName || "Ukjent butikk",
        locationName: expense.locationName || "",
      }
    );
  }, [expense.shopId, expense.shopName, expense.locationName, shopOptions]);

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
    if (parsed !== null)
      controller.handleFieldChange?.("discountValue", parsed);
  };

  const handleDiscountAmountTextChange = (text) => {
    setExpense((prev) => ({ ...prev, discountAmountText: text }));
    const parsed = parseDecimalOrNull(text);
    if (parsed !== null)
      controller.handleFieldChange?.("discountAmount", parsed);
  };

  return (
    <Box sx={{ p: { xs: 0, sm: 1, md: 2 }, maxWidth: 1120, mx: "auto" }}>
      <Stack spacing={2.5}>
        <Section title="Detaljer">
          <Stack spacing={2}>
            <Box>
              <FieldLabel>Produkt</FieldLabel>
              <VirtualizedSelect
                isClearable
                options={productOptions}
                value={
                  selectedProduct ??
                  (expense.productName
                    ? {
                        label: expense.productName,
                        value: expense.productName,
                        name: expense.productName,
                      }
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

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box flex={1}>
                <FieldLabel>Merke</FieldLabel>
                <VirtualizedSelect
                  isClearable
                  options={brandOptions}
                  value={
                    expense.brandName
                      ? brandOptions.find(
                          (o) =>
                            o.name === expense.brandName ||
                            o.label === expense.brandName ||
                            String(o.value) === String(expense.brandName),
                        ) ?? {
                          label: expense.brandName,
                          value: expense.brandName,
                          name: expense.brandName,
                        }
                      : null
                  }
                  onChange={(opt) => {
                    clearFieldError?.("brandName");
                    controller.handleBrandSelect(opt);
                  }}
                  placeholder={
                    selectedProduct ? "Velg merke" : "Velg et produkt først"
                  }
                  isLoading={isLoadingBrands}
                  menuPortalTarget={document.body}
                  isDisabled={!selectedProduct}
                  styles={selectStyles}
                />

                {validationErrors?.brandName && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.75, display: "block" }}
                  >
                    {validationErrors.brandName}
                  </Typography>
                )}
              </Box>

              <Box flex={1}>
                <FieldLabel>Variant</FieldLabel>
                <VirtualizedSelect
                  isClearable
                  options={variantOptions ?? []}
                  value={
                    expense.variant
                      ? (variantOptions ?? []).find(
                          (o) => o.value === String(expense.variant),
                        ) ?? {
                          value: String(expense.variant),
                          label: expense.variantName || "Ukjent variant",
                        }
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
            </Stack>

            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <Box flex={1}>
                <FieldLabel>Butikk</FieldLabel>
                <VirtualizedSelect
                  isClearable
                  options={shopOptions}
                  onInputChange={controller.handleShopInputChange}
                  value={selectedShopValue}
                  onChange={controller.handleShopSelect}
                  placeholder="Velg butikk"
                  isLoading={isLoadingShops}
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              </Box>

              <Box flex={1}>
                <ExpenseField
                  label="Sted"
                  value={expense.locationName || ""}
                  InputProps={{ readOnly: true }}
                  fullWidth
                />
              </Box>
            </Stack>
          </Stack>
        </Section>

        <Section title="Pris og mengde">
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
              <ExpenseField
                label="Pris"
                type="text"
                value={priceInputValue}
                onChange={(e) => handlePriceTextChange(e.target.value)}
                inputProps={{ inputMode: "decimal" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Kr</InputAdornment>
                  ),
                }}
                fullWidth
              />

              {expense.measurementUnit && selectedProduct?.measures?.length ? (
                <Box flex={1}>
                  <FieldLabel>Volum</FieldLabel>
                  <VirtualizedSelect
                    isClearable
                    options={measuresOptions}
                    value={
                      expense.volume
                        ? {
                            label: String(expense.volume),
                            value: expense.volume,
                          }
                        : null
                    }
                    onChange={controller.handleVolumeChange}
                    placeholder="Velg volum"
                    menuPortalTarget={document.body}
                    styles={selectStyles}
                  />
                </Box>
              ) : (
                <ExpenseField
                  label="Volum (manuelt)"
                  type="text"
                  value={volumeInputValue}
                  onChange={(e) => handleVolumeTextChange(e.target.value)}
                  inputProps={{ inputMode: "decimal" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {expense.measurementUnit}
                      </InputAdornment>
                    ),
                  }}
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
                onChange={(e) =>
                  setExpense((prev) => ({
                    ...prev,
                    quantity: Number(e.target.value) || 1,
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

            {expense.hasDiscount && (
              <>
                <Divider sx={{ borderStyle: "dashed" }} />

                <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                  <ExpenseField
                    label="Rabatt (%)"
                    type="text"
                    value={discountValueInputValue}
                    onChange={(e) =>
                      handleDiscountValueTextChange(e.target.value)
                    }
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
                    onChange={(e) =>
                      handleDiscountAmountTextChange(e.target.value)
                    }
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
            )}
          </Stack>
        </Section>

        <Section title="Status og dato">
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <Box flex={1}>
              <FieldLabel>Status</FieldLabel>
              <RadioGroup
                row
                value={expense.purchased ? "kjøpt" : "registrert"}
                onChange={controller.handleTransactionType}
                sx={{
                  gap: 1,
                  flexDirection: { xs: "column", sm: "row" },
                  "& .MuiFormControlLabel-root": {
                    m: 0,
                    px: 2,
                    py: 1,
                    minWidth: { xs: "100%", sm: 140 },
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "rgba(255,255,255,0.14)",
                    bgcolor: "rgba(255,255,255,0.035)",
                  },
                  "& .MuiFormControlLabel-root:has(.Mui-checked)": {
                    borderColor: "primary.main",
                    bgcolor: "rgba(59,130,246,0.16)",
                  },
                }}
              >
                <FormControlLabel
                  value="kjøpt"
                  control={<Radio />}
                  label="Kjøpt"
                />
                <FormControlLabel
                  value="registrert"
                  control={<Radio />}
                  label="Registrert"
                />
              </RadioGroup>
            </Box>

            <Box flex={1}>
              <DatePicker
                label="Dato"
                value={controller.pickerDate}
                onChange={controller.handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>
          </Stack>
        </Section>
      </Stack>
    </Box>
  );
};

export default ExpenseFormFields;
