// src/commons/ProductForm/ProductForm.js
import React from "react";
import { Grid } from "@mui/material";
import ProductNameInput from "./ProductNameInput";
import BrandSelect from "./BrandSelect";
import ProductTypeSelect from "./ProductTypeSelect";
import MeasurementUnitSelect from "./MeasurementUnitSelect";
import MeasuresInput from "./MeasuresInput";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import { predefinedTypes, measurementUnitOptions } from "../../../../commons/Consts/constants";

const ProductForm = ({
  product,
  onNameChange,
  onBrandChange,
  onBrandCreate,
  onProductTypeChange,
  onMeasurementUnitChange,
  onMeasuresChange,
  onMeasureCreate,
  brandOptions, // Expected as an array of objects like { name: "BrandName" }
  selectStyles,
  loading,
  validationError,
  displayError,
  onInputChange,          // NEW: for filtering in BrandSelect
  onMenuScrollToBottom,   // NEW: for infinite scrolling in BrandSelect
  inputValue,             // NEW: the current search text
}) => {
  // Format the brand options for the BrandSelect component
  const formattedBrandOptions = brandOptions.map((brand) => ({
    label: brand.name,
    value: brand.name,
  }));

  // Format the product's brands (if any) into the expected shape
  const formattedSelectedBrands = product?.brands?.map((brandId) => {
    const found = brandOptions.find((b) => b._id === brandId || b.id === brandId);
    return found ? { label: found.name, value: found.name } : { label: brandId, value: brandId };
  }) || [];

  return (
    <Grid container direction="column" spacing={2}>
      {/* Product Name Input */}
      <Grid item>
        <ProductNameInput
          value={product?.name || ""}
          onChange={onNameChange}
          error={validationError?.name}
        />
        {(displayError || validationError) && (
          <ErrorHandling resource="products" field="name" loading={loading} />
        )}
      </Grid>

      {/* Brand Selector */}
      <Grid item>
        <BrandSelect
          options={formattedBrandOptions}
          value={formattedSelectedBrands}
          onChange={onBrandChange}
          onCreateOption={onBrandCreate}
          isLoading={loading}
          error={validationError?.brand}
          selectStyles={selectStyles}
          onInputChange={onInputChange}          // pass filtering handler
          onMenuScrollToBottom={onMenuScrollToBottom} // pass scroll handler
          inputValue={inputValue}                // pass the controlled input value
        />
        {(displayError || validationError) && (
          <ErrorHandling resource="products" field="brand" loading={loading} />
        )}
      </Grid>

      {/* Product Type Selector */}
      <Grid item>
        <ProductTypeSelect
          options={predefinedTypes.map((type) => ({
            value: type,
            label: type,
          }))}
          value={ product?.type ? { value: product.type, label: product.type } : null }
          onChange={onProductTypeChange}
          selectStyles={selectStyles}
        />
      </Grid>

      {/* Measurement Unit Selector */}
      <Grid item>
        <MeasurementUnitSelect
          options={measurementUnitOptions}
          value={ measurementUnitOptions.find((option) => option.value === product?.measurementUnit) || null }
          onChange={onMeasurementUnitChange}
          selectStyles={selectStyles}
        />
        {(displayError || validationError) && (
          <ErrorHandling resource="products" field="measurementUnit" loading={loading} />
        )}
      </Grid>

      {/* Measures Input */}
      <Grid item>
        <MeasuresInput
          options={[]} // Pass any predefined measures if needed
          value={ product?.measures?.map((measure) => ({ value: measure, label: measure })) || [] }
          onChange={onMeasuresChange}
          onCreateOption={onMeasureCreate}
          selectStyles={selectStyles}
        />
      </Grid>
    </Grid>
  );
};

export default ProductForm;
