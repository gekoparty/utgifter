// src/commons/ProductForm/ProductForm.js
import React, { useMemo } from "react";
import { Stack } from "@mui/material";
import ProductNameInput from "./ProductNameInput.jsx";
import BrandSelect from "./BrandSelect";
import ProductTypeSelect from "./ProductTypeSelect";
import MeasurementUnitSelect from "./MeasurementUnitSelect";
import MeasuresInput from "./MeasuresInput";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import {
  predefinedTypes,
  measurementUnitOptions,
} from "../../../../commons/Consts/constants";

const ProductForm = ({
  product,
  onNameChange,
  onBrandChange,
  onBrandCreate,
  onProductTypeChange,
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
  // options from API -> react-select shape
  const formattedBrandOptions = useMemo(
    () =>
      (brandOptions ?? []).map((b) => ({
        label: b.name,
        value: b.name,
      })),
    [brandOptions]
  );

  // product.brandNames is array of strings (brand names)
  const selectedBrandValues = useMemo(() => {
    const names =
      product?.brandNames ??
      (Array.isArray(product?.brands) && typeof product.brands[0] === "string"
        ? product.brands
        : []);

    return names.map((name) => ({ label: name, value: name }));
  }, [product?.brandNames, product?.brands]);

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
          // ✅ MUST be "brands" (matches Yup schema path + your reducer storage)
          <ErrorHandling resource="products" field="brands" loading={loading} />
        )}
      </div>

      <div>
        <ProductTypeSelect
          options={predefinedTypes.map((type) => ({ value: type, label: type }))}
          value={
            product?.type
              ? { value: product.type, label: product.type }
              : null
          }
          onChange={onProductTypeChange}
          selectStyles={selectStyles}
        />
        {(displayError || validationError) && (
          <ErrorHandling resource="products" field="type" loading={loading} />
        )}
      </div>

      <div>
        <MeasurementUnitSelect
          options={measurementUnitOptions}
          value={
            measurementUnitOptions.find(
              (o) => o.value === product?.measurementUnit
            ) || null
          }
          onChange={onMeasurementUnitChange}
          selectStyles={selectStyles}
        />
        {(displayError || validationError) && (
          <ErrorHandling
            resource="products"
            field="measurementUnit"
            loading={loading}
          />
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

