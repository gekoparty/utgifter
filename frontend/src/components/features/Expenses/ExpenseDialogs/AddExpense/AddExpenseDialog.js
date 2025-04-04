import React, { useEffect, useState, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import BasicDialog from "../../../../commons/BasicDialog/BasicDialog";
import ExpenseField from "../../../../commons/ExpenseField/ExpenseField";
import WindowedSelect from "react-windowed-select";
import useExpenseForm from "../../UseExpense/useExpenseForm";
import useFetchData from "../../../../../hooks/useFetchData";
import useInfiniteProducts from "../../../../../hooks/useInfiniteProducts";
import useHandleFieldChange from "../../../../../hooks/useHandleFieldChange";

const AddExpenseDialog = ({ open, onClose, onAdd }) => {
  // Initialize expense form hook.
  const {
    expense,
    handleSaveExpense,
    isFormValid,
    setExpense,
    resetForm,
    loading,
  } = useExpenseForm();

  // Field change handlers.
  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);

  // Local state for product search and selection.
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Define a close handler that resets the form and calls the parent's onClose.
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Infinite product fetching.
  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);

  // Fetch all brands.
  const {
    data: brands,
    isLoading: isLoadingBrands,
    refetch: refetchBrands,
  } = useFetchData(
    "brands",
    "/api/brands",
    (data) => (Array.isArray(data.brands) ? data.brands : [])
  );

  // Fetch product-specific brands if a product is selected.
  const {
    data: productBrands,
    isLoading: isLoadingProductBrands,
    refetch: refetchProductBrands,
  } = useFetchData(
    ["brands", selectedProduct?.brands],
    selectedProduct
      ? `/api/brands?ids=${selectedProduct.brands.join(",")}`
      : "/api/brands",
    (data) => (Array.isArray(data.brands) ? data.brands : []),
    { enabled: !!selectedProduct }
  );

  // Refetch brands when dialog opens.
  useEffect(() => {
    if (open) {
      refetchBrands();
    }
  }, [open, refetchBrands]);

  // Refetch product-specific brands when selected product changes.
  useEffect(() => {
    if (selectedProduct) {
      refetchProductBrands();
    }
  }, [selectedProduct, refetchProductBrands]);

  // Fetch shops options.
  const { data: shops, isLoading: isLoadingShops } = useFetchData(
    "shops",
    "/api/shops",
    async (shopsData) => {
      const shopsArray = Array.isArray(shopsData)
        ? shopsData
        : shopsData?.shops || [];
      return Promise.all(
        shopsArray.map(async (shop) => {
          const locationResponse = await fetch(`/api/locations/${shop.location}`);
          const location = await locationResponse.json();
          return { ...shop, locationName: location.name };
        })
      );
    },
    { enabled: open }
  );

  // Debounce product search input.
  const debouncedSetProductSearch = useMemo(
    () => debounce(setProductSearch, 300),
    [setProductSearch]
  );

  useEffect(() => {
    return () => {
      debouncedSetProductSearch.cancel();
    };
  }, [debouncedSetProductSearch]);

  // Ensure options are arrays.
  const safeBrands = useMemo(() => (Array.isArray(brands) ? brands : []), [brands]);
  const safeShops = useMemo(() => (Array.isArray(shops) ? shops : []), [shops]);

  // Map infinite product pages to option objects.
  const productOptions = useMemo(() => {
    const allPages = infiniteData?.pages || [];
    return allPages.flatMap((page) =>
      page.products.map((product) => ({
        label: product.name,
        value: product.name,
        name: product.name,
        type: product.type,
        measurementUnit: product.measurementUnit,
        measures: product.measures,
        brands: product.brands, // Array of brand IDs.
      }))
    );
  }, [infiniteData]);

  // Derive brand options based on selected product.
  const brandOptions = useMemo(() => {
    const brandsSource = selectedProduct ? productBrands : safeBrands;
    if (isLoadingProductBrands || isLoadingBrands) return [];
    if (selectedProduct?.brands?.length && brandsSource?.length) {
      const mappedBrands = brandsSource
        .filter((brand) => {
          const brandIdStr = String(brand._id);
          const productBrandIds = selectedProduct.brands.map(String);
          return productBrandIds.includes(brandIdStr);
        })
        .map((brand) => ({
          label: brand.name,
          value: brand._id,
          name: brand.name,
        }));
      return mappedBrands;
    }
    return (brandsSource || []).map((brand) => ({
      label: brand.name,
      value: brand._id,
      name: brand.name,
    }));
  }, [
    selectedProduct,
    productBrands,
    safeBrands,
    isLoadingProductBrands,
    isLoadingBrands,
  ]);

  // Event Handlers:
  const handleProductSelect = useCallback(
    (selectedOption) => {
      setSelectedProduct(selectedOption);
      // Reset brand field when product changes.
      handleFieldChange("brandName", "");
      if (selectedOption) {
        const unit = selectedOption.measurementUnit || "unit";
        const volume = selectedOption.measures?.[0] || 0;
        handleFieldChange("productName", selectedOption.name, {
          type: selectedOption.type,
          measurementUnit: unit,
          volume,
        });
      } else {
        handleFieldChange("productName", "", {
          type: "",
          measurementUnit: "",
          volume: 0,
          brandName: "",
        });
      }
    },
    [handleFieldChange]
  );

  const handleProductInputChange = useCallback(
    (inputValue) => {
      if (inputValue.trim() === "" && productSearch === "") return;
      debouncedSetProductSearch(inputValue);
    },
    [debouncedSetProductSearch, productSearch]
  );

  const handleBrandSelect = useCallback(
    (selectedOption) => {
      handleFieldChange("brandName", selectedOption?.name || "");
    },
    [handleFieldChange]
  );

  const handleShopSelect = useCallback(
    (selectedOption) => {
      handleFieldChange("shopName", selectedOption?.value || "", {
        locationName: selectedOption?.locationName || "",
      });
    },
    [handleFieldChange]
  );

  const handleDateChange = useCallback(
    (date) => {
      const key = expense.purchased ? "purchaseDate" : "registeredDate";
      handleFieldChange(key, date);
    },
    [expense.purchased, handleFieldChange]
  );

  const handleVolumeChange = useCallback(
    (selectedOption) => {
      const volume = selectedOption ? parseFloat(selectedOption.value) : 0;
      handleFieldChange("volume", volume);
    },
    [handleFieldChange]
  );

  const handleDiscountChange = useCallback(
    (event) => {
      const checked = event.target.checked;
      handleFieldChange("hasDiscount", checked, {
        discountValue: checked ? expense.discountValue : 0,
        discountAmount: checked ? expense.discountAmount : 0,
      });
    },
    [expense.discountValue, expense.discountAmount, handleFieldChange]
  );

  const handlePurchaseChange = useCallback(
    (event) => {
      const isPurchased = event.target.checked;
      handleFieldChange("purchased", isPurchased, {
        registeredDate: isPurchased ? null : expense.registeredDate,
        purchaseDate: isPurchased ? expense.purchaseDate : null,
      });
    },
    [expense.registeredDate, expense.purchaseDate, handleFieldChange]
  );

  const handleRegisterChange = useCallback(
    (event) => {
      const isRegistered = event.target.checked;
      handleFieldChange("purchased", !isRegistered, {
        registeredDate: isRegistered ? expense.registeredDate : null,
        purchaseDate: isRegistered ? null : expense.purchaseDate,
      });
    },
    [expense.registeredDate, expense.purchaseDate, handleFieldChange]
  );

  // Submit handler: call handleSaveExpense and then close the dialog.
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        if (isFormValid) {
          const savedExpense = await handleSaveExpense();
          if (savedExpense) {
            onAdd(savedExpense);
            handleClose();
          }
        }
      } catch (error) {
        console.error("Save failed:", error);
      }
    },
    [isFormValid, handleSaveExpense, onAdd, handleClose]
  );

  // Overall loading state.
  const isLoadingCombined = useMemo(
    () => isLoadingProducts || isLoadingBrands || isLoadingShops || loading,
    [isLoadingProducts, isLoadingBrands, isLoadingShops, loading]
  );

  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle="Legg til ny utgift">
      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* Product Selection */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={productOptions}
                value={
                  expense.productName
                    ? { label: expense.productName, value: expense.productName }
                    : null
                }
                onChange={handleProductSelect}
                onInputChange={handleProductInputChange}
                onMenuScrollToBottom={() => {
                  if (hasNextPage) fetchNextPage();
                }}
                isLoading={isLoadingProducts}
                loadingMessage={() => "Søker etter produkter..."}
                placeholder="Velg produkt"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </Grid>

            {/* Brand Selection */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={brandOptions}
                value={
                  expense.brandName
                    ? { label: expense.brandName, value: expense.brandName }
                    : null
                }
                onChange={handleBrandSelect}
                placeholder={selectedProduct ? "Velg merke" : "Velg et produkt først"}
                isLoading={isLoadingBrands || isLoadingProductBrands}
                loadingMessage={() => "Laster inn merker..."}
                menuPortalTarget={document.body}
                isDisabled={!selectedProduct || isLoadingBrands || isLoadingProductBrands}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </Grid>

            {/* Shop Selection */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={safeShops.map((shop) => ({
                  label: `${shop.name}, ${shop.locationName}`,
                  value: shop.name,
                  name: shop.name,
                  locationName: shop.locationName,
                }))}
                value={
                  expense.shopName
                    ? { label: expense.shopName, value: expense.shopName }
                    : null
                }
                onChange={handleShopSelect}
                placeholder="Velg butikk"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </Grid>

            {/* Read-only location field */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Sted"
                value={expense.locationName}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Price Field */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Pris"
                type="number"
                value={expense.price}
                onChange={(e) =>
                  setExpense((prev) => ({
                    ...prev,
                    price: parseFloat(e.target.value),
                  }))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Kr</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Volume Field */}
            <Grid item xs={12} md={6}>
              {expense.measurementUnit &&
              selectedProduct &&
              selectedProduct.measures?.length > 0 ? (
                <WindowedSelect
                  isClearable
                  options={selectedProduct.measures.map((measure) => ({
                    label: measure.toString(),
                    value: measure,
                  }))}
                  value={
                    expense.volume
                      ? {
                          label: expense.volume.toString(),
                          value: expense.volume,
                        }
                      : null
                  }
                  onChange={handleVolumeChange}
                  placeholder="Velg volum"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
              ) : (
                <ExpenseField
                  label="Volum (manuelt)"
                  type="number"
                  value={expense.volume || ""}
                  onChange={(e) =>
                    handleFieldChange("volume", parseFloat(e.target.value) || 0)
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {expense.measurementUnit}
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Grid>

            {/* Price Per Unit Field */}
            <Grid item xs={12}>
              <ExpenseField
                label={`Pris per ${expense.measurementUnit || ""}`}
                value={expense.pricePerUnit || 0}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Quantity Field */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Antall"
                type="number"
                value={expense.quantity}
                onChange={(e) => handleFieldChange("quantity", e.target.value)}
              />
            </Grid>

            {/* Discount Toggle */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.hasDiscount}
                    onChange={handleDiscountChange}
                    color="primary"
                  />
                }
                label="Rabatt?"
              />
            </Grid>

            {expense.hasDiscount && (
              <>
                <Grid item xs={12} md={6}>
                  <ExpenseField
                    label="Rabatt (%)"
                    type="number"
                    value={expense.discountValue}
                    onChange={handleDiscountValueChange}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">%</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <ExpenseField
                    label="Rabatt (kr)"
                    type="number"
                    value={expense.discountAmount || ""}
                    onChange={handleDiscountAmountChange}
                    InputLabelProps={{ shrink: true }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Kr</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </>
            )}

            {/* Final Price Field */}
            <Grid item xs={12}>
              <ExpenseField
                label="Sluttpris"
                value={expense.finalPrice || 0}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Purchased / Registered Toggle */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.purchased}
                    onChange={handlePurchaseChange}
                    color="primary"
                  />
                }
                label="Kjøpt"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!expense.purchased}
                    onChange={handleRegisterChange}
                    color="primary"
                  />
                }
                label="Registrert"
              />
            </Grid>

            {/* Date Picker */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Dato"
                value={dayjs(expense.purchased ? expense.purchaseDate : expense.registeredDate)}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button onClick={handleClose} sx={{ mr: 1 }}>
            Avbryt
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isFormValid || isLoadingCombined}
          >
            {isLoadingCombined ? <CircularProgress size={24} /> : "Lagre"}
          </Button>
        </Box>
      </form>
    </BasicDialog>
  );
};

AddExpenseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
};

export default AddExpenseDialog;



