import React, { useEffect, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  FormControlLabel,
  CircularProgress,
  Radio,
  RadioGroup,
  Checkbox,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import { debounce } from "lodash";
import WindowedSelect from "react-windowed-select";
import { useQueryClient } from "@tanstack/react-query";
import useExpenseForm from "../useExpenseForm";
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";
import useFetchData from "../../../hooks/useFetchData";
import useInfiniteProducts from "../../../hooks/useInfiniteProducts";
import ExpenseField from "../../commons/ExpenseField/ExpenseField";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";

const selectStyles = { menuPortal: (base) => ({ ...base, zIndex: 9999 }) };

const EditExpenseDialog = ({
  open,
  onClose,
  selectedExpense,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  const {
    expense,
    setExpense,
    loading,
    handleSaveExpense,
    resetFormAndErrors,
    isFormValid,
  } = useExpenseForm(selectedExpense, selectedExpense?._id, onClose);
  const queryClient = useQueryClient();
  const { handleFieldChange } = useHandleFieldChange(expense, setExpense);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Initialize form when opening
  useEffect(() => {
    if (open) {
      if (selectedExpense) setExpense(selectedExpense);
      setSelectedProduct(
        selectedExpense?.productName
          ? {
              label: selectedExpense.productName,
              ...selectedExpense,
            }
          : null
      );
    }
  }, [open, selectedExpense, setExpense]);

  const handleDateChange = useCallback(
    (date) => {
      const key = expense.purchased ? "purchaseDate" : "registeredDate";
      handleFieldChange(key, date);
    },
    [expense.purchased, handleFieldChange]
  );

  // Product search
  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);
  const productOptions = useMemo(
    () =>
      infiniteData?.pages.flatMap((page) =>
        page.products.map((p) => ({
          label: p.name,
          value: p.name,
          ...p,
        }))
      ) || [],
    [infiniteData]
  );

  // --- BRANDS ---
  const { data: brandOptions, isLoading: isLoadingBrands } = useFetchData(
    "brands",
    "/api/brands",
    (data) => data.brands || [],
    { enabled: open }
  );
  const computedBrandOptions = useMemo(() => {
    if (!selectedProduct?.brands?.length) return [];
    return (brandOptions || [])
      .filter((brand) => selectedProduct.brands.includes(brand._id))
      .map((brand) => ({ label: brand.name, value: brand.name }));
  }, [selectedProduct, brandOptions]);

  // --- SHOPS ---
  const { data: shops, isLoading: isLoadingShops } = useFetchData(
    "shops",
    "/api/shops",
    async (shopsData) => {
      const shopsArray = Array.isArray(shopsData)
        ? shopsData
        : shopsData?.shops || [];
      return Promise.all(
        shopsArray.map(async (shop) => {
          const locationResponse = await fetch(
            `/api/locations/${shop.location}`
          );
          const location = await locationResponse.json();
          return { ...shop, locationName: location.name };
        })
      );
    },
    { enabled: open }
  );

  const safeShops = useMemo(() => (Array.isArray(shops) ? shops : []), [shops]);

  const shopOptions = useMemo(
    () =>
      safeShops.map((shop) => ({
        label: `${shop.name}${
          shop.locationName ? `, ${shop.locationName}` : ""
        }`,
        value: shop.name,
        locationName: shop.locationName || "",
      })),
    [safeShops]
  );

  const selectedShopOption = useMemo(
    () =>
      shopOptions.find((option) => option.value === expense.shopName) || null,
    [expense.shopName, shopOptions]
  );

  // Debouncing
  const debouncedSearch = useMemo(
    () => debounce((value) => setProductSearch(value), 250),
    []
  );

  // Discount handlers
  const handleDiscountChange = useCallback(
    (e) => {
      const checked = e.target.checked;
      handleFieldChange("hasDiscount", checked);
      if (!checked) {
        handleFieldChange("discountValue", 0);
        handleFieldChange("discountAmount", 0);
      }
    },
    [handleFieldChange]
  );

  const handleDiscountValueChange = useCallback(
    (e) => {
      const value = parseFloat(e.target.value);
      handleFieldChange("discountValue", value);
      handleFieldChange(
        "discountAmount",
        (expense.price * (value / 100)).toFixed(2)
      );
    },
    [expense.price, handleFieldChange]
  );

  const handleDiscountAmountChange = useCallback(
    (e) => {
      const amount = parseFloat(e.target.value);
      handleFieldChange("discountAmount", amount);
      handleFieldChange(
        "discountValue",
        ((amount / expense.price) * 100).toFixed(2)
      );
    },
    [expense.price, handleFieldChange]
  );

  const handleClose = useCallback(() => {
    queryClient.resetQueries(["products", "brands", "shops"]);
    resetFormAndErrors();
    onClose();
  }, [queryClient, resetFormAndErrors, onClose]);

  const handleProductSelect = useCallback(
    (option) => {
      setSelectedProduct(option);
      setExpense((prev) => ({
        ...prev,
        productName: option?.label || "",
        brandName: "",
        type: option?.type || "",
        measurementUnit: option?.measurementUnit || "",
        volume: option?.measures?.[0] || 0,
      }));
    },
    [setExpense]
  );

  const handleTransactionType = useCallback(
    (e) => {
      const isPurchased = e.target.value === "purchased";
      setExpense((prev) => ({
        ...prev,
        purchased: isPurchased,
        registeredDate: isPurchased ? null : prev.registeredDate,
        purchaseDate: isPurchased ? prev.purchaseDate : null,
      }));
    },
    [setExpense]
  );

  if (!open) return null;

  // Add loading check here
if (isLoadingProducts || isLoadingBrands || isLoadingShops) {
  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle="Edit Expense">
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
        <p>Loading form data...</p>
      </Box>
    </BasicDialog>
  );
}


  return (
    <BasicDialog open={open} onClose={handleClose} dialogTitle="Edit Expense">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          isFormValid() &&
            handleSaveExpense()
              .then(onUpdateSuccess)
              .catch(onUpdateFailure)
              .finally(handleClose);
        }}
      >
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* Product Selection */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={productOptions}
                value={selectedProduct}
                onChange={handleProductSelect}
                onInputChange={debouncedSearch}
                onMenuScrollToBottom={() => hasNextPage && fetchNextPage()}
                placeholder="Select Product"
                menuPortalTarget={document.body}
                styles={selectStyles}
                isLoading={isLoadingProducts}
              />
            </Grid>

            {/* Brand Selection */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={computedBrandOptions}
                value={{ label: expense.brandName, value: expense.brandName }}
                onChange={(option) =>
                  handleFieldChange("brandName", option?.value || "")
                }
                placeholder="Select Brand"
                menuPortalTarget={document.body}
                isDisabled={!selectedProduct}
                styles={selectStyles}
                isLoading={isLoadingBrands}  // Add loading state
              />
            </Grid>

            {/* Shop Selection */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={shopOptions}
                value={selectedShopOption}
                onChange={(option) => {
                  // Fix 2: Use the locationName from the option directly
                  handleFieldChange("shopName", option?.value || "");
                  handleFieldChange("locationName", option?.locationName || "");
                }}
                placeholder="Select Store"
                menuPortalTarget={document.body}
                styles={selectStyles}
                isLoading={isLoadingShops}
              />
            </Grid>

            {/* Read-only Location Field */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Location"
                value={expense.locationName || ""}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Price Field */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Price"
                type="number"
                value={expense.price}
                onChange={(e) =>
                  handleFieldChange("price", parseFloat(e.target.value))
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Kr</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Volume / Quantity Field */}
            <Grid item xs={12} md={6}>
              {expense.measurementUnit &&
              selectedProduct &&
              selectedProduct.measures?.length ? (
                <WindowedSelect
                  isClearable
                  options={selectedProduct.measures.map((measure) => ({
                    label: measure.toString(),
                    value: measure,
                  }))}
                  value={
                    expense.volume != null
                      ? {
                          label: expense.volume.toString(),
                          value: expense.volume,
                        }
                      : null
                  }
                  onChange={(option) =>
                    setExpense((prev) => ({
                      ...prev,
                      volume: option ? parseFloat(option.label) : 0,
                    }))
                  }
                  placeholder="Select Volume"
                  menuPortalTarget={document.body}
                  styles={selectStyles}
                />
              ) : (
                <ExpenseField
                  label="Volume/Quantity"
                  type="number"
                  value={
                    expense.volume != null ? expense.volume.toString() : ""
                  }
                  onChange={(e) =>
                    setExpense((prev) => ({
                      ...prev,
                      volume: parseFloat(e.target.value),
                    }))
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

            {/* Price Per Unit (Read-only) */}
            <Grid item xs={12}>
              <ExpenseField
                label={`Price per ${expense.measurementUnit || ""}`}
                value={expense.pricePerUnit}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Discount Checkbox */}
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.hasDiscount || false}
                    onChange={handleDiscountChange}
                    color="primary"
                  />
                }
                label="Discount?"
              />
            </Grid>

            {/* Discount Fields */}
            {expense.hasDiscount && (
              <>
                <Grid item xs={12} md={6}>
                  <ExpenseField
                    label="Discount (%)"
                    type="number"
                    value={expense.discountValue || ""}
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

            {/* Final Price (Read-only) */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Final Price"
                type="number"
                value={expense.finalPrice || ""}
                InputProps={{
                  readOnly: true,
                  startAdornment: (
                    <InputAdornment position="start">Kr</InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Type (Read-only) */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Type"
                value={expense.type || ""}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Purchased/Registered Checkboxes */}
            {/* Transaction Type */}
            <Grid item xs={12}>
              <RadioGroup
                row
                value={expense.purchased ? "purchased" : "registered"}
                onChange={handleTransactionType}
              >
                <FormControlLabel
                  value="purchased"
                  control={<Radio />}
                  label="Purchased"
                />
                <FormControlLabel
                  value="registered"
                  control={<Radio />}
                  label="Registered"
                />
              </RadioGroup>
            </Grid>

            {/* Date Picker */}
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

        {/* Action Buttons */}
        <Box
          sx={{ mt: 3, display: "flex", gap: 2, justifyContent: "flex-end" }}
        >
          <Button variant="contained" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            type="submit"
            disabled={loading || !isFormValid()}
          >
            {loading ? <CircularProgress size={24} /> : "Save Changes"}
          </Button>
        </Box>
      </form>
    </BasicDialog>
  );
};

EditExpenseDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedExpense: PropTypes.object.isRequired,
  onUpdateSuccess: PropTypes.func.isRequired,
  onUpdateFailure: PropTypes.func.isRequired,
};

export default EditExpenseDialog;
