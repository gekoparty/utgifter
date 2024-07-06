import React, { useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Checkbox,
  Snackbar,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  InputAdornment,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  fetchBrands,
  fetchShops,
  fetchProducts,
} from "../components/commons/Utils/apiUtils";
import dayjs from "dayjs";
import SelectPopover from "../components/commons/SelectPopover/SelectPopover";
import BasicDialog from "../components/commons/BasicDialog/BasicDialog";
import useExpenseForm from "../components/Expenses/useExpenseForm";

const defaultExpense = {
  productName: '',
  brandName: '',
  shopName: '',
  locationName: '',
  price: 0,
  volume: 0,
  discountValue: 0,
  hasDiscount: false,
  purchased: false,
  registeredDate: null,
  purchaseDate: null,
};

const ExpenseScreen = ({ drawerWidth = 240 }) => {
  const {
    expense = defaultExpense,
    handleFieldChange,
    handleSaveExpense,
    isFormValid,
    setExpense,
  } = useExpenseForm();


  const [anchorState, setAnchorState] = useState({
    productAnchorEl: null,
    shopAnchorEl: null,
    focusedField: null,
  });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [quantity, setQuantity] = useState(1); // State to manage quantity

  // Fetching data using useQuery
  const {
    data: productOptions,
    isLoading: productLoading,
    isError: productError,
  } = useQuery(["products"], fetchProducts);
  const {
    data: shopOptions,
    isLoading: shopLoading,
    isError: shopError,
  } = useQuery(["shops"], fetchShops);
  const {
    data: brandOptions,
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery(["brands"], fetchBrands);

  const filterOptions = (options, fieldName, filterValue) => {
    console.log("filterOptions called with:", { options, fieldName, filterValue });
    if (!filterValue || !options) return options;
  
    // Convert filterValue to string if it's an object
    const filterText = typeof filterValue === "object" ? filterValue[fieldName] : filterValue;
  
    return options.filter((option) =>
      option[fieldName].toLowerCase().startsWith(filterText.toLowerCase())
    );
  };
  const handleDateChange = (date) => {
    const formattedDate = dayjs(date).format(); // Format the date

    if (expense.purchased) {
      // If purchased, update purchaseDate and set registeredDate to null
      setExpense((prevExpense) => ({
        ...prevExpense,
        purchaseDate: formattedDate,
        registeredDate: null,
      }));
    } else {
      // If registered, update registeredDate and set purchaseDate to null
      setExpense((prevExpense) => ({
        ...prevExpense,
        registeredDate: formattedDate,
        purchaseDate: null,
      }));
    }
  };

 

  // Function to handle popover opening
 const handleOpenPopover = (field, event) => {
  setAnchorState((prevAnchorState) => ({
    ...prevAnchorState,
    [`${field}AnchorEl`]: event.currentTarget,
    focusedField: field,
  }));

  // Set the measurement unit when product is selected
  if (field === "product") {
    const selectedProduct = productOptions.find(
      (product) => product.name === expense.productName
    );
    if (selectedProduct) {
      setExpense((prevExpense) => ({
        ...prevExpense,
        measurementUnit: selectedProduct.measurementUnit,
      }));
    }
  }
};

  // Function to handle quantity change
  const handleQuantityChange = (value) => {
    // Parse the value as a number before setting the state
    setQuantity(parseInt(value));
  };
  // Function to handle discount checkbox change
  // Function to handle discount checkbox change
  const handleDiscountChange = (event) => {
    if (!event.target.checked) {
      // If the checkbox is unchecked, reset discount value and set hasDiscount to false
      handleFieldChange("hasDiscount", false);
      handleFieldChange("discountValue", 0);
    } else {
      // If the checkbox is checked, set hasDiscount to true
      handleFieldChange("hasDiscount", true);
    }
  };

  const calculateTotalPrice = () => {
    //console.log('Price:', expense.price);
    //console.log('Quantity:', expense.quantity);
    //console.log('Discount Value:', expense.discountValue);

    let totalPrice = expense.price * quantity;
    //console.log('Total Price (Before Discount):', totalPrice);

    if (expense.hasDiscount) {
      //console.log('Applying Discount...');
      totalPrice -= expense.discountValue;
    }

    //console.log('Total Price (After Discount):', totalPrice);

    // Check if totalPrice is NaN after calculations
    //console.log('Is totalPrice NaN?', isNaN(totalPrice));

    return parseFloat(totalPrice.toFixed(2));
  };

  

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isFormValid()) {
        await handleSaveExpense(() => console.log("Expense saved!"));
    } else {
        console.log("Form is invalid, please correct the errors.");
    }
};
  const content = () => {
    return (
      <>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Radio buttons for selecting purchase mode */}
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Purchase Mode</FormLabel>
                <RadioGroup
                  aria-label="purchase-mode"
                  name="purchaseMode"
                  value={expense.purchased ? "purchased" : "registered"}
                  onChange={(e) =>
                    handleFieldChange(
                      "purchased",
                      e.target.value === "purchased"
                    )
                  }
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
              </FormControl>
            </Grid>
            <Grid container item xs={12} spacing={2}>
            <Grid item xs={8}>
              <FormControl fullWidth>
                <InputLabel></InputLabel>
                <TextField
                variant="filled"
                  label="Produkt"
                  value={expense.productName}
                  onChange={(e) =>
                    handleFieldChange("productName", e.target.value)
                  }
                  autoComplete="off"
                  //onKeyDown={handleOpenProductPopover}
                  onFocus={(e) => handleOpenPopover("product", e)}
                  fullWidth
                />
              </FormControl>
              </Grid>
              <Grid item xs={4}>
              <InputLabel></InputLabel>
                <TextField
                variant="filled"
                  label="Volume"
                  type="number"
                  value={expense.volume}
                  onChange={(e) =>
                    handleFieldChange("volume", e.target.value)
                  }
                  autoComplete="off"
                  //onKeyDown={handleOpenProductPopover}
                  onFocus={(e) => handleOpenPopover("volume", e)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{expense.measurementUnit}</InputAdornment>,
                  }}
                  fullWidth
                />
                </Grid>
              {anchorState.focusedField === "product" && (
                <SelectPopover
                  open={Boolean(anchorState.productAnchorEl)}
                  anchorEl={anchorState.productAnchorEl}
                  onClose={() =>
                    setAnchorState((prevAnchorState) => ({
                      ...prevAnchorState,
                      productAnchorEl: null,
                    }))
                  }
                  options={filterOptions(
                    productOptions,
                    "name",
                    expense.productName
                  )}
                  onSelect={(product) => {
                    console.log("Product selected:", product);
                    handleFieldChange("productName", product.name);
                    setAnchorState((prevAnchorState) => ({
                      ...prevAnchorState,
                      productAnchorEl: null,
                    }));
                  }}
                  type="product"
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel></InputLabel>
                <TextField
                variant="filled"
                  label="Merke"
                  value={expense.brandName}
                  onChange={(e) =>
                    handleFieldChange("brandName", e.target.value)
                  }
                  autoComplete="off"
                  //onKeyDown={handleOpenProductPopover}
                  onFocus={(e) => handleOpenPopover("brand", e)}
                  fullWidth
                />
              </FormControl>
              {anchorState.focusedField === "brand" && (
                <SelectPopover
                  open={Boolean(anchorState.brandAnchorEl)}
                  anchorEl={anchorState.brandAnchorEl}
                  onClose={() =>
                    setAnchorState((prevAnchorState) => ({
                      ...prevAnchorState,
                      brandAnchorEl: null,
                    }))
                  }
                  options={filterOptions(
                    brandOptions,
                    "name",
                    expense.brandName
                  )}
                  onSelect={(brand) => {
                    handleFieldChange("brandName", brand.name);
                    setAnchorState((prevAnchorState) => ({
                      ...prevAnchorState,
                      productAnchorEl: null,
                    }));
                  }}
                  type="brand"
                />
              )}
            </Grid>
            {/* Add new TextField for adding a shop */}
            <Grid container item xs={12} spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth>
                  <InputLabel></InputLabel>
                  <TextField
                  variant="filled"
                    label="Butikk"
                    autoComplete="off"
                    onChange={(e) =>
                      handleFieldChange("shopName", e.target.value)
                    }
                    // onKeyDown={handleOpenShopPopover}
                    onFocus={(e) => handleOpenPopover("shop", e)}
                    fullWidth
                    value={expense.shopName}
                  />
                </FormControl>
              </Grid>
              <Grid item xs={6}>
              <FormControl fullWidth>
                {" "}
                {/* Right side for location name */}
                <TextField
                  label="Lokasjon"
                  disabled // Disables editing of the location name
                  value={expense.locationName}
                />
                </FormControl>
              </Grid>
              {anchorState.focusedField === "shop" && (
                 <SelectPopover
                 open={Boolean(anchorState.shopAnchorEl)}
                 anchorEl={anchorState.shopAnchorEl}
                 onClose={() =>
                     setAnchorState((prevAnchorState) => ({
                         ...prevAnchorState,
                         shopAnchorEl: null,
                     }))
                 }
                 options={filterOptions(
                     shopOptions,
                     "name",
                     expense.shopName
                 ).map((shop) => ({
                     ...shop,
                     displayName: `${shop.name}, ${shop.locationName}`,
                 }))}
                 onSelect={(shop) => {
                     handleFieldChange("shopName", shop.name);
                     handleFieldChange("locationName", shop.locationName);
                     setAnchorState((prevAnchorState) => ({
                         ...prevAnchorState,
                         shopAnchorEl: null,
                     }));
                 }}
                 type="shop"
             />
              )}
            </Grid>
            {/* Add Checkbox for discount */}
            <Grid container item xs={12} spacing={2}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={expense.hasDiscount}
                      onChange={handleDiscountChange}
                    />
                  }
                  label="Rabatt"
                />
              </Grid>
              <Grid item xs={6}>
                {expense.hasDiscount && (
                  <FormControl fullWidth>
                    <InputLabel></InputLabel>
                    <TextField
                    color="warning"
                      label="Rabattverdi"
                      type="number"
                      value={expense.discountValue}
                      onChange={(e) =>
                        handleFieldChange("discountValue", e.target.value)
                      }
                      autoComplete="off"
                      fullWidth
                    />
                  </FormControl>
                )}
              </Grid>
            </Grid>
            {/* New fields for price and quantity */}
            <Grid container item xs={12} spacing={2}>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel></InputLabel>
                  <TextField
                    label="Pris"
                    type="number"
                    value={expense.price}
                    onChange={(e) => handleFieldChange("price", e.target.value)}
                    autoComplete="off"
                    fullWidth
                  />
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel></InputLabel>
                  <TextField
                    label="Antall"
                    type="number"
                    value={expense.quantity}
                    // Handle quantity separately
                    onChange={(e) => handleFieldChange("quantity", e.target.value)}
                    autoComplete="off"
                    fullWidth
                  />
                </FormControl>
              </Grid>
              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel></InputLabel>
                  <TextField
                    // Calculate total price based on price and quantity
                    label="Total"
                    InputProps={{ readOnly: true }}
                    value={calculateTotalPrice()}
                    fullWidth
                  />
                </FormControl>
              </Grid>
              {/* Conditional rendering of DatePicker */}

              <Grid item xs={6}>
  {expense.purchased ? (
    <DatePicker
      label="Purchase Date"
      value={expense.purchaseDate ? dayjs(expense.purchaseDate) : null}
      onChange={handleDateChange}
    />
  ) : (
    <DatePicker
      label="Registered Date"
      value={expense.registeredDate ? dayjs(expense.registeredDate) : null}
      onChange={handleDateChange}
    />
  )}
</Grid>
            </Grid>
            <Grid container item xs={12} justifyContent="flex-end">
            <Button variant="contained" type="submit" disabled={!isFormValid()}>
                Submit
              </Button>
            </Grid>
          </Grid>
        </form>
      </>
    );
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        marginLeft: `${drawerWidth}px`,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "800px" }}>
        <Box
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Paper sx={{ p: 2 }}>
            {" "}
            {/* Add Paper component to contain the form */}
            {content()} {/* Render the form */}
          </Paper>
        </Box>
        <BasicDialog
          getContent={() => content()}
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          confirmButtonText="Bekreft Sletting"
          cancelButtonText="Kanseler"
          dialogTitle="Bekreft Sletting"
          cancelButton={
            <Button onClick={() => setDeleteModalOpen(false)}>Avbryt</Button>
          }
        />
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        // onClose={handleSnackbarClose}
      >
        {/* Snackbar Content */}
      </Snackbar>
    </Box>
  );
};

export default ExpenseScreen;
