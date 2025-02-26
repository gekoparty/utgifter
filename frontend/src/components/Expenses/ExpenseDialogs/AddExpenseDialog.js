import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
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
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import ExpenseField from "../../commons/ExpenseField/ExpenseField";
import WindowedSelect from "react-windowed-select";
import useExpenseForm from "../useExpenseForm";
import useFetchData from "../../../hooks/useFetchData";
import useInfiniteProducts from "../../../hooks/useInfiniteProducts";
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";

const AddExpenseDialog = ({ open, onClose, onAdd }) => {
  /* =====================================================
     Expense Form Hooks & State Initialization
  ====================================================== */
  const {
    expense,
    handleSaveExpense,
    isFormValid,
    setExpense,
    resetForm,
    loading,
  } = useExpenseForm();

  // Field change handlers including discount-related fields.
  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);

  // Local state for product search and selection.
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Close handler that resets form and closes dialog.
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  /* =====================================================
     Data Fetching
  ====================================================== */
  // Infinite product fetching based on product search.
  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);

  // Fetch brands options.
  const { data: brands, isLoading: isLoadingBrands } = useFetchData(
    "brands",
    "/api/brands",
    (data) => (Array.isArray(data.brands) ? data.brands : []),
    { enabled: open }
  );

  // Fetch shops options and enrich with location name.
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

  // Create debounced product search setter.
  const debouncedSetProductSearch = useMemo(
    () => debounce(setProductSearch, 300),
    [setProductSearch]
  );

  // Cleanup debounce on unmount.
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
        brands: product.brands,
      }))
    );
  }, [infiniteData]);

  // Derive brand options based on the selected product.
  const brandOptions = useMemo(() => {
    if (selectedProduct && selectedProduct.brands && safeBrands.length > 0) {
      return safeBrands
        .filter((brand) => selectedProduct.brands.includes(brand._id))
        .map((brand) => ({
          label: brand.name,
          value: brand.name,
          name: brand.name,
        }));
    }
    return safeBrands.map((brand) => ({
      label: brand.name,
      value: brand.name,
      name: brand.name,
    }));
  }, [selectedProduct, safeBrands]);

  /* =====================================================
     Event Handlers
  ====================================================== */
  // Handle product selection.
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

  // Update product search on input change.
  const handleProductInputChange = useCallback(
    (inputValue) => {
      if (inputValue.trim() === "" && productSearch === "") return;
      debouncedSetProductSearch(inputValue);
    },
    [debouncedSetProductSearch, productSearch]
  );

  // Handle brand selection.
  const handleBrandSelect = useCallback(
    (selectedOption) => {
      handleFieldChange("brandName", selectedOption?.name || "");
    },
    [handleFieldChange]
  );

  // Handle shop selection.
  const handleShopSelect = useCallback(
    (selectedOption) => {
      handleFieldChange("shopName", selectedOption?.value || "", {
        locationName: selectedOption?.locationName || "",
      });
    },
    [handleFieldChange]
  );

  // Handle date change for purchase or registration.
  const handleDateChange = useCallback(
    (date) => {
      const key = expense.purchased ? "purchaseDate" : "registeredDate";
      handleFieldChange(key, date);
    },
    [expense.purchased, handleFieldChange]
  );

  // Handle volume selection.
  const handleVolumeChange = useCallback(
    (selectedOption) => {
      const volume = selectedOption ? parseFloat(selectedOption.value) : 0;
      handleFieldChange("volume", volume);
    },
    [handleFieldChange]
  );

  // Handle discount checkbox toggle.
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

  // Toggle purchased status.
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

  // Toggle registered status.
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

  // Handle form submission.
  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      try {
        if (isFormValid) {
          const savedExpense = await handleSaveExpense();
          if (savedExpense) {
            const expenseData =
              savedExpense.data && Array.isArray(savedExpense.data)
                ? savedExpense.data[0]
                : savedExpense;
            const productName =
              typeof expenseData.productName === "object"
                ? expenseData.productName.name
                : expenseData.productName;

            if (!expenseData || !productName) {
              console.error("Invalid response from server:", savedExpense);
            } else {
              onAdd(expenseData);
              // Reset and close dialog.
              handleClose();
            }
          }
        }
      } catch (error) {
        console.error("Save failed:", error);
      }
    },
    [isFormValid, handleSaveExpense, onAdd, handleClose]
  );

  /* =====================================================
     Overall Loading State
  ====================================================== */
  const isLoadingCombined = useMemo(
    () => isLoadingProducts || isLoadingBrands || isLoadingShops || loading,
    [isLoadingProducts, isLoadingBrands, isLoadingShops, loading]
  );

  /* =====================================================
     Render Markup
  ====================================================== */
  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      dialogTitle="Add New Expense"
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* ===== Product Selection ===== */}
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
                loadingMessage={() => "Searching products..."}
                placeholder="Select Product"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </Grid>

            {/* ===== Brand Selection ===== */}
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
                placeholder={selectedProduct ? "Select Brand" : "Select a product first"}
                isLoading={isLoadingBrands}
                loadingMessage={() => "Loading brands..."}
                menuPortalTarget={document.body}
                isDisabled={!selectedProduct}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </Grid>

            {/* ===== Shop Selection ===== */}
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
                placeholder="Select Shop"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </Grid>

            {/* ===== Read-only Location ===== */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Location"
                value={expense.locationName}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* ===== Price Input ===== */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Price"
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

            {/* ===== Volume Input (Select or Manual) ===== */}
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
                  placeholder="Select Volume"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
              ) : (
                <ExpenseField
                  label="Volume (Manual)"
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

            {/* ===== Price Per Unit (Read-only) ===== */}
            <Grid item xs={12}>
              <ExpenseField
                label={`Price per ${expense.measurementUnit || ""}`}
                value={expense.pricePerUnit}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* ===== Quantity ===== */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Quantity"
                type="number"
                value={expense.quantity}
                onChange={(e) => handleFieldChange("quantity", e.target.value)}
              />
            </Grid>

            {/* ===== Discount Options ===== */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.hasDiscount}
                    onChange={handleDiscountChange}
                    color="primary"
                  />
                }
                label="Discount?"
              />
            </Grid>

            {expense.hasDiscount && (
              <>
                <Grid item xs={12} md={6}>
                  <ExpenseField
                    label="Discount (%)"
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
                    label="Discount (Kr)"
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

            {/* ===== Final Price (Read-only) ===== */}
            <Grid item xs={12}>
              <ExpenseField
                label="Final Price"
                value={expense.finalPrice || 0}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* ===== Purchased / Registered ===== */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.purchased}
                    onChange={handlePurchaseChange}
                    color="primary"
                  />
                }
                label="Purchased"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!expense.purchased}
                    onChange={handleRegisterChange}
                    color="primary"
                  />
                }
                label="Registered"
              />
            </Grid>

            {/* ===== Date Picker ===== */}
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Date"
                value={dayjs(
                  expense.purchased
                    ? expense.purchaseDate
                    : expense.registeredDate
                )}
                onChange={handleDateChange}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* ===== Action Buttons ===== */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button onClick={handleClose} sx={{ mr: 1 }}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isFormValid || isLoadingCombined}
          >
            {isLoadingCombined ? <CircularProgress size={24} /> : "Save"}
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


