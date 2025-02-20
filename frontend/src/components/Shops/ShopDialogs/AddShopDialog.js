import React, { useMemo, useEffect } from "react";
import {
  Button,
  TextField,
  CircularProgress,
  Grid,
  Fade,
  Box,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import PropTypes from "prop-types";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import useShopDialog from "../UseShop/useShopDialog";
import LinearProgress from "@mui/material/LinearProgress";
import { fetchLocations, fetchCategories } from "../../commons/Utils/apiUtils";
import commonSelectStyles from "../../commons/Styles/SelectStyles";
import CreatableSelect from "react-select/creatable";

// Memoized components
const MemoizedBasicDialog = React.memo(BasicDialog);
const MemoizedErrorHandling = React.memo(ErrorHandling);
const MemoizedCreatableSelect = React.memo(CreatableSelect);

const AddShopDialog = ({ open, onClose, onAdd }) => {
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
  } = useShopDialog();

  // Fetch location names
  const {
    data: locations = [],
    isLoading: locationLoading,
    isError: locationError,
  } = useQuery(["locations"], fetchLocations, {
    select: (data) => data.locations.map((l) => l.name),
  });

  // Fetch category names
  const {
    data: categories = [],
    isLoading: categoryLoading,
    isError: categoryError,
  } = useQuery(["categories"], fetchCategories, {
    select: (data) => data.categories.map((c) => c.name),
  });

  // Memoized options
  const locationOptions = useMemo(
    () => locations.map((name) => ({ value: name, label: name })),
    [locations]
  );

  const categoryOptions = useMemo(
    () => categories.map((name) => ({ value: name, label: name })),
    [categories]
  );

  // Reset form when dialog opens
  useEffect(() => {
    if (open) resetFormAndErrors();
  }, [open, resetFormAndErrors]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormValid()) {
      const success = await handleSaveShop(onClose);
      if (success) onAdd({ name: shop.name });
    }
  };

  // CHANGED: Update change handler to update both the raw value and the display name.
  const handleLocationChange = (selectedOption, action) => {
    const value = selectedOption?.value || "";
    const label = selectedOption ? selectedOption.label : "";
    setShop((prev) => ({
      ...prev,
      location: value,
      locationName: label, // CHANGED: Update locationName too
    }));
    resetValidationErrors();
    resetServerError();
  };

  const handleCategoryChange = (selectedOption, action) => {
    const value = selectedOption?.value || "";
    const label = selectedOption ? selectedOption.label : "";
    setShop((prev) => ({
      ...prev,
      category: value,
      categoryName: label, // CHANGED: Update categoryName too
    }));
    resetValidationErrors();
    resetServerError();
  };

  return (
    <Fade in={open} timeout={300}>
      <Box>
        <MemoizedBasicDialog
          open={open}
          onClose={() => {
            resetFormAndErrors();
            onClose();
          }}
          dialogTitle="Ny Butikk"
        >
          <form onSubmit={handleSubmit}>
            <Grid container direction="column" spacing={2}>
              {/* Shop Name */}
              <Grid item>
                <TextField
                  sx={{ mt: 2 }}
                  size="small"
                  label="Butikk"
                  value={shop?.name || ""}
                  error={Boolean(validationError?.name)}
                  onChange={(e) => {
                    setShop((prev) => ({ ...prev, name: e.target.value }));
                    resetValidationErrors();
                    resetServerError();
                  }}
                />
                {(displayError || validationError) && (
                  <MemoizedErrorHandling
                    resource="shops"
                    field="name"
                    loading={loading}
                  />
                )}
              </Grid>

              {/* Location Select */}
              <Grid item>
                <MemoizedCreatableSelect
                  styles={commonSelectStyles}
                  options={locationOptions}
                  value={
                    locationOptions.find((o) => o.value === shop.location) ||
                    (shop.location && {
                      value: shop.location,
                      label: shop.locationName,
                      name: shop.locationName,
                    })
                  }
                  onChange={handleLocationChange}
                  placeholder="Velg Sted..."
                  isClearable
                  // CHANGED: When creating a new option, prefix with "temp-" so it passes through your formatUtil.
                  onCreateOption={(inputValue) => {
                    const value = inputValue.trim();
                    setShop((prev) => ({
                      ...prev,
                      location: `temp-${value}`, // CHANGED: Prefix with "temp-"
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
                  formatCreateLabel={(input) => `Ny sted: ${input}`}
                />
                {locationLoading && <LinearProgress sx={{ mt: 1 }} />}
                {locationError && (
                  <MemoizedErrorHandling
                    resource="locations"
                    field="location"
                    loading={locationLoading}
                  />
                )}
              </Grid>

              {/* Category Select */}
              <Grid item>
                <MemoizedCreatableSelect
                  styles={commonSelectStyles}
                  options={categoryOptions}
                  value={
                    categoryOptions.find((o) => o.value === shop.category) ||
                    (shop.category && {
                      value: shop.category,
                      label: shop.categoryName,
                      name: shop.categoryName,
                    })
                  }
                  onChange={handleCategoryChange}
                  placeholder="Velg Kategori..."
                  isClearable
                  // CHANGED: When creating a new option, prefix with "temp-" so it passes through your formatUtil.
                  onCreateOption={(inputValue) => {
                    const value = inputValue.trim();
                    setShop((prev) => ({
                      ...prev,
                      category: `temp-${value}`, // CHANGED: Prefix with "temp-"
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
                  formatCreateLabel={(input) => `Ny kategori: ${input}`}
                />
                {categoryLoading && <LinearProgress sx={{ mt: 1 }} />}
                {categoryError && (
                  <MemoizedErrorHandling
                    resource="categories"
                    field="category"
                    loading={categoryLoading}
                  />
                )}
              </Grid>

              {/* Action Buttons */}
              <Grid container justifyContent="flex-end" sx={{ mt: 2 }}>
                <Button type="submit" disabled={loading || !isFormValid()}>
                  {loading ? <CircularProgress size={24} /> : "Lagre"}
                </Button>
                <Button
                  onClick={() => {
                    resetFormAndErrors();
                    onClose();
                  }}
                  sx={{ ml: 2 }}
                >
                  Avbryt
                </Button>
              </Grid>
            </Grid>
          </form>
        </MemoizedBasicDialog>
      </Box>
    </Fade>
  );
};

AddShopDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddShopDialog;
