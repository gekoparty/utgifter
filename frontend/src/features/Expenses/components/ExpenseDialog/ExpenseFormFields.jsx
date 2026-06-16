import React, { useMemo, useState } from "react";
import { Box, Stack } from "@mui/material";
import DetailsSection from "./sections/DetailsSection";
import PriceQuantitySection from "./sections/PriceQuantitySection";
import StatusDateSection from "./sections/StatusDateSection";
import {
  formatDecimalForInput,
  parseDecimalOrNull,
  roundMoney,
} from "../../utils/numberInput";

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
    <Box sx={{ p: { xs: 0, sm: 1, md: 2 }, maxWidth: 1120, mx: "auto" }}>
      <Stack spacing={2.5}>
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
