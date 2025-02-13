import React, { useEffect, useState } from "react";
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
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";

const defaultExpense = {
  productName: "",
  brandName: "",
  shopName: "",
  locationName: "",
  price: 0,
  volume: 0,
  discountValue: 0,
  discountAmount: 0,
  finalPrice: 0,
  quantity: 1,
  hasDiscount: false,
  purchased: true,
  registeredDate: null,
  purchaseDate: null,
  type: "",
  measurementUnit: "",
  pricePerUnit: 0,
};

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

  // Destructure field-change handlers (including discount changes)
  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);

  // Local state for volume display (for manual input)
  const [volumeDisplay, setVolumeDisplay] = useState(expense.volume || "");
  // Local state for discount (Kr) display:


  // Fetch products, brands, and shops options
  const {
    data: products,
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
  } = useFetchData(
    "products",
    "/api/products",
    (data) => (Array.isArray(data.products) ? data.products : []),
    { enabled: open }
  );

  const {
    data: brands,
    isLoading: isLoadingBrands,
    refetch: refetchBrands,
  } = useFetchData(
    "brands",
    "/api/brands",
    (data) => (Array.isArray(data.brands) ? data.brands : []),
    { enabled: open }
  );

  const {
    data: shops,
    isLoading: isLoadingShops,
    refetch: refetchShops,
  } = useFetchData(
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

  // Refetch data when the dialog opens
  useEffect(() => {
    if (open) {
      refetchProducts();
      refetchBrands();
      refetchShops();
    }
  }, [open, refetchProducts, refetchBrands, refetchShops]);

  // Ensure that options are arrays
  const safeProducts = Array.isArray(products) ? products : [];
  const safeBrands = Array.isArray(brands) ? brands : [];
  const safeShops = Array.isArray(shops) ? shops : [];

  // Update the local volume display when expense.volume changes
  useEffect(() => {
    setVolumeDisplay(expense.volume || "");
  }, [expense.volume]);

 

  // Handlers for selections:
  const handleProductSelect = (selectedOption) => {
    if (selectedOption) {
      const unit = selectedOption.measurementUnit || 'unit'; // Fallback if necessary
      if (selectedOption.measures && selectedOption.measures.length > 0) {
        const firstMeasure = selectedOption.measures[0];
        setExpense((prev) => ({
          ...prev,
          productName: selectedOption.name,
          type: selectedOption.type,
          measurementUnit: unit,
          volume: firstMeasure,
        }));
        setVolumeDisplay(firstMeasure.toString());
      } else {
        setExpense((prev) => ({
          ...prev,
          productName: selectedOption.name,
          type: selectedOption.type,
          measurementUnit: unit,
          volume: 0,
        }));
        setVolumeDisplay("");
      }
    } else {
      setExpense((prev) => ({
        ...prev,
        productName: "",
        type: "",
        measurementUnit: "",
        volume: 0,
      }));
      setVolumeDisplay("");
    }
  };

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
    if (!dayjs(date).isValid()) return;
    if (expense.purchased) {
      setExpense((prev) => ({ ...prev, purchaseDate: date }));
    } else {
      setExpense((prev) => ({ ...prev, registeredDate: date }));
    }
  };

  // Handle volume changes from select or manual input
  const handleVolumeChange = (selectedOption) => {
    if (selectedOption) {
      setVolumeDisplay(selectedOption.label);
      setExpense((prev) => ({ ...prev, volume: parseFloat(selectedOption.label) }));
    } else {
      setVolumeDisplay("");
      setExpense((prev) => ({ ...prev, volume: 0 }));
    }
  };

  const handleManualVolumeInput = (event) => {
    const value = event.target.value;
    setVolumeDisplay(value);
    setExpense((prev) => ({ ...prev, volume: parseFloat(value) }));
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
        console.log("Saved expense response:", savedExpense); // For debugging
        
        if (savedExpense) {
          // Extract the expense data from the returned object.
          // We assume the API returns { message, data: [ expense ] }.
          const expenseData =
            savedExpense.data && Array.isArray(savedExpense.data)
              ? savedExpense.data[0]
              : savedExpense;
          
          // Extract the product name (if productName is an object, use its name property).
          const productName =
            typeof expenseData.productName === "object"
              ? expenseData.productName.name
              : expenseData.productName;
          
          if (!expenseData || !productName) {
            // If productName is missing, show an error.
            console.error("Invalid response from server:", savedExpense);
            // Optionally, you can call showErrorSnackbar here.
          } else {
            // Notify the parent with the saved expense data.
            onAdd(expenseData);
            // Close the dialog.
            onClose();
          }
        }
      }
    } catch (error) {
      console.error("Save failed:", error);
    }
  };

  


  // Determine overall loading state
  const isLoading =
    !open || isLoadingProducts || isLoadingBrands || isLoadingShops || loading;

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose();
      }}
      dialogTitle="Add New Expense"
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* Product Selection */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={safeProducts.map((product) => ({
                  label: product.name,
                  value: product.name,
                  name: product.name,
                  type: product.type,
                  measurementUnit: product.measurementUnit,
                  measures: product.measures,
                }))}
                value={
                  expense.productName
                    ? { label: expense.productName, value: expense.productName }
                    : null
                }
                onChange={handleProductSelect}
                placeholder="Select Product"
                menuPortalTarget={document.body}
                styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              />
            </Grid>

            {/* Brand Selection */}
            <Grid item xs={12} md={6}>
              <WindowedSelect
                isClearable
                options={safeBrands.map((brand) => ({
                  label: brand.name,
                  value: brand.name,
                  name: brand.name,
                }))}
                value={
                  expense.brandName
                    ? { label: expense.brandName, value: expense.brandName }
                    : null
                }
                onChange={handleBrandSelect}
                placeholder="Select Brand"
                menuPortalTarget={document.body}
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
              {expense.measurementUnit && safeProducts.length > 0 ? (
                <WindowedSelect
                  isClearable
                  options={
                    // Assuming the measures come from the selected product.
                    (safeProducts[0]?.measures || []).map((measure) => ({
                      label: measure.toString(),
                      value: measure,
                    })) || []
                  }
                  value={
                    volumeDisplay
                      ? { label: volumeDisplay, value: volumeDisplay }
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
                  value={volumeDisplay}
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
                value={dayjs(expense.purchased ? expense.purchaseDate : expense.registeredDate)}
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
              resetFormAndErrors();
              onClose();
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

