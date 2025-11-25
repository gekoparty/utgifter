import React, { useMemo } from "react";
import { TextField, CircularProgress, Button, Stack } from "@mui/material";
import PropTypes from "prop-types";
import CreatableSelect from "react-select/creatable";
import LinearProgress from "@mui/material/LinearProgress";
import ErrorHandling from "../../../../commons/ErrorHandling/ErrorHandling";
import { useTheme } from "@mui/material/styles";
import { getSelectStyles } from "../../../../../theme/selectStyles";

const ShopForm = ({
  shop,
  setShop,
  validationError,
  displayError,
  loading = false,
  locationOptions,
  categoryOptions,
  locationLoading,
  categoryLoading,
  locationError,
  categoryError,
  resetValidationErrors,
  resetServerError,
  onSubmit,
  submitLabel,
  onCancel,
}) => {
  const theme = useTheme();
  const selectStyles = useMemo(() => getSelectStyles(theme), [theme]);

  const handleNameChange = (e) => {
    setShop((prev) => ({ ...prev, name: e.target.value }));
    resetValidationErrors();
    resetServerError();
  };

  const handleLocationChange = (selected) => {
    setShop((prev) => ({
      ...prev,
      location: selected?.value || "",
      locationName: selected?.label || "",
    }));
    resetValidationErrors();
    resetServerError();
  };

  const handleLocationCreate = (input) => {
    const trimmed = input.trim();
    setShop((prev) => ({
      ...prev,
      location: `temp-${trimmed}`,
      locationName: trimmed,
    }));
    resetValidationErrors();
    resetServerError();
  };

  const handleCategoryChange = (selected) => {
    setShop((prev) => ({
      ...prev,
      category: selected?.value || "",
      categoryName: selected?.label || "",
    }));
    resetValidationErrors();
    resetServerError();
  };

  const handleCategoryCreate = (input) => {
    const trimmed = input.trim();
    setShop((prev) => ({
      ...prev,
      category: `temp-${trimmed}`,
      categoryName: trimmed,
    }));
    resetValidationErrors();
    resetServerError();
  };

  const currentLocationValue =
    shop?.location &&
    (locationOptions.find((o) => o.value === shop.location) || {
      value: shop.location,
      label: shop.locationName,
    });

  const currentCategoryValue =
    shop?.category &&
    (categoryOptions.find((o) => o.value === shop.category) || {
      value: shop.category,
      label: shop.categoryName,
    });

  return (
    <form onSubmit={onSubmit}>
      <Stack spacing={2} sx={{ mt: 2 }}>
        {/* Shop Name */}
        <Stack spacing={0.5}>
          <TextField
            size="small"
            label="Butikk"
            value={shop?.name || ""}
            error={Boolean(validationError?.name)}
            onChange={handleNameChange}
          />
          {(displayError || validationError) && (
            <ErrorHandling resource="shops" field="name" loading={loading} />
          )}
        </Stack>

        {/* Location Select */}
        <Stack spacing={0.5}>
          <CreatableSelect
            styles={selectStyles}
            options={locationOptions}
            value={currentLocationValue || null}
            onChange={handleLocationChange}
            onCreateOption={handleLocationCreate}
            placeholder="Velg Lokasjon..."
            isClearable
            isLoading={locationLoading}
            isValidNewOption={(input) =>
              !!input.trim() &&
              !locationOptions.find((o) => o.value === input.trim())
            }
            formatCreateLabel={(input) => `Ny Lokasjon: ${input}`}
            menuPortalTarget={document.body}
          />
          {locationLoading && <LinearProgress />}
          {locationError && <div>Error loading Locations</div>}
        </Stack>

        {/* Category Select */}
        <Stack spacing={0.5}>
          <CreatableSelect
            styles={selectStyles}
            options={categoryOptions}
            value={currentCategoryValue || null}
            onChange={handleCategoryChange}
            onCreateOption={handleCategoryCreate}
            placeholder="Velg Kategori..."
            isClearable
            isLoading={categoryLoading}
            isValidNewOption={(input) =>
              !!input.trim() &&
              !categoryOptions.find((o) => o.value === input.trim())
            }
            formatCreateLabel={(input) => `Ny Kategori: ${input}`}
            menuPortalTarget={document.body}
          />
          {categoryLoading && <LinearProgress />}
          {categoryError && <div>Error loading Categories</div>}
        </Stack>

        {/* Buttons */}
        <Stack direction="row" justifyContent="flex-end" spacing={2} sx={{ mt: 1 }}>
          <Button type="submit" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : submitLabel}
          </Button>
          <Button onClick={onCancel}>Avbryt</Button>
        </Stack>
      </Stack>
    </form>
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
  onSubmit: PropTypes.func.isRequired,
  submitLabel: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default React.memo(ShopForm);
