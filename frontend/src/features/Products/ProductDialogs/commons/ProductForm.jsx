import React, { useMemo } from "react";
import { Stack } from "@mui/material";
import ProductNameInput from "./ProductNameInput.jsx";
import BrandSelect from "./BrandSelect";
import CategorySelect from "./CategorySelect";
import MeasurementUnitSelect from "./MeasurementUnitSelect";
import MeasuresInput from "./MeasuresInput";
import VariantsInput from "./VariantsInput";
import ProductVariantManager from "./ProductVariantManager";
import FieldErrorText from "../../../../components/commons/ErrorHandling/FieldErrorText";
import FormErrorAlert from "../../../../components/commons/ErrorHandling/FormErrorAlert";
import {
  predefinedTypes as predefinedCategories,
  measurementUnitOptions,
} from "../../../../components/commons/Consts/constants";

const ProductForm = ({
  product,
  onNameChange,
  onBrandChange,
  onBrandCreate,
  // ✅ variants
  variantOptions,
  showVariantManager,
  variantActionError,
  busyVariantId,
  onVariantsChange,
  onVariantCreate,
  onVariantRename,
  onVariantDelete,
  onProductCategoryChange,
  onMeasurementUnitChange,
  onMeasuresChange,
  onMeasureCreate,
  brandOptions,
  selectStyles,
  loading,
  validationError,
  displayError,
  onInputChange,
  onMenuScrollToBottom,
  inputValue,
}) => {
  const formattedBrandOptions = useMemo(
  () =>
    (brandOptions ?? []).map((b) => ({
      label: b.name,
      value: String(b._id),
    })),
  [brandOptions],
);

const selectedBrandValues = useMemo(() => {
  return product?.brandSelections ?? [];
}, [product?.brandSelections]);

  

  // ✅ product.variants is array of ids -> map ids to option objects
  // If options haven't loaded yet, show fallback {label:id,value:id}, then swap to names once options arrive.
  const selectedVariantValues = useMemo(() => {
    const raw = (product?.variants ?? []).map(String).filter(Boolean);
    const opts = variantOptions ?? [];
    const map = new Map(opts.map((o) => [String(o.value), o]));
    return raw.map(
      (v) => map.get(String(v)) ?? { label: String(v), value: String(v) },
    );
  }, [product?.variants, variantOptions]);

  return (
    <Stack spacing={2}>
      {displayError && <FormErrorAlert resource="products" />}

      <div>
        <ProductNameInput
          value={product?.name || ""}
          onChange={onNameChange}
          error={validationError?.name}
        />
        {(displayError || validationError) && (
          <FieldErrorText resource="products" field="name" />
        )}
      </div>

      <div>
        <VariantsInput
          options={variantOptions ?? []}
          value={selectedVariantValues}
          onChange={onVariantsChange}
          onCreateOption={onVariantCreate}
          selectStyles={selectStyles}
          isLoading={loading}
        />

        {showVariantManager && (
          <ProductVariantManager
            variants={selectedVariantValues}
            disabled={loading}
            error={variantActionError}
            busyVariantId={busyVariantId}
            onRename={onVariantRename}
            onDelete={onVariantDelete}
          />
        )}

        {(displayError || validationError) && (
          <FieldErrorText resource="products" field="variants" />
        )}
      </div>

      <div>
        <BrandSelect
          options={formattedBrandOptions}
          value={selectedBrandValues}
          onChange={onBrandChange}
          onCreateOption={onBrandCreate}
          isLoading={loading}
          selectStyles={selectStyles}
          onInputChange={onInputChange}
          onMenuScrollToBottom={onMenuScrollToBottom}
          inputValue={inputValue}
        />
        {(displayError || validationError) && (
          <FieldErrorText resource="products" field="brands" />
        )}
      </div>

      <div>
        <CategorySelect
          options={predefinedCategories.map((c) => ({ value: c, label: c }))}
          value={
            product?.category
              ? { value: product.category, label: product.category }
              : null
          }
          onChange={onProductCategoryChange}
          selectStyles={selectStyles}
        />

        {(displayError || validationError) && (
          <FieldErrorText resource="products" field="category" />
        )}
      </div>

      <div>
        <MeasurementUnitSelect
          options={measurementUnitOptions}
          value={
            measurementUnitOptions.find(
              (o) => o.value === product?.measurementUnit,
            ) || null
          }
          onChange={onMeasurementUnitChange}
          selectStyles={selectStyles}
        />
        {(displayError || validationError) && (
          <FieldErrorText resource="products" field="measurementUnit" />
        )}
      </div>

      <div>
        <MeasuresInput
          value={(product?.measures ?? []).map((m) => ({ value: m, label: m }))}
          onChange={onMeasuresChange}
          onCreateOption={onMeasureCreate}
          selectStyles={selectStyles}
        />
        {(displayError || validationError) && (
          <FieldErrorText resource="products" field="measures" />
        )}
      </div>
    </Stack>
  );
};

export default React.memo(ProductForm);
