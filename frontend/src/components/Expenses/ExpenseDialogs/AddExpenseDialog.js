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
//test
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


  const { data: products, isLoading: isLoadingProducts, refetch: refetchProducts } = useFetchData(
    "products",
    "/api/products",
    null,
    { enabled: open }
  );

  const { data: brands, isLoading: isLoadingBrands, refetch: refetchBrands } = useFetchData(
    "brands",
    "/api/brands",
    null,
    { enabled: open } // disable auto-fetching
  );

  const { data: shops, isLoading: isLoadingShops,refetch: refetchShops } = useFetchData(
    "shops",
    "/api/shops",
    async (shops) => {
      //console.log(shops) 
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
    { enabled: open
     } // disable auto-fetching
  );

   // Trigger data fetching when the dialog opens
   useEffect(() => {
    if (open) {
      if (!products || products.length === 0) {
        refetchProducts();
      }
      if (!brands || brands.length === 0) {
        refetchBrands();
      }
      if (!shops || shops.length === 0) {
        refetchShops();
      }
    }
  }, [open, products, brands, shops, refetchProducts, refetchBrands, refetchShops]);

  const isLoading = !open || isLoadingProducts || isLoadingBrands || isLoadingShops;

  // Add console.log statements to check the data
  //console.log("Products fetched:", products);
  //console.log("Brands fetched:", brands);
  //console.log("Shops fetched:", shops);

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
  const handleProductSelect = (selectedOption) => {
    if (selectedOption) {
      console.log("Selected Product:", selectedOption);
  
      // Check if the product has measures
      if (selectedOption.measures && selectedOption.measures.length > 0) {
        const firstMeasure = selectedOption.measures[0]; // Use the first measure
        setAvailableMeasures(selectedOption.measures);
        
        setExpense((prevExpense) => ({
          ...prevExpense,
          productName: selectedOption.name,
          type: selectedOption.type,
          measurementUnit: selectedOption.measurementUnit,
          volume: firstMeasure, // Automatically set volume to the first available measure
        }));
  
        setVolumeDisplay(firstMeasure.toString());
      } else {
        console.log("No measures available for this product.");
        setAvailableMeasures([]); // Clear measures if none are available
        setExpense((prevExpense) => ({
          ...prevExpense,
          productName: selectedOption.name,
          type: selectedOption.type,
          measurementUnit: selectedOption.measurementUnit,
          volume: 0, // Reset the volume
        }));
        setVolumeDisplay("");
      }
    } else {
      // Handle case where no product is selected (clearing the select)
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
    setVolumeDisplay(expense.volume || ""); // Sync volumeDisplay with expense.volume
  }, [expense.volume]);

  const handleVolumeChange = (selectedOption) => {
    if (selectedOption) {
      // If the user selects a volume from the list
      setVolumeDisplay(selectedOption.label);
      handleFieldChange("volume", parseFloat(selectedOption.label));
    } else {
      // If the user clears the selection or inputs manually
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
      onAdd({ ...savedExpense, productName }); // Pass the savedExpense data here
      onClose();
    });
  };

  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle="Add New Expense">
      <Box sx={{ p: 2, position: "relative" }}>
        <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
        <WindowedSelect
              isClearable
              options={(products || []).map((product) => ({
                label: product.name,
                value: product.name,
                name: product.name,
                type: product.type,
                measurementUnit: product.measurementUnit,
                measures: product.measures, // Ensure that measures are passed
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
                // Lazy load more products
                console.log("Scrolled to bottom - fetch more products");
              }}
              loadingMessage={() => "Loading products..."}
              noOptionsMessage={() => "No products found"}
            />
          </Grid>
          <Grid item xs={12} md={6}>
          <WindowedSelect
  isClearable
  options={(brands || []).map((brand) => ({
    label: brand.name,
    value: brand.name,
    name: brand.name,
  }))}
  value={expense.brandName ? { label: expense.brandName, value: expense.brandName } : null}
  onChange={handleBrandSelect}
  placeholder="Velg Merke"
  menuPortalTarget={document.body}
  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
  windowedMenuHeight={300}  // Controls the dropdown height
  itemSize={35}             // Approximate height of each dropdown item in pixels
  onMenuScrollToBottom={() => {
    // Fetch more options when the user scrolls to the bottom
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
              options={(shops || []).map((shop) => ({
                label: `${shop.name}, ${shop.locationName}`,
                value: shop.name,
                name: shop.name,
                locationName: shop.locationName,
              }))}
              value={expense.shopName ? { label: expense.shopName, value: expense.shopName } : null}
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
    <Box sx={{ position: 'relative' }}>
      <WindowedSelect
        isClearable
        options={availableMeasures.map((measure) => ({
          label: measure.toString(),
          value: measure,
        }))}
        value={volumeDisplay ? { label: volumeDisplay, value: volumeDisplay } : null}
        onChange={handleVolumeChange}
        placeholder="Velg Volum"
        menuPortalTarget={document.body}
        styles={{
          menuPortal: (base) => ({ ...base, zIndex: 9999 }),
          control: (base) => ({
            ...base,
            paddingRight: expense.measurementUnit ? '40px' : base.paddingRight, // Add padding for adornment
          }),
        }}
      />
      {expense.measurementUnit && (
        <InputAdornment
          position="end"
          sx={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none', // Prevent interaction
            color: 'rgba(0, 0, 0, 0.54)', // Matches default MUI adornment color
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
  value={expense.discountAmount || ""}  // Ensure controlled input
  onChange={(e) => {
    // Debounce logic can be added here if needed
    handleDiscountAmountChange(e); 
  }}
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