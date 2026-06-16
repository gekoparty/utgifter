import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import VirtualizedSelect from "../../../../../components/commons/VirtualizedSelect/VirtualizedSelect";
import ExpenseField from "../../../../../components/commons/ExpenseField/ExpenseField";
import FieldLabel from "../../../../../components/commons/Forms/FieldLabel";
import FormSection from "../../../../../components/commons/Forms/FormSection";
import InlineQuickCreatePanel from "./InlineQuickCreatePanel";

export default function DetailsSection({
  expense,
  selectStyles,
  productOptions,
  brandOptions,
  variantOptions,
  shopOptions,
  selectedProduct,
  selectedShopValue,
  showVariants,
  hasNextPage,
  fetchNextPage,
  isLoadingProducts,
  isLoadingBrands,
  isLoadingShops,
  controller,
  validationErrors,
  clearFieldError,
  quickCreate,
}) {
  const menuPortalTarget =
    typeof document !== "undefined" ? document.body : undefined;

  return (
    <FormSection title="Detaljer">
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

            <InlineQuickCreatePanel
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

            <InlineQuickCreatePanel
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
              menuPortalTarget={menuPortalTarget}
              styles={selectStyles}
            />

            <InlineQuickCreatePanel
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
    </FormSection>
  );
}
