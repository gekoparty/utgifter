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
import {
  calculateDiscountAmount,
  calculateFinalPrice,
  calculatePricePerUnit,
} from "../../commons/Utils/expenseUtils";
import ExpenseField from "../../commons/ExpenseField/ExpenseField";
import dayjs from "dayjs";

import useFetchData from "../../../hooks/useFetchData";
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

      if (
        field === "price" ||
        field === "discountValue" ||
        field === "discountAmount"
      ) {
        const discountAmount = updatedExpense.hasDiscount
          ? calculateDiscountAmount(
              updatedExpense.price,
              updatedExpense.discountValue
            )
          : 0;

        const finalPrice = calculateFinalPrice(
          updatedExpense.price,
          discountAmount,
          updatedExpense.hasDiscount
        );

        if (field === "discountAmount" && updatedExpense.price > 0) {
          updatedExpense.discountValue = (
            (value / updatedExpense.price) *
            100
          ).toFixed(2);
        }

        updatedExpense.discountAmount = discountAmount.toFixed(2);
        updatedExpense.finalPrice = finalPrice;
      }

      if (field === "volume") {
        updatedExpense.volume = parseFloat(value);
      }

      // Calculate price per unit based on measurement unit
      if (
        field === "finalPrice" ||
        field === "volume" ||
        field === "measurementUnit"
      ) {
        updatedExpense.pricePerUnit = calculatePricePerUnit(
          updatedExpense.finalPrice,
          updatedExpense.volume,
          updatedExpense.measurementUnit
        );
      }

      return updatedExpense;
    });
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
      const discountAmount = calculateDiscountAmount(prevExpense.price, value);

      const finalPrice = calculateFinalPrice(
        prevExpense.price,
        discountAmount,
        prevExpense.hasDiscount
      );

      return {
        ...prevExpense,
        discountValue: value,
        discountAmount: discountAmount.toFixed(2),
        finalPrice: finalPrice,
        pricePerUnit: calculatePricePerUnit(
          finalPrice,
          prevExpense.volume,
          prevExpense.measurementUnit
        ),
      };
    });
  };
  const handleDiscountAmountChange = (event) => {
    const value = parseFloat(event.target.value) || 0; // Use 0 if value is NaN
    setExpense((prevExpense) => {
      const discountValue =
        prevExpense.price > 0 ? (value / prevExpense.price) * 100 : 0;

      const finalPrice = calculateFinalPrice(
        prevExpense.price,
        value,
        prevExpense.hasDiscount
      );

      return {
        ...prevExpense,
        discountAmount: value,
        discountValue: discountValue.toFixed(2),
        finalPrice: finalPrice,
        pricePerUnit: calculatePricePerUnit(
          finalPrice,
          prevExpense.volume,
          prevExpense.measurementUnit
        ),
      };
    });
  };

  useEffect(() => {
    const discountAmount = calculateDiscountAmount(
      expense.price,
      expense.discountValue
    );
    const finalPrice = calculateFinalPrice(
      expense.price,
      discountAmount,
      expense.hasDiscount
    );
    const pricePerUnit = calculatePricePerUnit(
      finalPrice,
      expense.volume,
      expense.measurementUnit
    );

    setExpense((prevExpense) => ({
      ...prevExpense,
      finalPrice: finalPrice,
      discountAmount: discountAmount.toFixed(2),
      pricePerUnit: pricePerUnit,
    }));
  }, [
    expense.price,
    expense.discountValue,
    expense.hasDiscount,
    expense.volume,
    expense.measurementUnit,
  ]);

  const handleSaveButtonClick = () => {
    console.log("Save button clicked");
    handleSaveExpense((savedExpense) => {
      console.log("handleSaveExpense callback invoked with:", savedExpense);
      onAdd(savedExpense); // Pass the savedExpense data here
      onClose();
    });
  };

  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle="Add New Expense">
      <Box sx={{ p: 2, position: "relative" }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <ExpenseField
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
              options={products.map((product) => ({
                name: product.name,
                value: product.name,
                type: product.type,
                measurementUnit: product.measurementUnit,
              }))}
              title="Select Product"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
              fullWidth
              label="Merke"
              value={expense.brandName}
              onClick={(e) => handleOpenPopover("brand", e)}
            />
            <SelectPopover
              open={Boolean(anchorState.brandAnchorEl)}
              anchorEl={anchorState.brandAnchorEl}
              onClose={() => handleClosePopover("brand")}
              onSelect={(value) =>
                handleFieldChangeInternal("brandName", value.name)
              }
              options={brands.map((brand) => ({
                name: brand.name,
                value: brand.name,
              }))}
              title="Select Brand"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
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
              options={shops.map((shop) => ({
                name: `${shop.name}, ${shop.locationName}`,
                value: shop.name,
                locationName: shop.locationName,
              }))}
              title="Select Shop"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <ExpenseField
              label="Lokasjon"
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
            <ExpenseField
              label={`Pris pr ${
                expense.measurementUnit === "kg"
                  ? "kg"
                  : expense.measurementUnit === "L"
                  ? "L"
                  : expense.measurementUnit === "stk"
                  ? "stk"
                  : " " // Fallback in case of an unknown unit
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
                <ExpenseField
                  label="Rabatt i (%)"
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
                  label="Rabatt i Kr"
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
              label="Pris m/u Rabatt"
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