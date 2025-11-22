import React, {useMemo} from "react";
import { Grid, TextField, CircularProgress, Button } from "@mui/material";
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
  // Handler for shop name change.
  const handleNameChange = (e) => {
    setShop((prev) => ({ ...prev, name: e.target.value }));
    resetValidationErrors();
    resetServerError();
  };

  // Handler for location select change.
  const handleLocationChange = (selectedOption) => {
    const value = selectedOption?.value || "";
    const label = selectedOption ? selectedOption.label : "";
    setShop((prev) => ({
      ...prev,
      location: value,
      locationName: label,
    }));
    resetValidationErrors();
    resetServerError();
  };

  // Handler for creating a new location option.
  const handleLocationCreate = (inputValue) => {
    const value = inputValue.trim();
    setShop((prev) => ({
      ...prev,
      location: `temp-${value}`,
      locationName: value,
    }));
    resetValidationErrors();
    resetServerError();
  };

  // Handler for category select change.
  const handleCategoryChange = (selectedOption) => {
    const value = selectedOption?.value || "";
    const label = selectedOption ? selectedOption.label : "";
    setShop((prev) => ({
      ...prev,
      category: value,
      categoryName: label,
    }));
    resetValidationErrors();
    resetServerError();
  };

  // Handler for creating a new category option.
  const handleCategoryCreate = (inputValue) => {
    const value = inputValue.trim();
    setShop((prev) => ({
      ...prev,
      category: `temp-${value}`,
      categoryName: value,
    }));
    resetValidationErrors();
    resetServerError();
  };

  // Compute current values for selects.
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
      <Grid container direction="column" spacing={2}>
        {/* Shop Name */}
        <Grid item>
          <TextField
            sx={{ mt: 2 }}
            size="small"
            label="Butikk"
            value={shop?.name || ""}
            error={Boolean(validationError?.name)}
            onChange={handleNameChange}
          />
          {(displayError || validationError) && (
            <ErrorHandling resource="shops" field="name" loading={loading} />
          )}
        </Grid>

        {/* Location Select */}
        <Grid item>
          <CreatableSelect
            styles={selectStyles}
            options={locationOptions}
            value={currentLocationValue || null}
            onChange={handleLocationChange}
            onCreateOption={handleLocationCreate}
            placeholder="Velg Lokasjon..."
            isClearable
            isLoading={locationLoading}
            isValidNewOption={(inputValue) =>
              !!inputValue.trim() &&
              !locationOptions.find((o) => o.value === inputValue.trim())
            }
            formatCreateLabel={(input) => `Ny Lokasjon: ${input}`}
            menuPortalTarget={document.body}
          />
          {locationLoading && <LinearProgress sx={{ mt: 1 }} />}
          {locationError && <div>Error loading Locations</div>}
        </Grid>

        {/* Category Select */}
        <Grid item>
          <CreatableSelect
            styles={selectStyles}
            options={categoryOptions}
            value={currentCategoryValue || null}
            onChange={handleCategoryChange}
            onCreateOption={handleCategoryCreate}
            placeholder="Velg Kategori..."
            isClearable
            isLoading={categoryLoading}
            isValidNewOption={(inputValue) =>
              !!inputValue.trim() &&
              !categoryOptions.find((o) => o.value === inputValue.trim())
            }
            formatCreateLabel={(input) => `Ny Kategori: ${input}`}
            menuPortalTarget={document.body}
            menuPosition="fixed" // <-- added prop
  
          />
          {categoryLoading && <LinearProgress sx={{ mt: 1 }} />}
          {categoryError && <div>Error loading Categories</div>}
        </Grid>

        {/* Action Buttons */}
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : submitLabel}
          </Button>
          <Button onClick={onCancel} sx={{ ml: 2 }}>
            Avbryt
          </Button>
        </Grid>
      </Grid>
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