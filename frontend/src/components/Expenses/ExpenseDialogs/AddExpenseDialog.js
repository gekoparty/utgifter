import React, { useEffect, useState, useMemo, useCallback } from "react";
import { debounce } from "lodash";
import { useQueryClient } from "@tanstack/react-query";
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
  // Use the expense form hook. (Note: If you need to pass an initial expense, you can adjust here.)
  const {
    expense,
    handleSaveExpense,
    isFormValid,
    setExpense,
    resetFormAndErrors,
    loading,
  } = useExpenseForm();
  const queryClient = useQueryClient();

  // Destructure field-change handlers (including discount changes)
  const { handleDiscountAmountChange, handleDiscountValueChange } =
    useHandleFieldChange(expense, setExpense);

  const handleClose = () => {
    // Reset queries related to products, brands, and shops
    queryClient.resetQueries(["products"]);
    queryClient.resetQueries(["brands"]);
    queryClient.resetQueries(["shops"]);
    resetFormAndErrors(); // Add this
    onClose();
  };

  const [productSearch, setProductSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products, brands, and shops options
  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);

  const { data: brands, isLoading: isLoadingBrands } = useFetchData(
    "brands",
    "/api/brands",
    (data) => (Array.isArray(data.brands) ? data.brands : []),
    { enabled: open }
  );

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

  // Create a debounced version of setProductSearch
  const debouncedSetProductSearch = useMemo(
    () =>
      debounce((inputValue) => {
        setProductSearch(inputValue);
      }, 300),
    [] // setProductSearch is stable
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSetProductSearch.cancel();
    };
  }, [debouncedSetProductSearch]);

  // Ensure that options are arrays
  const safeBrands = useMemo(
    () => (Array.isArray(brands) ? brands : []),
    [brands]
  );
  const safeShops = Array.isArray(shops) ? shops : [];

  const productOptions = useMemo(() => {
    // Keep previous results while loading new ones
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

  const brandOptions = useMemo(() => {
    if (selectedProduct && selectedProduct.brands && safeBrands.length > 0) {
      return safeBrands
        .filter((brand) =>
          // Compare product's brand IDs with the full brand objects from safeBrands
          selectedProduct.brands.includes(brand._id)
        )
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


  // Handlers for selections:
  const handleProductSelect = useCallback(
    (selectedOption) => {
      setSelectedProduct(selectedOption);
      // Reset brand selection on new product:
      setExpense((prev) => ({ ...prev, brandName: "" }));

      if (selectedOption) {
        const unit = selectedOption.measurementUnit || "unit";
        if (selectedOption.measures && selectedOption.measures.length > 0) {
          const firstMeasure = selectedOption.measures[0];
          setExpense((prev) => ({
            ...prev,
            productName: selectedOption.name,
            type: selectedOption.type,
            measurementUnit: unit,
            volume: firstMeasure,
          }));
        } else {
          setExpense((prev) => ({
            ...prev,
            productName: selectedOption.name,
            type: selectedOption.type,
            measurementUnit: unit,
            volume: 0,
          }));
        }
      } else {
        setExpense((prev) => ({
          ...prev,
          productName: "",
          type: "",
          measurementUnit: "",
          volume: 0,
          brandName: "",
        }));
      }
    },
    [setExpense]
  );

  // Update handler for product input change using the debounced function
  const handleProductInputChange = useCallback(
    (inputValue) => {
      // Prevent empty searches after initial load
      if (inputValue.trim() === "" && productSearch === "") return;

      debouncedSetProductSearch(inputValue);
    },
    [debouncedSetProductSearch, productSearch]
  );

  const handleBrandSelect = (selectedOption) => {
    setExpense((prev) => ({
      ...prev,
      brandName: selectedOption ? selectedOption.name : "",
    }));
  };

  const handleShopSelect = (selectedOption) => {
    setExpense((prev) => ({
      ...prev,
      shopName: selectedOption ? selectedOption.value : "",
      locationName: selectedOption ? selectedOption.locationName : "",
    }));
  };

  const handleDateChange = (date) => {
    const key = expense.purchased ? "purchaseDate" : "registeredDate";
    setExpense((prev) => ({ ...prev, [key]: date }));
  };

  // Handle volume changes from select or manual input
  const handleVolumeChange = (selectedOption) => {
    if (selectedOption) {
      setExpense((prev) => ({
        ...prev,
        volume: selectedOption ? parseFloat(selectedOption.label) : 0,
      }));
    } else {
      setExpense((prev) => ({ ...prev, volume: 0 }));
    }
  };

  const handleManualVolumeInput = (event) => {
    const value = event.target.value;
    setExpense((prev) => ({
      ...prev,
      volume: parseFloat(value) || 0,
    }));
  };

  // Handler for discount checkbox
  const handleDiscountChange = (event) => {
    const { checked } = event.target;
    setExpense((prev) => ({
      ...prev,
      hasDiscount: checked,
      // Optionally reset discount values if unchecked
      discountValue: checked ? prev.discountValue : 0,
      discountAmount: checked ? prev.discountAmount : 0,
    }));
  };

  // Handlers for quantity, purchase/registration checkboxes:
  const handleQuantityChange = (event) => {
    const value = event.target.value;
    setExpense((prev) => ({ ...prev, quantity: value }));
  };

  const handlePurchaseChange = (event) => {
    const isPurchased = event.target.checked;
    setExpense((prev) => ({
      ...prev,
      purchased: isPurchased,
      registeredDate: isPurchased ? null : prev.registeredDate,
      purchaseDate: isPurchased ? prev.purchaseDate : null,
    }));
  };

  const handleRegisterChange = (event) => {
    const isRegistered = event.target.checked;
    setExpense((prev) => ({
      ...prev,
      purchased: !isRegistered,
      registeredDate: isRegistered ? prev.registeredDate : null,
      purchaseDate: isRegistered ? null : prev.purchaseDate,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      if (isFormValid()) {
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
            // Optionally display an error message
          } else {
            // Notify the parent with the saved expense data
            onAdd(expenseData);
            // Instead of calling onClose directly, call handleClose so that
            // it resets the cache and then closes the dialog.
            handleClose();
          }
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  const computeFinalPrice = () => {
    const price = parseFloat(expense.price) || 0;
    if (!expense.hasDiscount) return price;
    if (expense.discountValue > 0) {
      return price * (1 - expense.discountValue / 100);
    }
    if (expense.discountAmount > 0) {
      return price - expense.discountAmount;
    }
    return price;
  };

  useEffect(() => {
    setExpense((prev) => ({
      ...prev,
      finalPrice: parseFloat(computeFinalPrice().toFixed(2)),
    }));
  }, [
    expense.price,
    expense.discountValue,
    expense.discountAmount,
    expense.hasDiscount,
  ]);

  // Determine overall loading state
  const isLoading =
    isLoadingProducts || isLoadingBrands || isLoadingShops || loading;

  return (
    <BasicDialog
      open={open}
      onClose={handleClose}
      dialogTitle="Add New Expense"
    >
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
                // When the dropdown is scrolled to bottom, fetch next page if available
                onMenuScrollToBottom={() => {
                  if (hasNextPage) fetchNextPage();
                }}
                isLoading={isLoadingProducts} // Add loading state
                loadingMessage={() => "Searching products..."}
                placeholder="Select Product"
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
                placeholder={
                  selectedProduct ? "Select Brand" : "Select a product first"
                }
                isLoading={isLoadingBrands}
                loadingMessage={() => "Loading brands..."}
                menuPortalTarget={document.body}
                isDisabled={!selectedProduct} // disable if no product selected
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
                placeholder="Select Shop"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </Grid>

            {/* Read-only Location */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Location"
                value={expense.locationName}
                InputProps={{ readOnly: true }}
              />
            </Grid>

            {/* Price */}
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

            {/* Volume (Selection or Manual) */}
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
                  onChange={handleManualVolumeInput}
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

            {/* Quantity */}
            <Grid item xs={12} md={6}>
              <ExpenseField
                label="Quantity"
                type="number"
                value={expense.quantity}
                onChange={handleQuantityChange}
              />
            </Grid>

            {/* Discount Checkbox */}
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

            {/* Conditional Discount Fields */}
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
                    // When the field loses focus, update the parent state:
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
            <Grid item xs={12}>
              <ExpenseField
                label="Final Price"
                value={computeFinalPrice().toFixed(2)}
                InputProps={{ readOnly: true }}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* Purchased / Registered Checkboxes */}
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
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Button
            onClick={() => {
              handleClose();
            }}
            sx={{ mr: 1 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : "Save"}
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
