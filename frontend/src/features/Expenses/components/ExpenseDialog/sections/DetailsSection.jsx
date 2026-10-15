import React from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import VirtualizedSelect from "../../../../../components/commons/VirtualizedSelect/VirtualizedSelect";
import FieldLabel from "../../../../../components/commons/Forms/FieldLabel";
import FormSection from "../../../../../components/commons/Forms/FormSection";

const QuickCreateAction = ({ children, disabled, disabledText, onClick }) => (
  <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
    <Button
      type="button"
      size="small"
      variant="text"
      startIcon={<AddIcon fontSize="small" />}
      disabled={disabled}
      onClick={onClick}
      sx={{ px: 0.5, minWidth: 0, fontWeight: 850 }}
    >
      {children}
    </Button>
    {disabled && disabledText ? (
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {disabledText}
      </Typography>
    ) : null}
  </Stack>
);

export default function DetailsSection({
  expense,
  selectStyles,
  productOptions,
  brandOptions,
  variantOptions,
  shopOptions,
  locationOptions,
  selectedProduct,
  selectedShopValue,
  selectedLocationValue,
  hasSelectedShop,
  showVariants,
  hasNextPage,
  fetchNextPage,
  isLoadingProducts,
  isLoadingBrands,
  isLoadingShops,
  isLoadingLocations,
  controller,
  validationErrors,
  clearFieldError,
  quickCreate,
}) {
  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined;

  return (
    <FormSection
      step="1"
      title="Produkt"
      description="Velg produkt, merke, variant og butikk før du fyller inn pris."
    >
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
            menuPortalTarget={menuPortalTarget}
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
                      (option) =>
                        option.name === expense.brandName ||
                        option.label === expense.brandName ||
                        String(option.value) === String(expense.brandName),
                    ) ?? {
                      label: expense.brandName,
                      value: expense.brandName,
                      name: expense.brandName,
                    }
                  : null
              }
              onChange={(option) => {
                clearFieldError?.("brandName");
                controller.handleBrandSelect(option);
              }}
              placeholder={selectedProduct ? "Velg merke" : "Velg et produkt først"}
              isLoading={isLoadingBrands}
              menuPortalTarget={menuPortalTarget}
              isDisabled={!selectedProduct}
              styles={selectStyles}
            />

            {validationErrors?.brandName ? (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 0.75, display: "block" }}
              >
                {validationErrors.brandName}
              </Typography>
            ) : null}

            <QuickCreateAction
              disabled={!quickCreate?.hasSelectedProductId}
              disabledText="Velg produkt fra listen først"
              onClick={quickCreate?.openBrandDialog}
            >
              Nytt merke
            </QuickCreateAction>
          </Box>

          <Box flex={1}>
            <FieldLabel>Variant</FieldLabel>
            <VirtualizedSelect
              isClearable
              options={variantOptions ?? []}
              value={
                expense.variant
                  ? (variantOptions ?? []).find(
                      (option) => option.value === String(expense.variant),
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
              menuPortalTarget={menuPortalTarget}
              styles={selectStyles}
            />

            <QuickCreateAction
              disabled={!quickCreate?.hasSelectedProductId}
              disabledText="Velg produkt fra listen først"
              onClick={quickCreate?.openVariantDialog}
            >
              Ny variant
            </QuickCreateAction>
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
              menuPortalTarget={menuPortalTarget}
              styles={selectStyles}
            />

            <QuickCreateAction onClick={quickCreate?.openShopDialog}>
              Ny butikk
            </QuickCreateAction>
          </Box>

          <Box flex={1}>
            <FieldLabel>Sted</FieldLabel>
            <VirtualizedSelect
              isClearable
              options={locationOptions}
              value={selectedLocationValue}
              onChange={controller.handleLocationSelect}
              placeholder={hasSelectedShop ? "Velg sted" : "Velg butikk først"}
              isLoading={isLoadingLocations}
              isDisabled={!hasSelectedShop || locationOptions.length === 0}
              menuPortalTarget={menuPortalTarget}
              styles={selectStyles}
            />
          </Box>
        </Stack>
      </Stack>
    </FormSection>
  );
}
