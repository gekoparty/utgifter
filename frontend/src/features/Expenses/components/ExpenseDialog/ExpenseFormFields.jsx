import React, { lazy, Suspense, useMemo, useState } from "react";
import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DetailsSection from "./sections/DetailsSection";
import PriceQuantitySection from "./sections/PriceQuantitySection";
import StatusDateSection from "./sections/StatusDateSection";
import {
  formatDecimalForInput,
  parseDecimalOrNull,
  roundMoney,
} from "../../utils/numberInput";

const ReceiptImportPanel = lazy(() => import("./sections/ReceiptImportPanel"));

const ExpenseFormFields = ({
  expense,
  setExpense,
  selectStyles,
  productOptions = [],
  brandOptions = [],
  variantOptions = [],
  shopOptions = [],
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
  const [receiptPanelOpen, setReceiptPanelOpen] = useState(false);
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
    return measures.map((measure) => ({ label: String(measure), value: measure }));
  }, [selectedProduct]);

  const showVariants =
    Boolean(selectedProduct) && (variantOptions?.length ?? 0) > 0;

  const selectedShopValue = useMemo(() => {
    const id = String(expense.shopId || "").trim();
    if (!id) return null;

    return (
      shopOptions.find((option) => String(option.value) === id) ?? {
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
    setExpense((previous) => ({ ...previous, priceText: text }));
    const parsed = parseDecimalOrNull(text);
    if (parsed !== null) controller.handleFieldChange?.("price", parsed);
  };

  const handleVolumeTextChange = (text) => {
    setExpense((previous) => ({ ...previous, volumeText: text }));
    const parsed = parseDecimalOrNull(text);
    if (parsed !== null) controller.handleFieldChange?.("volume", parsed);
  };

  const handleDiscountValueTextChange = (text) => {
    setExpense((previous) => ({ ...previous, discountValueText: text }));
    const parsed = parseDecimalOrNull(text);
    if (parsed !== null)
      controller.handleFieldChange?.("discountValue", parsed);
  };

  const handleDiscountAmountTextChange = (text) => {
    setExpense((previous) => ({ ...previous, discountAmountText: text }));
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
    <Box sx={{ p: { xs: 0, sm: 1, md: 1.5 }, maxWidth: 1080, mx: "auto" }}>
      <Stack spacing={1.75}>
        <Box
          sx={{
            px: { xs: 1, sm: 1.25 },
            py: 1,
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
          >
            <Typography variant="body2" color="text.secondary" fontWeight={800}>
              Registrering
            </Typography>
            <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
              {["1 Produkt", "2 Pris", "3 Dato/status"].map((label) => (
                <Chip
                  key={label}
                  size="small"
                  label={label}
                  variant="outlined"
                  sx={{ fontWeight: 850 }}
                />
              ))}
            </Stack>
          </Stack>
        </Box>

        {receiptPanelOpen ? (
          <Suspense fallback={null}>
            <ReceiptImportPanel
              onUseProduct={controller.handleProductSelect}
              onUseBrand={controller.handleBrandSelect}
              onUseShop={controller.handleShopSelect}
            />
          </Suspense>
        ) : (
          <Box
            sx={{
              px: { xs: 1, sm: 1.25 },
              py: 1,
              borderRadius: 2,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "background.default",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={850}>
                  Kvittering
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Valgfritt. Åpnes bare når du vil analysere bilde eller PDF.
                </Typography>
              </Box>
              <Button
                type="button"
                size="small"
                variant="outlined"
                startIcon={<UploadFileIcon />}
                onClick={() => setReceiptPanelOpen(true)}
                sx={{ alignSelf: { sm: "center" }, fontWeight: 850 }}
              >
                Bruk kvittering
              </Button>
            </Stack>
          </Box>
        )}

        <DetailsSection
          expense={expense}
          selectStyles={selectStyles}
          productOptions={productOptions}
          brandOptions={brandOptions}
          variantOptions={variantOptions}
          shopOptions={shopOptions}
          selectedProduct={selectedProduct}
          selectedShopValue={selectedShopValue}
          showVariants={showVariants}
          hasNextPage={hasNextPage}
          fetchNextPage={fetchNextPage}
          isLoadingProducts={isLoadingProducts}
          isLoadingBrands={isLoadingBrands}
          isLoadingShops={isLoadingShops}
          controller={controller}
          validationErrors={validationErrors}
          clearFieldError={clearFieldError}
          quickCreate={quickCreate}
        />

        <PriceQuantitySection
          expense={expense}
          setExpense={setExpense}
          selectedProduct={selectedProduct}
          measuresOptions={measuresOptions}
          selectStyles={selectStyles}
          controller={controller}
          validationErrors={validationErrors}
          priceInputValue={priceInputValue}
          volumeInputValue={volumeInputValue}
          discountValueInputValue={discountValueInputValue}
          discountAmountInputValue={discountAmountInputValue}
          onPriceTextChange={handlePriceTextChange}
          onVolumeTextChange={handleVolumeTextChange}
          onDiscountValueTextChange={handleDiscountValueTextChange}
          onDiscountAmountTextChange={handleDiscountAmountTextChange}
          discountCalculatorOpen={discountCalculatorOpen}
          onToggleDiscountCalculator={() =>
            setDiscountCalculatorOpen((open) => !open)
          }
          knownDiscountedPrice={knownDiscountedPrice}
          onKnownDiscountedPriceChange={setKnownDiscountedPrice}
          knownDiscountPercent={knownDiscountPercent}
          onKnownDiscountPercentChange={setKnownDiscountPercent}
          calculatedOriginalPrice={calculatedOriginalPrice}
          discountCalculatorError={discountCalculatorError}
          onClearDiscountCalculatorError={() => setDiscountCalculatorError("")}
          onApplyDiscountCalculator={applyDiscountCalculator}
        />

        <StatusDateSection expense={expense} controller={controller} />
      </Stack>
    </Box>
  );
};

export default ExpenseFormFields;
