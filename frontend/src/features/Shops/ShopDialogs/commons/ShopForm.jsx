// src/components/.../ShopDialog/commons/ShopForm.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Stack, TextField, LinearProgress, Typography } from "@mui/material";
import CreatableSelect from "react-select/creatable";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../styles/theme/selectStyles";
import FieldErrorText from "../../../../components/commons/ErrorHandling/FieldErrorText";
import FormErrorAlert from "../../../../components/commons/ErrorHandling/FormErrorAlert";

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

  const handleLocationChange = (selected) => {
    const selectedLocations = Array.isArray(selected) ? selected : [];

    setShop((prev) => ({
      ...prev,
      locations: selectedLocations.map((option) => option.value).filter(Boolean),
      locationNames: selectedLocations.map((option) => option.label).filter(Boolean),
    }));
    clearErrors();
  };

  const handleLocationCreate = (input) => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setShop((prev) => {
      const locationNames = Array.isArray(prev.locationNames) ? prev.locationNames : [];
      if (locationNames.some((name) => name.toLowerCase() === trimmed.toLowerCase())) {
        return prev;
      }

      return {
        ...prev,
        locations: [...(Array.isArray(prev.locations) ? prev.locations : []), `temp-${trimmed}`],
        locationNames: [...locationNames, trimmed],
      };
    });
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

  const currentLocationValues = useMemo(() => {
    const names = Array.isArray(shop?.locationNames) ? shop.locationNames : [];
    const ids = Array.isArray(shop?.locations) ? shop.locations.map(String) : [];

    return names.map((name, index) => {
      const id = ids[index] || "";
      return (
        locationOptions.find((option) => option.value === id || option.label === name) ?? {
          value: id || `temp-${name}`,
          label: name,
        }
      );
    });
  }, [shop?.locations, shop?.locationNames, locationOptions]);

  const currentCategoryValue = useMemo(() => {
    if (!shop?.category) return null;
    const found = categoryOptions.find((o) => o.value === shop.category);
    if (found) return found;
    if (shop.categoryName) return { value: shop.category, label: shop.categoryName };
    return null;
  }, [shop?.category, shop?.categoryName, categoryOptions]);

  return (
    <Stack spacing={2}>
      {displayError && <FormErrorAlert resource="shops" />}

      {/* Name */}
      <Stack spacing={0.5}>
        <TextField
          size="small"
          fullWidth
          label="Butikk"
          value={shop?.name || ""}
          error={Boolean(validationError?.name)}
          disabled={loading}
          onChange={handleNameChange}
        />
        {(displayError || validationError) && (
          <FieldErrorText resource="shops" field="name" />
        )}
      </Stack>

      <Stack spacing={0.5}>
        <CreatableSelect
          isMulti
          styles={selectStyles}
          options={locationOptions}
          value={currentLocationValues}
          onChange={handleLocationChange}
          onCreateOption={handleLocationCreate}
          placeholder="Velg steder hvor butikken finnes..."
          isDisabled={loading}
          isLoading={locationLoading}
          menuPortalTarget={menuPortalTarget}
          isValidNewOption={(input) => {
            const v = input.trim();
            return !!v && !locationOptions.some((o) => o.label === v);
          }}
          formatCreateLabel={(input) => `Nytt sted: ${input}`}
        />
        {locationLoading && <LinearProgress />}
        {locationError && (
          <Typography variant="body2" color="error">
            Kunne ikke laste steder.
          </Typography>
        )}
        {(displayError || validationError) && (
          <FieldErrorText resource="shops" field="locationNames" />
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
          <FieldErrorText resource="shops" field="categoryName" />
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


