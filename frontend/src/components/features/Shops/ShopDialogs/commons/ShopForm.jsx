// src/components/.../ShopDialog/commons/ShopForm.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Stack, TextField, LinearProgress, Typography } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../../theme/selectStyles";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";

const ShopForm = ({
  shop,
  setShop,
  validationError,
  displayError,
  loading,
  locationOptions,
  categoryOptions,
  locationLoading,
  categoryLoading,
  locationError,
  categoryError,
  resetValidationErrors,
  resetServerError,
}) => {
  const theme = useTheme();
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);
  const menuPortalTarget = typeof document !== "undefined" ? document.body : undefined;

  const clearErrors = () => {
    resetValidationErrors();
    resetServerError();
  };

  const handleNameChange = (e) => {
    setShop((prev) => ({ ...prev, name: e.target.value }));
    clearErrors();
  };

  // Existing: selected.value is ObjectId, selected.label is name
  const handleLocationChange = (selected) => {
    setShop((prev) => ({
      ...prev,
      location: selected?.value || "",
      locationName: selected?.label || "",
    }));
    clearErrors();
  };

  // New: store temp marker + name
  const handleLocationCreate = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setShop((prev) => ({
      ...prev,
      location: `temp-${trimmed}`,
      locationName: trimmed,
    }));
    clearErrors();
  };

  const handleCategoryChange = (selected) => {
    setShop((prev) => ({
      ...prev,
      category: selected?.value || "",
      categoryName: selected?.label || "",
    }));
    clearErrors();
  };

  const handleCategoryCreate = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setShop((prev) => ({
      ...prev,
      category: `temp-${trimmed}`,
      categoryName: trimmed,
    }));
    clearErrors();
  };

  // Build current value for react-select:
  // - If we have an ObjectId, try to find it in options
  // - If temp/new, show {value: temp-..., label: name}
  const currentLocationValue = useMemo(() => {
    if (!shop?.location) return null;
    const found = locationOptions.find((o) => o.value === shop.location);
    if (found) return found;
    if (shop.locationName) return { value: shop.location, label: shop.locationName };
    return null;
  }, [shop?.location, shop?.locationName, locationOptions]);

  const currentCategoryValue = useMemo(() => {
    if (!shop?.category) return null;
    const found = categoryOptions.find((o) => o.value === shop.category);
    if (found) return found;
    if (shop.categoryName) return { value: shop.category, label: shop.categoryName };
    return null;
  }, [shop?.category, shop?.categoryName, categoryOptions]);

  return (
    <Stack spacing={2}>
      {/* Name */}
      <Stack spacing={0.5}>
        <TextField
          size="small"
          label="Butikk"
          value={shop?.name || ""}
          error={Boolean(validationError?.name)}
          disabled={loading}
          onChange={handleNameChange}
        />
        {(displayError || validationError) && (
          <ErrorHandling resource="shops" field="name" loading={loading} />
        )}
      </Stack>

      {/* Location */}
      <Stack spacing={0.5}>
        <CreatableSelect
          styles={selectStyles}
          options={locationOptions}
          value={currentLocationValue}
          onChange={handleLocationChange}
          onCreateOption={handleLocationCreate}
          placeholder="Velg lokasjon..."
          isClearable
          isDisabled={loading}
          isLoading={locationLoading}
          menuPortalTarget={menuPortalTarget}
          isValidNewOption={(input) => {
            const v = input.trim();
            return !!v && !locationOptions.some((o) => o.label === v);
          }}
          formatCreateLabel={(input) => `Ny lokasjon: ${input}`}
        />
        {locationLoading && <LinearProgress />}
        {locationError && (
          <Typography variant="body2" color="error">
            Kunne ikke laste steder.
          </Typography>
        )}
        {(displayError || validationError) && (
          <ErrorHandling resource="shops" field="locationName" loading={loading} />
        )}
      </Stack>

      {/* Category */}
      <Stack spacing={0.5}>
        <CreatableSelect
          styles={selectStyles}
          options={categoryOptions}
          value={currentCategoryValue}
          onChange={handleCategoryChange}
          onCreateOption={handleCategoryCreate}
          placeholder="Velg kategori..."
          isClearable
          isDisabled={loading}
          isLoading={categoryLoading}
          menuPortalTarget={menuPortalTarget}
          isValidNewOption={(input) => {
            const v = input.trim();
            return !!v && !categoryOptions.some((o) => o.label === v);
          }}
          formatCreateLabel={(input) => `Ny kategori: ${input}`}
        />
        {categoryLoading && <LinearProgress />}
        {categoryError && (
          <Typography variant="body2" color="error">
            Kunne ikke laste kategorier.
          </Typography>
        )}
        {(displayError || validationError) && (
          <ErrorHandling resource="shops" field="categoryName" loading={loading} />
        )}
      </Stack>
    </Stack>
  );
};

ShopForm.propTypes = {
  shop: PropTypes.object.isRequired,
  setShop: PropTypes.func.isRequired,
  validationError: PropTypes.object,
  displayError: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  loading: PropTypes.bool,
  locationOptions: PropTypes.array.isRequired,
  categoryOptions: PropTypes.array.isRequired,
  locationLoading: PropTypes.bool,
  categoryLoading: PropTypes.bool,
  locationError: PropTypes.bool,
  categoryError: PropTypes.bool,
  resetValidationErrors: PropTypes.func.isRequired,
  resetServerError: PropTypes.func.isRequired,
};

export default React.memo(ShopForm);


