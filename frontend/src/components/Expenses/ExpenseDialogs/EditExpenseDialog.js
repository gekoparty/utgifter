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
import Select from "react-select";
import useExpenseForm from "../useExpenseForm";
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";
import useFetchData from "../../../hooks/useFetchData";
import useInfiniteProducts from "../../../hooks/useInfiniteProducts";

const EditExpenseDialog = ({
  open,
  onClose,
  selectedExpense,
  onUpdateSuccess,
  onUpdateFailure,
}) => {
  // Initialize the expense form state from the selected expense.
  const {
    expense,
    setExpense,
    loading,
    handleSaveExpense,
    resetFormAndErrors,
    isFormValid,
  } = useExpenseForm(selectedExpense, selectedExpense?._id, onClose);

  // Destructure field-change handlers (e.g. for discount fields)
  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);

  // Local state for displaying volume (e.g. if manual input is needed)
  const [volumeDisplay, setVolumeDisplay] = useState(expense.volume || "");
   // New state to manage typeahead search and the selected product object
   const [productSearch, setProductSearch] = useState("");
   const [selectedProduct, setSelectedProduct] = useState(null);

  // Ensure that the local volume display is updated when expense.volume changes
  useEffect(() => {
    setVolumeDisplay(expense.volume || "");
  }, [expense.volume]);

  // When the dialog opens, reset the form state to the selected expense.
  useEffect(() => {
    if (open && selectedExpense) {
      setExpense(selectedExpense);
    }
  }, [open, selectedExpense, setExpense]);

  const {
    data: infiniteData,
    isLoading: isLoadingProducts,
    error: productError, // <-- add this line
    fetchNextPage,
    hasNextPage,
  } = useInfiniteProducts(productSearch);


  // Flatten the pages from the infinite query into options
  const productOptions = infiniteData
    ? infiniteData.pages.flatMap((page) =>
        page.products.map((product) => ({
          label: product.name,
          value: product.name,
          type: product.type,
          measurementUnit: product.measurementUnit,
          measures: product.measures,
        }))
      )
    : [];

  // Fetch brand options.
  const { data: brandOptions, isLoading: isLoadingBrands, isError: brandError } =
    useFetchData(
      "brands",
      "/api/brands",
      (data) => (Array.isArray(data.brands) ? data.brands : []),
      { enabled: open }
    );

  // Fetch shop options and transform each shop to include its location name.
  const { data: shopOptions, isLoading: isLoadingShops, isError: shopError } =
    useFetchData(
      "shops",
      "/api/shops",
      async (data) => {
        const shopsArray = Array.isArray(data) ? data : data?.shops || [];
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

  // Overall loading state.
  const isLoading = isLoadingProducts || isLoadingBrands || isLoadingShops || loading;

  // Handle error states.
  if (isLoading) {
    return <CircularProgress />;
  }
  if (productError) {
    return <div>Error loading products</div>;
  }
  if (brandError) {
    return <div>Error loading brands</div>;
  }
  if (shopError) {
    return <div>Error loading shops</div>;
  }

  // --- Handlers for Select Components ---

  const handleProductSelect = (selectedOption) => {
    // Save the full product object for later use (e.g. for measures)
    setSelectedProduct(selectedOption);
  
    if (selectedOption) {
      // Update expense with product details.
      setExpense((prev) => ({
        ...prev,
        productName: selectedOption.label, // or selectedOption.value
        type: selectedOption.type,
        measurementUnit: selectedOption.measurementUnit,
      }));
      // If there are measures available, you might choose to auto-select the first one.
      if (selectedOption.measures && selectedOption.measures.length > 0) {
        const firstMeasure = selectedOption.measures[0];
        setExpense((prev) => ({ ...prev, volume: firstMeasure }));
        setVolumeDisplay(firstMeasure.toString());
      }
    } else {
      // Clear product-related fields if no product is selected.
      setExpense((prev) => ({
        ...prev,
        productName: "",
        type: "",
        measurementUnit: "",
        volume: 0,
      }));
      setVolumeDisplay("");
      setSelectedProduct(null);
    }
  };

  // Handle brand selection.
  const handleBrandSelect = (selectedOption) => {
    setExpense((prev) => ({
      ...prev,
      brandName: selectedOption ? selectedOption.label : "",
    }));
  };

  // Handle shop selection; split the label to get shop name and location.
  const handleShopSelect = (selectedOption) => {
    if (selectedOption) {
      const [shopName, locationName] = selectedOption.label.split(",").map((s) => s.trim());
      setExpense((prev) => ({
        ...prev,
        shopName,
        locationName,
      }));
    } else {
      setExpense((prev) => ({
        ...prev,
        shopName: "",
        locationName: "",
      }));
    }
  };

 

  // Handle discount checkbox changes.
  const handleDiscountChange = (e) => {
    const checked = e.target.checked;
    handleFieldChange("hasDiscount", checked);
    if (!checked) {
      // Reset discount fields when unchecked.
      handleFieldChange("discountValue", 0);
      handleFieldChange("discountAmount", 0);
    }
  };

  // Handle purchase/registration toggles.
  const handlePurchaseChange = (e) => {
    const isPurchased = e.target.checked;
    setExpense((prev) => ({
      ...prev,
      purchased: isPurchased,
      registeredDate: isPurchased ? null : prev.registeredDate,
      purchaseDate: isPurchased ? prev.purchaseDate : null,
    }));
  };

  const handleRegisterChange = (e) => {
    const isRegistered = e.target.checked;
    setExpense((prev) => ({
      ...prev,
      purchased: !isRegistered,
      registeredDate: isRegistered ? prev.registeredDate : null,
      purchaseDate: isRegistered ? null : prev.purchaseDate,
    }));
  };

  // Handle date changes.
  const handleDateChange = (date) => {
    if (!dayjs(date).isValid()) return;
    if (expense.purchased) {
      setExpense((prev) => ({ ...prev, purchaseDate: date }));
    } else {
      setExpense((prev) => ({ ...prev, registeredDate: date }));
    }
  };

  // --- Form Submission ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFormValid()) {
      try {
        const updatedExpense = await handleSaveExpense();
        if (updatedExpense) {
          // If the API response wraps the expense in a "data" array, extract the first item.
          const expenseData =
            updatedExpense.data && Array.isArray(updatedExpense.data)
              ? updatedExpense.data[0]
              : updatedExpense;
          onUpdateSuccess(expenseData);
          onClose();
        }
      } catch (err) {
        onUpdateFailure();
      }
    }
  };
  

  return (
    <BasicDialog
      open={open}
      onClose={() => {
        resetFormAndErrors();
        onClose();
      }}
      dialogTitle="Edit Expense"
    >
      <form onSubmit={handleSubmit}>
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
                        {/* Product Selection */}
                        <Grid item xs={12} md={6}>
                        <Select
  isClearable
  options={productOptions}
  value={
    expense.productName
      ? { label: expense.productName, value: expense.productName }
      : null
  }
  onChange={handleProductSelect}
  onInputChange={(inputValue) => {
    setProductSearch(inputValue);
  }}
  onMenuScrollToBottom={() => {
    if (hasNextPage) fetchNextPage();
  }}
  placeholder="Select Product"
  menuPortalTarget={document.body}
  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
/>
            </Grid>


            {/* Brand Selection */}
            <Grid item xs={12} md={6}>
              <Select
                isClearable
                options={brandOptions.map((brand) => ({
                  label: brand.name,
                  value: brand.name,
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
              <Select
                isClearable
                options={shopOptions.map((shop) => ({
                  label: `${shop.name}, ${shop.locationName}`,
                  value: shop.name,
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
                value={expense.price || ""}
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

                {/* Volume / Quantity Field */}
                <Grid item xs={12} md={6}>
              {expense.measurementUnit && selectedProduct && selectedProduct.measures?.length > 0 ? (
                <Select
                  isClearable
                  options={selectedProduct.measures.map((measure) => ({
                    label: measure.toString(),
                    value: measure,
                  }))}
                  value={
                    volumeDisplay
                      ? { label: volumeDisplay, value: volumeDisplay }
                      : null
                  }
                  onChange={(option) => {
                    const val = option ? option.label : "";
                    setVolumeDisplay(val);
                    setExpense((prev) => ({
                      ...prev,
                      volume: option ? parseFloat(option.label) : 0,
                    }));
                  }}
                  placeholder="Select Volume"
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
              ) : (
                <ExpenseField
                  label="Volume/Quantity"
                  type="number"
                  value={volumeDisplay}
                  onChange={(e) => {
                    const value = e.target.value;
                    setVolumeDisplay(value);
                    setExpense((prev) => ({ ...prev, volume: parseFloat(value) }));
                  }}
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

            {/* Discount Fields (conditionally rendered) */}
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
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.purchased || false}
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
          <Button type="submit" disabled={loading || !isFormValid()}>
            {loading ? <CircularProgress size={24} /> : "Save"}
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

