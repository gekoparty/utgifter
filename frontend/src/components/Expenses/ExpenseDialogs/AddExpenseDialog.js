import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  TextField,
  Grid,
  InputAdornment,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import BasicDialog from "../../commons/BasicDialog/BasicDialog";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import useExpenseForm from "../useExpenseForm";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import SelectPopover from "../../commons/SelectPopover/SelectPopover"; // Adjust path as needed

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


  const fetchProducts = async () => {
    const response = await fetch("/api/products");
    if (!response.ok) {
      throw new Error(`Failed to fetch products`);
    }
    return response.json();
  };

  const fetchBrands = async () => {
    const response = await fetch("/api/brands");
    if (!response.ok) {
      throw new Error(`Failed to fetch brands`);
    }
    return response.json();
  };

  const fetchShops = async () => {
    const response = await fetch("/api/shops");
    if (!response.ok) {
      throw new Error(`Failed to fetch shops`);
    }
    const shops = await response.json();

    // Fetch locations for each shop
    const shopsWithLocations = await Promise.all(
      shops.map(async (shop) => {
        const locationResponse = await fetch(`/api/locations/${shop.location}`);
        if (!locationResponse.ok) {
          throw new Error(
            `Failed to fetch location details for location: ${shop.location}`
          );
        }
        const location = await locationResponse.json();
        return { ...shop, locationName: location.name };
      })
    );

    return shopsWithLocations;
  };

  // Use useQuery hooks to fetch data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery(
    ["products"],
    fetchProducts,
    { enabled: open }
  );
  const { data: brands = [], isLoading: isLoadingBrands } = useQuery(
    ["brands"],
    fetchBrands,
    { enabled: open }
  );
  const { data: shops = [], isLoading: isLoadingShops } = useQuery(
    ["shops"],
    fetchShops,
    { enabled: open }
  );

  const isLoading = isLoadingProducts || isLoadingBrands || isLoadingShops;

  const formatDate = (date) => {
    if (!date) return '';
    return dayjs(date).format('DD.MM.YY'); // Change format as needed
  };


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


  const handleFieldChangeInternal = (field, value, additionalChanges = {}) => {
    setExpense((prevExpense) => {
      const updatedExpense = {
        ...prevExpense,
        [field]: value,
        ...additionalChanges,
      };

      if (field === "price" || field === "discountValue" || field === "discountAmount") {
        const discountAmount = updatedExpense.hasDiscount
          ? updatedExpense.discountValue > 0
            ? updatedExpense.price * (updatedExpense.discountValue / 100)
            : updatedExpense.discountAmount
          : 0;
        const finalPrice = updatedExpense.price - discountAmount;

        if (field === "discountAmount" && updatedExpense.price > 0) {
          updatedExpense.discountValue = ((value / updatedExpense.price) * 100).toFixed(2);
        }

        updatedExpense.discountAmount = discountAmount.toFixed(2);
        updatedExpense.finalPrice = finalPrice.toFixed(2);
      }

      if (field === "volume") {
        updatedExpense.volume = parseFloat(value);
      }
  
      if (field === "quantity") {
        updatedExpense.quantity = parseInt(value);
      }

      // Calculate price per unit (kg or L) based on measurement unit
      if (field === "finalPrice" || field === "volume" || field === "measurementUnit") {
        updatedExpense.pricePerUnit = calculatePricePerUnit(updatedExpense.finalPrice, updatedExpense.volume, updatedExpense.measurementUnit);
      }
      return updatedExpense;
    });
  };

  // Helper function to calculate price per unit
  const calculatePricePerUnit = (finalPrice, volume, measurementUnit) => {
    if (volume > 0 && finalPrice > 0) {
      return (finalPrice / volume).toFixed(2);
    }
    return 0;
  };

  // State variables and functions for popover management
  const [anchorState, setAnchorState] = useState({
    productAnchorEl: null,
    brandAnchorEl: null,
    shopAnchorEl: null,
  });

  const handleOpenPopover = (field, event) => {
    setAnchorState((prevAnchorState) => ({
      ...prevAnchorState,
      [`${field}AnchorEl`]: event.currentTarget,
    }));
  };

  const handleClosePopover = (field) => {
    setAnchorState((prevAnchorState) => ({
      ...prevAnchorState,
      [`${field}AnchorEl`]: null,
    }));
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

  const handleQuantityChange = (event) => {
    const value = event.target.value;
    handleFieldChangeInternal("quantity", value);
  };

  const handleShopSelect = (shop) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      shopName: shop.value, // Set only the shop name here
      locationName: shop.locationName, // Set the location name here
    }));
    handleClosePopover("shop");
  };

  const handleProductSelect = (product) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      productName: product.name,
      type: product.type, // Ensure type is set
      measurementUnit: product.measurementUnit,
    }));
    handleClosePopover("product");
  };

  const [volumeDisplay, setVolumeDisplay] = useState(expense.volume || "");

  useEffect(() => {
    setVolumeDisplay(expense.volume || ""); // Sync volumeDisplay with expense.volume
  }, [expense.volume]);

  const handleVolumeChange = (event) => {
    const value = event.target.value;
    setVolumeDisplay(value);
    const numericValue = parseFloat(value);
    handleFieldChangeInternal("volume", numericValue);
  };

  const handleDiscountChange = (event) => {
    const { checked } = event.target;
    handleFieldChangeInternal("hasDiscount", checked);
    if (!checked) {
      handleFieldChangeInternal("discountValue", 0);
      handleFieldChangeInternal("discountAmount", 0);
    }
  };

  const handleDiscountValueChange = (event) => {
    const value = parseFloat(event.target.value) || 0; // Use 0 if value is NaN
    setExpense((prevExpense) => {
      const discountAmount = value > 0 ? prevExpense.price * (value / 100) : 0;
      const finalPrice = prevExpense.price - discountAmount;
      return {
        ...prevExpense,
        discountValue: value,
        discountAmount: discountAmount.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
        pricePerUnit: calculatePricePerUnit(finalPrice, prevExpense.volume, prevExpense.measurementUnit)
      };
    });
  };

  const handleDiscountAmountChange = (event) => {
    const value = parseFloat(event.target.value) || 0; // Use 0 if value is NaN
    setExpense((prevExpense) => {
      const discountValue = prevExpense.price > 0 ? (value / prevExpense.price) * 100 : 0;
      const finalPrice = prevExpense.price - value;
      return {
        ...prevExpense,
        discountAmount: value,
        discountValue: discountValue.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
        pricePerUnit: calculatePricePerUnit(finalPrice, prevExpense.volume, prevExpense.measurementUnit)
      };
    });
  };

  useEffect(() => {
    const finalPrice = calculateFinalPrice();
    setExpense((prevExpense) => ({
      ...prevExpense,
      finalPrice,
    }));
  }, [expense.price, expense.discountValue, expense.discountAmount, expense.hasDiscount]);

  const calculateFinalPrice = () => {
    if (expense.hasDiscount) {
      if (expense.discountValue > 0) {
        return (expense.price - expense.price * (expense.discountValue / 100)).toFixed(2);
      }
      return (expense.price - expense.discountAmount).toFixed(2);
    }
    return expense.price;
  };


  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle="Add New Expense">
      <Box sx={{ p: 2, position: 'relative' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Produkt"
              value={expense.productName}
              onClick={(e) => handleOpenPopover("product", e)}
            />
            <SelectPopover
              open={Boolean(anchorState.productAnchorEl)}
              anchorEl={anchorState.productAnchorEl}
              onClose={() => handleClosePopover("product")}
              onSelect={handleProductSelect}
              options={products.map(product => ({
                name: product.name,
                value: product.name,
                type: product.type,
                measurementUnit: product.measurementUnit,
              }))}
              title="Select Product"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Merke"
              value={expense.brandName}
              onClick={(e) => handleOpenPopover("brand", e)}
            />
            <SelectPopover
              open={Boolean(anchorState.brandAnchorEl)}
              anchorEl={anchorState.brandAnchorEl}
              onClose={() => handleClosePopover("brand")}
              onSelect={(value) => handleFieldChangeInternal("brandName", value.name)}
              options={brands.map(brand => ({
                name: brand.name,
                value: brand.name,
              }))}
              title="Select Brand"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Butikk"
              value={expense.shopName}
              onClick={(e) => handleOpenPopover("shop", e)}
            />
            <SelectPopover
              open={Boolean(anchorState.shopAnchorEl)}
              anchorEl={anchorState.shopAnchorEl}
              onClose={() => handleClosePopover("shop")}
              onSelect={handleShopSelect}
              options={shops.map(shop => ({
                name: `${shop.name}, ${shop.locationName}`,
                value: shop.name,
                locationName: shop.locationName,
              }))}
              title="Select Shop"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Lokasjon"
              value={expense.locationName}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pris"
              type="number"
              value={expense.price}
              onChange={(e) => handleFieldChangeInternal("price", parseFloat(e.target.value))}
              InputProps={{
                startAdornment: <InputAdornment position="start">Kr</InputAdornment>,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Volume type/Mengde"
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
            <TextField
              fullWidth
              label={`Price per ${expense.measurementUnit === "kg" ? "kg" : "L"}`}
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
            <TextField
              fullWidth
              label="Antall"
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
              label="Rabatt?"
            />
          </Grid>
          {expense.hasDiscount && (
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rabatt i (%)"
                  type="number"
                  value={expense.discountValue}
                  onChange={handleDiscountValueChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Rabatt i Kr"
                  type="number"
                  value={expense.discountAmount}
                  onChange={handleDiscountAmountChange}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Kr</InputAdornment>,
                  }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Pris m/u Rabatt"
              type="number"
              value={calculateFinalPrice()}
              InputProps={{
                readOnly: true,
                 startAdornment: <InputAdornment position="start">Kr</InputAdornment>
              }}
             
              
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Type"
              value={expense.type || ''}
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
              value={dayjs(expense.purchased ? expense.purchaseDate : expense.registeredDate)}
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
          onClick={() => handleSaveExpense(onAdd)}
          disabled={!isFormValid || isLoading}
        >
          Save
        </Button>
      </Box>
    </BasicDialog>
  );
};

export default AddExpenseDialog;
