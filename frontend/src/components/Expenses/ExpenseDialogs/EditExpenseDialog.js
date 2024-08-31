import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import useExpenseForm from "../useExpenseForm";
import ErrorHandling from "../../commons/ErrorHandling/ErrorHandling";
import ExpenseField from "../../commons/ExpenseField/ExpenseField";
import dayjs from "dayjs";
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";
import useFetchData from "../../../hooks/useFetchData";
import Select from "react-select";

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
    resetValidationErrors,
    resetServerError,
    displayError,
    validationError,
    isFormValid,
    resetFormAndErrors,
  } = useExpenseForm(selectedExpense);

  

  const { data: productOptions, isLoading: isLoadingProducts, isError: productError } = useFetchData(
    "products",
    "/api/products",
    undefined,
    { enabled: open }
  );

  const { data: brandOptions, isLoading: isLoadingBrands, isError: brandError } = useFetchData(
    "brands",
    "/api/brands",
    undefined,
    { enabled: open }
  );

  const { data: shopOptions, isLoading: isLoadingShops, isError: shopError } = useFetchData(
    "shops",
    "/api/shops",
    async (shops) => {
      return Promise.all(
        shops.map(async (shop) => {
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

  const isLoading = isLoadingProducts || isLoadingBrands || isLoadingShops;
  
  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);

  const [volumeDisplay, setVolumeDisplay] = useState(expense.volume || "");

  useEffect(() => {
    setVolumeDisplay(expense.volume || "");
  }, [expense.volume]);

  useEffect(() => {
    if (open && selectedExpense) {
      // Fetch data or reset form when the dialog is opened
      setExpense(selectedExpense);
    }
  }, [open, selectedExpense, setExpense]);


  
  if(isLoading) {
    return <CircularProgress />
  }

  if (productError) {
    // Handle error state when fetching brands fails
    return <div>Error loading Products</div>;
  }

  if (brandError) {
    // Return a loading indicator while brands are being fetched
    return <div>Error loading brands </div>;
  }

  if (shopError) {
    // Handle error state when fetching brands fails
    return <div>Error loading Shops</div>;
  }


  const handleDateChange = (date) => {
    if (!dayjs(date).isValid()) return;

    if (expense.purchased) {
      setExpense((prevExpense) => ({
        ...prevExpense,
        purchaseDate: date,
      }));
    } else {
      setExpense((prevExpense) => ({
        ...prevExpense,
        registeredDate: date,
      }));
    }
  };

  const handlePurchaseChange = (event) => {
    const isPurchased = event.target.checked;
    setExpense((prevExpense) => ({
      ...prevExpense,
      purchased: isPurchased,
      registeredDate: isPurchased ? null : prevExpense.registeredDate,
      purchaseDate: isPurchased ? prevExpense.purchaseDate : null,
    }));
  };

  const handleRegisterChange = (event) => {
    const isRegistered = event.target.checked;
    setExpense((prevExpense) => ({
      ...prevExpense,
      purchased: !isRegistered,
      registeredDate: isRegistered ? prevExpense.registeredDate : null,
      purchaseDate: isRegistered ? null : prevExpense.purchaseDate,
    }));
  };

  const handleProductSelect = (product) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      productName: product ? product.label : "",
      type: product ? product.type : "",
      measurementUnit: product ? product.measurementUnit : "",
    }));
    resetValidationErrors();
                resetServerError();
  };

  const handleBrandSelect = (selectedOption) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      brandName: selectedOption ? selectedOption.label : "",
    }));
  };

  const handleShopSelect = (shop) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      shopName: shop ? shop.label : "",
      locationName: shop ? shop.locationName : "",
    }));
  };

  

  const handleVolumeChange = (event) => {
    const value = event.target.value;
    setVolumeDisplay(value);
    const numericValue = parseFloat(value);
    handleFieldChange("volume", numericValue);
  };

  const handleDiscountChange = (event) => {
    const { checked } = event.target;
    handleFieldChange("hasDiscount", checked);
    if (!checked) {
      handleFieldChange("discountValue", 0);
      handleFieldChange("discountAmount", 0);
    }
  };

  const handleSaveButtonClick = async () => {
    try {
      await handleSaveExpense(); // Assuming this returns a promise that resolves on success and rejects on failure
      onUpdateSuccess(expense);  // Notify parent of success
      onClose();
    } catch (error) {
      onUpdateFailure(); // Notify parent of failure
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isFormValid()) {
      await handleSaveButtonClick();
    }
  };




  return (
    <BasicDialog open={open} onClose={() => {
      resetFormAndErrors();
      onClose();
    }} dialogTitle="Edit Expense">
      <form onSubmit={handleSubmit}>
      <Box sx={{ p: 2, position: "relative" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Select
              isClearable
              options={productOptions.map((product) => ({
                label: product.name,
                value: product.name,
                type: product.type,
                measurementUnit: product.measurementUnit,
              }))}
              value={
                expense.productName
                  ? { label: expense.productName, value: expense.productName }
                  : null
              }
              onChange={handleProductSelect}
              placeholder="Select Product"
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
             {displayError || validationError ? (
              <ErrorHandling resource="products" field="name" loading={isLoading} />
            ) : null}
          </Grid>
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
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Select
              isClearable
              options={shopOptions.map((shop) => ({
                label: `${shop.name}, ${shop.locationName}`,
                value: shop.name,
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
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Location"
              value={expense.locationName || ""}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Price"
              type="number"
              value={expense.price || ""}
              onChange={(e) =>
                setExpense({ ...expense, price: parseFloat(e.target.value) })
              }
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">Kr</InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Volume type/Quantity"
              type="number"
              value={volumeDisplay}
              onChange={handleVolumeChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {expense.measurementUnit}
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <ExpenseField
              label={`Price per ${
                expense.measurementUnit === "kg"
                  ? "kg"
                  : expense.measurementUnit === "L"
                  ? "L"
                  : expense.measurementUnit === "stk"
                  ? "piece"
                  : ""
              }`}
              value={expense.pricePerUnit || ""}
              InputProps={{
                readOnly: true,
              }}
              InputLabelProps={{
                shrink: true,
              }}
            ></ExpenseField>
          </Grid>

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
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">Kr</InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Price with/without Discount"
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
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Type"
              value={expense.type || ""}
              InputProps={{
                readOnly: true,
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
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
          <Button
            onClick={() => {
              resetFormAndErrors();
              onClose();
            }}
            sx={{ ml: 2 }}
          >
            Cancel
          </Button>
      </Box>
      </form>
    </BasicDialog>
  );
};

export default EditExpenseDialog;
