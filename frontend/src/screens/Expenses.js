import React, { useState, useMemo } from "react";
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
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import {
  fetchBrands,
  fetchShops,
  fetchProducts,
} from "../components/commons/Utils/apiUtils";

import SelectPopover from "../components/commons/SelectPopover/SelectPopover";
import BasicDialog from "../components/commons/BasicDialog/BasicDialog";

const Expenses = ({ drawerWidth = 240 }) => {
  const [expense, setExpense] = useState({
    productName: "",
    shopName: "",
    brandName: "",
    price: "",
  });
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
  const [hasDiscount, setHasDiscount] = useState(false); // State to track if the product has a discount
  const [discountValue, setDiscountValue] = useState(0); // State to track the discount value

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
    if (!filterValue || !options) return options;
    return options.filter((option) =>
      option[fieldName].toLowerCase().startsWith(filterValue.toLowerCase())
    );
  };

  // Function to handle field changes
  const handleFieldChange = (field, value) => {
    setExpense((prevExpense) => ({ ...prevExpense, [field]: value }));
  };

  // Function to handle popover opening
  const handleOpenPopover = (field, event) => {
    setAnchorState((prevAnchorState) => ({
      ...prevAnchorState,
      [`${field}AnchorEl`]: event.currentTarget,
      focusedField: field,
    }));
  };

  // Function to handle quantity change
  const handleQuantityChange = (value) => {
    setQuantity(value);
  };
// Function to handle discount checkbox change
const handleDiscountChange = (event) => {
  if (!event.target.checked) {
    // If the checkbox is unchecked, reset discount value and set hasDiscount to false
    setDiscountValue(0);
    setHasDiscount(false);
  } else {
    // If the checkbox is checked, set hasDiscount to true
    setHasDiscount(true);
  }
};

  // Function to calculate total price
  const calculateTotalPrice = () => {
    let totalPrice = expense.price * quantity;
    if (hasDiscount) {
      // Apply discount if the product has a discount
      // Adjust the totalPrice based on the discount value
      totalPrice -= discountValue;
    }
    return parseFloat(totalPrice.toFixed(2)); // Round to two decimal places
  };
  // Function to handle form submission
  const handleSubmit = async (event) => {
    event.preventDefault();
    // Logic to save expense data to the database
  };

  const content = () => {
    return (
      <>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel></InputLabel>
                <TextField
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
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel></InputLabel>
                <TextField
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
                  options={filterOptions(shopOptions, "name", expense.shopName)}
                  onSelect={(shop) => {
                    handleFieldChange("shopName", shop.name);
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
                      checked={hasDiscount}
                      onChange={handleDiscountChange}
                    />
                  }
                  label="Rabatt"
                />
              </Grid>
              <Grid item xs={6}>
                {hasDiscount && (
                  <FormControl fullWidth>
                    <InputLabel></InputLabel>
                    <TextField
                      label="Rabattverdi"
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
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
                    value={quantity}
                    // Handle quantity separately
                    onChange={(e) => handleQuantityChange(e.target.value)}
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

export default Expenses;
