import React, { useEffect, useMemo } from "react";
import { Button, TextField, CircularProgress, Grid } from "@mui/material";
import PropTypes from "prop-types";
import { useQuery } from "@tanstack/react-query";
import CreatableSelect from "react-select/creatable";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useShopDialog from "../UseShop/useShopDialog";
import { fetchCategories, fetchLocations } from "../../commons/Utils/apiUtils";

// CHANGED: Transform fetched data into names (like in AddShopDialog)
const EditShopDialog = ({
  selectedShop,
  open,
  onClose,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  // Memoize the selected shop to avoid unnecessary renders.
  const memoizedSelectedShop = useMemo(() => selectedShop, [selectedShop]);
  const {
    shop,
    setShop,
    loading,
    handleSaveShop,
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useShopDialog(memoizedSelectedShop);

  // CHANGED: Fetch locations with abort signal support.
  const {
    data: locations = [],
    isLoading: locationLoading,
    isError: locationError,
  } = useQuery(
    ["locations"],
    ({ signal }) => fetchLocations({ signal }),
    {
      select: (data) => data.locations.map((l) => l.name),
    }
  );

  // CHANGED: Map the names into options
  const locationOptions = useMemo(
    () => locations.map((name) => ({ value: name, label: name })),
    [locations]
  );

   // CHANGED: Fetch categories with abort signal support.
   const {
    data: categories = [],
    isLoading: categoryLoading,
    isError: categoryError,
  } = useQuery(
    ["categories"],
    ({ signal }) => fetchCategories({ signal }),
    {
      select: (data) => data.categories.map((c) => c.name),
    }
  );
  // CHANGED: Map the names into options
  const categoryOptions = useMemo(
    () => categories.map((name) => ({ value: name, label: name })),
    [categories]
  );

  // CHANGED: When the dialog opens, reset the form with the selected shop.
  useEffect(() => {
    if (open) {
      setShop({ ...selectedShop });
    }
  }, [selectedShop, open, setShop]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveShop(onClose);
      if (success) {
        onUpdateSuccess(selectedShop);
      } else {
        onUpdateFailure();
      }
    }
  };

  // CHANGED: For location, update both value and display name.
  const handleLocationChange = (selectedOption, action) => {
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

  // CHANGED: For category, update both value and display name.
  const handleCategoryChange = (selectedOption, action) => {
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

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose();
      }}
      dialogTitle="Edit Shop"
    >
      <form onSubmit={handleSubmit}>
        <Grid container direction="column" spacing={1}>
          {/* Shop Name */}
          <Grid item>
            <TextField
              sx={{ marginTop: 2 }}
              size="small"
              label="Butikk"
              value={shop?.name || ""}
              error={Boolean(validationError?.name)}
              onChange={(e) => {
                setShop({ ...shop, name: e.target.value });
                resetValidationErrors();
                resetServerError();
              }}
            />
            {displayError || validationError ? (
              <ErrorHandling resource="shops" field="name" loading={loading} />
            ) : null}
          </Grid>

          {/* Location Select */}
          <Grid item>
            <CreatableSelect
              className="custom-select"
              options={locationOptions}
              size="small"
              label="Lokasjon"
              // CHANGED: Compute value – if shop.location isn’t found in the options, build one from shop.locationName.
              value={
                shop?.location
                  ? locationOptions.find((o) => o.value === shop.location) || {
                      value: shop.location,
                      label: shop.locationName,
                    }
                  : null
              }
              error={Boolean(validationError?.location)}
              onChange={handleLocationChange}
              getOptionLabel={(option) => option.label} // CHANGED: Use label instead of name
              getOptionValue={(option) => option.value} // CHANGED: Use value instead of name
              placeholder="Velg Lokasjon..."
              isClearable
              // CHANGED: When creating a new option, prefix with "temp-" so that formatting is applied on save.
              onCreateOption={(inputValue) => {
                const value = inputValue.trim();
                setShop((prev) => ({
                  ...prev,
                  location: `temp-${value}`, // CHANGED: Prefix new option
                  locationName: value,
                }));
                resetValidationErrors();
                resetServerError();
              }}
              isValidNewOption={(inputValue) =>
                !!inputValue.trim() &&
                !locationOptions.find(
                  (o) => o.value === inputValue.trim()
                )
              }
              formatCreateLabel={(input) => `Ny Lokasjon: ${input}`}
            />
            {locationLoading && <CircularProgress />}
            {locationError && <div>Error loading Locations</div>}
          </Grid>

          {/* Category Select */}
          <Grid item>
            <CreatableSelect
              className="custom-select"
              options={categoryOptions}
              size="small"
              label="Kategori"
              // CHANGED: Compute value for category similarly.
              value={
                shop?.category
                  ? categoryOptions.find((o) => o.value === shop.category) || {
                      value: shop.category,
                      label: shop.categoryName,
                    }
                  : null
              }
              error={Boolean(validationError?.category)}
              onChange={handleCategoryChange}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.value}
              placeholder="Velg Kategori..."
              isClearable
              // CHANGED: When creating a new option, prefix with "temp-".
              onCreateOption={(inputValue) => {
                const value = inputValue.trim();
                setShop((prev) => ({
                  ...prev,
                  category: `temp-${value}`, // CHANGED: Prefix new option
                  categoryName: value,
                }));
                resetValidationErrors();
                resetServerError();
              }}
              isValidNewOption={(inputValue) =>
                !!inputValue.trim() &&
                !categoryOptions.find(
                  (o) => o.value === inputValue.trim()
                )
              }
              formatCreateLabel={(input) => `Ny Kategori: ${input}`}
            />
            {categoryLoading && <CircularProgress />}
            {categoryError && <div>Error loading categories</div>}
          </Grid>
        </Grid>
        <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Save"}
          </Button>
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ ml: 2 }}
          >
            Cancel
          </Button>
        </Grid>
      </form>
    </BasicDialog>
  );
};

EditShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedShop: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditShopDialog;
