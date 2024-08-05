import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import useExpenseForm from "../useExpenseForm";
import ExpenseField from "../../commons/ExpenseField/ExpenseField"
import dayjs from "dayjs";
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";
import useFetchData from "../../../hooks/useFetchData";// Adjust path as needed
import Select from "react-select"

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
  pricePerUnit: 0, // New field for price per kg or L
};

const AddExpenseDialog = ({ open, onClose, onAdd }) => {
  const {
    expense = defaultExpense,
    handleSaveExpense,
    isFormValid,
    setExpense,
    resetFormAndErrors,
  } = useExpenseForm();

  const { data: products, isLoading: isLoadingProducts } = useFetchData(
    "products",
    "/api/products"
  );

  const { data: brands, isLoading: isLoadingBrands } = useFetchData(
    "brands",
    "/api/brands"
  );

  const { data: shops, isLoading: isLoadingShops } = useFetchData(
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
    }
  );

  const isLoading = isLoadingProducts || isLoadingBrands || isLoadingShops;

  // Use the useFilter hook
 


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

  const {
    handleFieldChange,
    handleDiscountAmountChange,
    handleDiscountValueChange,
  } = useHandleFieldChange(expense, setExpense);



  
  

 

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

  const handleQuantityChange = (event) => {
    const value = event.target.value;
    handleFieldChange("quantity", value);
  };

  const handleShopSelect = (shop) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      shopName: shop ? shop.value : "", // Handle null case
      locationName: shop ? shop.locationName : "", // Handle null case
    }));
  };

  const handleBrandSelect = (selectedOption) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      brandName: selectedOption ? selectedOption.name : "", // Handle null case
    }));
  };
  const handleProductSelect = (product) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      productName: product ? product.name : "", // Handle null case
      type: product ? product.type : "", // Handle null case
      measurementUnit: product ? product.measurementUnit : "", // Handle null case
    }));
  };
  

  const [volumeDisplay, setVolumeDisplay] = useState(expense.volume || "");

  useEffect(() => {
    setVolumeDisplay(expense.volume || ""); // Sync volumeDisplay with expense.volume
  }, [expense.volume]);

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

  const handleSaveButtonClick = () => {
    console.log("Save button clicked");
    handleSaveExpense((savedExpense) => {
      console.log("handleSaveExpense callback invoked with:", savedExpense);
      const productName = savedExpense.productName || "Unknown Product";
      onAdd({ ...savedExpense, productName }); // Pass the savedExpense data here
      onClose();
    });
  };

  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle="Add New Expense">
      <Box sx={{ p: 2, position: "relative" }}>
        <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
            <Select
            isClearable
              options={products.map((product) => ({
                label: product.name,
                value: product.name,
                name: product.name,
                type: product.type,
                measurementUnit: product.measurementUnit,
              }))}
              value={
                expense.productName
                  ? { label: expense.productName, value: expense.productName }
                  : null
              }
              onChange={handleProductSelect}
              placeholder="Velg Produkt"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Select
            isClearable
              options={brands.map((brand) => ({
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
              placeholder="Velg Merke"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Select
            isClearable
              options={shops.map((shop) => ({
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
              placeholder="Velg Butikk"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Location"
              value={expense.locationName}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Price"
              type="number"
              value={expense.price}
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
                  : " "
              }`}
              value={expense.pricePerUnit}
              InputProps={{
                readOnly: true,
              }}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Quantity"
              type="number"
              value={expense.quantity}
              onChange={handleQuantityChange}
            />
          </Grid>
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
                  value={expense.discountAmount}
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
              value={expense.finalPrice} // or calculated value
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
        <Button
          variant="contained"
          color="primary"
          onClick={handleSaveButtonClick}
          disabled={!isFormValid || isLoading}
        >
          Save
        </Button>
      </Box>
    </BasicDialog>
  );
};

export default AddExpenseDialog;