import React, { useMemo } from "react";
import { Stack } from "@mui/material";
import ProductNameInput from "./ProductNameInput.jsx";
import BrandSelect from "./BrandSelect";
import CategorySelect from "./CategorySelect";
import MeasurementUnitSelect from "./MeasurementUnitSelect";
import MeasuresInput from "./MeasuresInput";
import VariantsInput from "./VariantsInput";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import {
  predefinedTypes as predefinedCategories,
  measurementUnitOptions,
} from "../../../../commons/Consts/constants";

const ProductForm = ({
  product,
  onNameChange,
  onBrandChange,
  onBrandCreate,

  // ✅ variants
  variantOptions,
  onVariantsChange,
  onVariantCreate,

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
        value: b.name,
      })),
    [brandOptions]
  );

  const selectedBrandValues = useMemo(() => {
    const names =
      product?.brandNames ??
      (Array.isArray(product?.brands) && typeof product.brands[0] === "string"
        ? product.brands
        : []);

    return names.map((name) => ({ label: name, value: name }));
  }, [product?.brandNames, product?.brands]);

  // ✅ product.variants is array of ids -> map ids to option objects
  // If options haven't loaded yet, show fallback {label:id,value:id}, then swap to names once options arrive.
const selectedVariantValues = useMemo(() => {
  const raw = (product?.variants ?? []).map(String).filter(Boolean)
  const opts = variantOptions ?? [];
  const map = new Map(opts.map((o) => [String(o.value), o]));
 return raw.map((v) => map.get(String(v)) ?? { label: String(v), value: String(v) });
}, [product?.variants, variantOptions]);

  return (
    <Stack spacing={2}>
      <div>
        <ProductNameInput
          value={product?.name || ""}
          onChange={onNameChange}
          error={validationError?.name}
        />
        {(displayError || validationError) && (
          <ErrorHandling resource="products" field="name" loading={loading} />
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

        {(displayError || validationError) && (
          <ErrorHandling resource="products" field="variants" loading={loading} />
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
          <ErrorHandling resource="products" field="brands" loading={loading} />
        )}
      </div>

      <div>
        <CategorySelect
          options={predefinedCategories.map((c) => ({ value: c, label: c }))}
          value={
            product?.category ? { value: product.category, label: product.category } : null
          }
          onChange={onProductCategoryChange}
          selectStyles={selectStyles}
        />

        {(displayError || validationError) && (
          <ErrorHandling resource="products" field="category" loading={loading} />
        )}
      </div>

      <div>
        <MeasurementUnitSelect
          options={measurementUnitOptions}
          value={
            measurementUnitOptions.find((o) => o.value === product?.measurementUnit) || null
          }
          onChange={onMeasurementUnitChange}
          selectStyles={selectStyles}
        />
        {(displayError || validationError) && (
          <ErrorHandling resource="products" field="measurementUnit" loading={loading} />
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
          <ErrorHandling resource="products" field="measures" loading={loading} />
        )}
      </div>
    </Stack>
  );
};

export default React.memo(ProductForm);
