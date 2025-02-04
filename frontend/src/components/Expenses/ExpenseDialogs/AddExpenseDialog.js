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
import ExpenseField from "../../commons/ExpenseField/ExpenseField";
import dayjs from "dayjs";
import useHandleFieldChange from "../../../hooks/useHandleFieldChange";
import useFetchData from "../../../hooks/useFetchData"; // Adjust path as needed
import WindowedSelect from "react-windowed-select";

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

  const [volumeDisplay, setVolumeDisplay] = useState(expense.volume || "");
  const [availableMeasures, setAvailableMeasures] = useState([]);

  // Ensure that products is an array by extracting the products array from the response
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

  // Similarly, if brands are wrapped in an object, adjust the transform accordingly.
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

  // For shops, you already have a transform that maps each shop to include locationName.
  const {
    data: shops,
    isLoading: isLoadingShops,
    refetch: refetchShops,
  } = useFetchData(
    "shops",
    "/api/shops",
    async (shopsData) => {
      // Expecting shopsData to be either an array or an object containing shops
      // Adjust if needed; here, we'll assume it's directly an array.
      const shopsArray = Array.isArray(shopsData) ? shopsData : shopsData?.shops || [];
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

  // Trigger data fetching when the dialog opens
  useEffect(() => {
    if (open) {
      if (!products || (Array.isArray(products) && products.length === 0)) {
        refetchProducts();
      }
      if (!brands || (Array.isArray(brands) && brands.length === 0)) {
        refetchBrands();
      }
      if (!shops || (Array.isArray(shops) && shops.length === 0)) {
        refetchShops();
      }
    }
  }, [open, products, brands, shops, refetchProducts, refetchBrands, refetchShops]);

  const isLoading = !open || isLoadingProducts || isLoadingBrands || isLoadingShops;

  useEffect(() => {
    console.log("Products fetched:", products);
  }, [products]);

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

  const { handleFieldChange, handleDiscountAmountChange, handleDiscountValueChange } =
    useHandleFieldChange(expense, setExpense);

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
      shopName: shop ? shop.value : "",
      locationName: shop ? shop.locationName : "",
    }));
  };

  const handleBrandSelect = (selectedOption) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      brandName: selectedOption ? selectedOption.name : "",
    }));
  };

  const handleProductSelect = (selectedOption) => {
    if (selectedOption) {
      console.log("Selected Product:", selectedOption);
      if (selectedOption.measures && selectedOption.measures.length > 0) {
        const firstMeasure = selectedOption.measures[0];
        setAvailableMeasures(selectedOption.measures);
        setExpense((prevExpense) => ({
          ...prevExpense,
          productName: selectedOption.name,
          type: selectedOption.type,
          measurementUnit: selectedOption.measurementUnit,
          volume: firstMeasure,
        }));
        setVolumeDisplay(firstMeasure.toString());
      } else {
        console.log("No measures available for this product.");
        setAvailableMeasures([]);
        setExpense((prevExpense) => ({
          ...prevExpense,
          productName: selectedOption.name,
          type: selectedOption.type,
          measurementUnit: selectedOption.measurementUnit,
          volume: 0,
        }));
        setVolumeDisplay("");
      }
    } else {
      setExpense((prevExpense) => ({
        ...prevExpense,
        productName: "",
        type: "",
        measurementUnit: "",
        volume: 0,
      }));
      setAvailableMeasures([]);
      setVolumeDisplay("");
    }
  };

  useEffect(() => {
    setVolumeDisplay(expense.volume || "");
  }, [expense.volume]);

  const handleVolumeChange = (selectedOption) => {
    if (selectedOption) {
      setVolumeDisplay(selectedOption.label);
      handleFieldChange("volume", parseFloat(selectedOption.label));
    } else {
      setVolumeDisplay("");
      handleFieldChange("volume", 0);
    }
  };

  const handleManualVolumeInput = (event) => {
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
      onAdd({ ...savedExpense, productName });
      onClose();
    });
  };

  // Safeguard: Ensure products, brands, shops are arrays before mapping
  const safeProducts = Array.isArray(products) ? products : [];
  const safeBrands = Array.isArray(brands) ? brands : [];
  const safeShops = Array.isArray(shops) ? shops : [];

  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle="Add New Expense">
      <Box sx={{ p: 2, position: "relative" }}>
        <Grid container spacing={2}>
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
              placeholder="Velg Produkt"
              menuPortalTarget={document.body}
              styles={{
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              windowedMenuHeight={300}
              itemSize={35}
              onMenuScrollToBottom={() => {
                console.log("Scrolled to bottom - fetch more products");
              }}
              loadingMessage={() => "Loading products..."}
              noOptionsMessage={() => "No products found"}
            />
          </Grid>
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
              placeholder="Velg Merke"
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
              windowedMenuHeight={300}
              itemSize={35}
              onMenuScrollToBottom={() => {
                console.log("Scrolled to bottom - fetch more data");
              }}
              filterOption={(option, inputValue) =>
                option.label.toLowerCase().includes(inputValue.toLowerCase())
              }
            />
          </Grid>
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
              placeholder="Velg Butikk"
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
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
            {availableMeasures.length > 0 ? (
              <Box sx={{ position: "relative" }}>
                <WindowedSelect
                  isClearable
                  options={availableMeasures.map((measure) => ({
                    label: measure.toString(),
                    value: measure,
                  }))}
                  value={
                    volumeDisplay
                      ? { label: volumeDisplay, value: volumeDisplay }
                      : null
                  }
                  onChange={handleVolumeChange}
                  placeholder="Velg Volum"
                  menuPortalTarget={document.body}
                  styles={{
                    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                    control: (base) => ({
                      ...base,
                      paddingRight: expense.measurementUnit ? "40px" : base.paddingRight,
                    }),
                  }}
                />
                {expense.measurementUnit && (
                  <InputAdornment
                    position="end"
                    sx={{
                      position: "absolute",
                      right: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      pointerEvents: "none",
                      color: "rgba(0, 0, 0, 0.54)",
                    }}
                  >
                    {expense.measurementUnit}
                  </InputAdornment>
                )}
              </Box>
            ) : (
              <ExpenseField
                label="Volum (Manuell)"
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
                  value={expense.discountAmount || ""}
                  onChange={(e) => {
                    handleDiscountAmountChange(e);
                  }}
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
              value={expense.finalPrice}
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
