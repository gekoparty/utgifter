import React, { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Collapse,
  Stack,
  InputAdornment,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import CreatableSelect from "react-select/creatable";
import VirtualizedSelect from "../../../../components/commons/VirtualizedSelect/VirtualizedSelect";
import ExpenseField from "../../../../components/commons/ExpenseField/ExpenseField";

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

const roundMoney = (value) => Number(value.toFixed(2));

const QUICK_CREATE_CONFIG = {
  brand: {
    button: "Nytt merke",
    title: "Opprett merke",
    nameLabel: "Merkenavn",
    submit: "Lagre merke",
  },
  variant: {
    button: "Ny variant",
    title: "Opprett variant",
    nameLabel: "Variantnavn",
    submit: "Lagre variant",
  },
  shop: {
    button: "Ny butikk",
    title: "Opprett butikk",
    nameLabel: "Butikknavn",
    submit: "Lagre butikk",
  },
};

const QuickCreatePanel = ({
  type,
  disabled,
  disabledText,
  onCreate,
  selectStyles,
  locationOptions = [],
  categoryOptions = [],
  isLoadingLocations = false,
  isLoadingCategories = false,
  isLocationError = false,
  isCategoryError = false,
}) => {
  const config = QUICK_CREATE_CONFIG[type];
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isShop = type === "shop";
  const canSubmit =
    name.trim().length > 0 &&
    (!isShop ||
      (locationName.trim().length > 0 && categoryName.trim().length > 0));
  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined;

  const selectedLocation = useMemo(() => {
    if (!locationName) return null;
    return (
      locationOptions.find((option) => option.label === locationName) ?? {
        value: `temp-${locationName}`,
        label: locationName,
      }
    );
  }, [locationName, locationOptions]);

  const selectedCategory = useMemo(() => {
    if (!categoryName) return null;
    return (
      categoryOptions.find((option) => option.label === categoryName) ?? {
        value: `temp-${categoryName}`,
        label: categoryName,
      }
    );
  }, [categoryName, categoryOptions]);

  const reset = () => {
    setName("");
    setLocationName("");
    setCategoryName("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!canSubmit || saving || disabled) return;

    setSaving(true);
    setError("");

    try {
      await onCreate?.({
        name: name.trim(),
        locationName: locationName.trim(),
        categoryName: categoryName.trim(),
      });
      reset();
      setOpen(false);
    } catch (err) {
      const validationMessage = Array.isArray(err?.inner)
        ? err.inner
            .map((item) => item?.message)
            .filter(Boolean)
            .join(" ")
        : "";

      setError(
        err?.message === "duplicate"
          ? "Denne finnes allerede."
          : validationMessage || err?.message || "Kunne ikke lagre. Prøv igjen.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Button
        size="small"
        variant="text"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        sx={{ px: 0, textTransform: "none", fontWeight: 800 }}
      >
        {config.button}
      </Button>

      {disabled && disabledText ? (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ ml: 1, verticalAlign: "middle" }}
        >
          {disabledText}
        </Typography>
      ) : null}

      <Collapse in={open && !disabled} timeout={180}>
        <Paper
          variant="outlined"
          sx={{
            mt: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "rgba(255,255,255,0.035)",
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="body2" sx={{ fontWeight: 900 }}>
              {config.title}
            </Typography>

            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <ExpenseField
                label={config.nameLabel}
                value={name}
                onChange={(event) => setName(event.target.value)}
                fullWidth
              />

              {isShop ? (
                <>
                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <FieldLabel>Sted</FieldLabel>
                    <CreatableSelect
                      styles={selectStyles}
                      options={locationOptions}
                      value={selectedLocation}
                      onChange={(selected) =>
                        setLocationName(selected?.label || "")
                      }
                      onCreateOption={(input) =>
                        setLocationName(input.trim())
                      }
                      placeholder="Velg sted..."
                      isClearable
                      isLoading={isLoadingLocations}
                      menuPortalTarget={menuPortalTarget}
                      isValidNewOption={(input) => {
                        const value = input.trim();
                        return (
                          Boolean(value) &&
                          !locationOptions.some(
                            (option) => option.label === value
                          )
                        );
                      }}
                      formatCreateLabel={(input) => `Nytt sted: ${input}`}
                    />
                    {isLoadingLocations ? <LinearProgress /> : null}
                    {isLocationError ? (
                      <Typography variant="caption" color="error">
                        Kunne ikke laste steder.
                      </Typography>
                    ) : null}
                  </Stack>

                  <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                    <FieldLabel>Kategori</FieldLabel>
                    <CreatableSelect
                      styles={selectStyles}
                      options={categoryOptions}
                      value={selectedCategory}
                      onChange={(selected) =>
                        setCategoryName(selected?.label || "")
                      }
                      onCreateOption={(input) =>
                        setCategoryName(input.trim())
                      }
                      placeholder="Velg kategori..."
                      isClearable
                      isLoading={isLoadingCategories}
                      menuPortalTarget={menuPortalTarget}
                      isValidNewOption={(input) => {
                        const value = input.trim();
                        return (
                          Boolean(value) &&
                          !categoryOptions.some(
                            (option) => option.label === value
                          )
                        );
                      }}
                      formatCreateLabel={(input) => `Ny kategori: ${input}`}
                    />
                    {isLoadingCategories ? <LinearProgress /> : null}
                    {isCategoryError ? (
                      <Typography variant="caption" color="error">
                        Kunne ikke laste kategorier.
                      </Typography>
                    ) : null}
                  </Stack>
                </>
              ) : null}
            </Stack>

            {error ? <Alert severity="warning">{error}</Alert> : null}

            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                size="small"
                color="inherit"
                disabled={saving}
                onClick={() => {
                  reset();
                  setOpen(false);
                }}
              >
                Avbryt
              </Button>
              <Button
                size="small"
                variant="contained"
                disabled={!canSubmit || saving}
                onClick={handleSubmit}
              >
                {saving ? <CircularProgress size={18} /> : config.submit}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>
    </Box>
  );
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
  quickCreate,
}) => {
  const [discountCalculatorOpen, setDiscountCalculatorOpen] = useState(false);
  const [knownDiscountedPrice, setKnownDiscountedPrice] = useState("");
  const [knownDiscountPercent, setKnownDiscountPercent] = useState("");
  const [discountCalculatorError, setDiscountCalculatorError] = useState("");

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
        locationId: expense.locationId || "",
        locationName: expense.locationName || "",
      }
    );
  }, [
    expense.shopId,
    expense.shopName,
    expense.locationId,
    expense.locationName,
    shopOptions,
  ]);

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

  const calculatedOriginalPrice = useMemo(() => {
    const discounted = parseDecimalOrNull(knownDiscountedPrice);
    const percent = parseDecimalOrNull(knownDiscountPercent);

    if (discounted == null || percent == null || percent <= 0 || percent >= 100) {
      return null;
    }

    return roundMoney(discounted / (1 - percent / 100));
  }, [knownDiscountedPrice, knownDiscountPercent]);

  const applyDiscountCalculator = () => {
    const discounted = parseDecimalOrNull(knownDiscountedPrice);
    const percent = parseDecimalOrNull(knownDiscountPercent);

    if (discounted == null || discounted <= 0) {
      setDiscountCalculatorError("Skriv inn sluttprisen du faktisk betalte.");
      return;
    }

    if (percent == null || percent <= 0 || percent >= 100) {
      setDiscountCalculatorError("Rabattprosenten må være mellom 0 og 100.");
      return;
    }

    const originalPrice = roundMoney(discounted / (1 - percent / 100));
    const discountAmount = roundMoney(originalPrice - discounted);

    controller.handleFieldChange?.("price", originalPrice, {
      hasDiscount: true,
      discountValue: percent,
      discountAmount,
      priceText: String(originalPrice),
      discountValueText: String(percent),
      discountAmountText: String(discountAmount),
    });

    setDiscountCalculatorError("");
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

                <QuickCreatePanel
                  type="brand"
                  disabled={!quickCreate?.hasSelectedProductId}
                  disabledText="Velg produkt fra listen først"
                  selectStyles={selectStyles}
                  onCreate={({ name }) => quickCreate?.createBrand?.(name)}
                />
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

                <QuickCreatePanel
                  type="variant"
                  disabled={!quickCreate?.hasSelectedProductId}
                  disabledText="Velg produkt fra listen først"
                  selectStyles={selectStyles}
                  onCreate={({ name }) => quickCreate?.createVariant?.(name)}
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

                <QuickCreatePanel
                  type="shop"
                  selectStyles={selectStyles}
                  locationOptions={quickCreate?.locationOptions}
                  categoryOptions={quickCreate?.categoryOptions}
                  isLoadingLocations={quickCreate?.isLoadingLocations}
                  isLoadingCategories={quickCreate?.isLoadingCategories}
                  isLocationError={quickCreate?.isLocationError}
                  isCategoryError={quickCreate?.isCategoryError}
                  onCreate={(payload) => quickCreate?.createShop?.(payload)}
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
                  {validationErrors?.volume && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.75, display: "block" }}
                    >
                      {validationErrors.volume}
                    </Typography>
                  )}
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

                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => setDiscountCalculatorOpen((open) => !open)}
                    sx={{
                      alignSelf: "flex-start",
                      borderRadius: 2,
                      textTransform: "none",
                      fontWeight: 800,
                    }}
                  >
                    Regn ut førpris
                  </Button>

                  <Collapse in={discountCalculatorOpen} timeout={220}>
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
                            onChange={(e) => {
                              setKnownDiscountedPrice(e.target.value);
                              setDiscountCalculatorError("");
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
                            onChange={(e) => {
                              setKnownDiscountPercent(e.target.value);
                              setDiscountCalculatorError("");
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

                        {discountCalculatorError && (
                          <Alert severity="warning">{discountCalculatorError}</Alert>
                        )}

                        <Button
                          variant="contained"
                          onClick={applyDiscountCalculator}
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
                </Box>

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
