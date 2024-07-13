import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Grid,
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
  hasDiscount: false,
  purchased: false,
  registeredDate: null,
  purchaseDate: null,
  type: "",
};

const AddExpenseDialog = ({ open, onClose, onAdd }) => {
  const {
    expense = defaultExpense,
    handleFieldChange,
    handleSaveExpense,
    isFormValid,
    setExpense,
  } = useExpenseForm();

  const fetchProducts = async () => {
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error(`Failed to fetch products`);
    }
    return response.json();
  };

  // Use useQuery hooks to fetch data
  const { data: products = [], isLoading: isLoadingProducts } = useQuery(['products'], fetchProducts, { enabled: open });

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

  const handleFieldChangeInternal = (field, value) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      [field]: value,
    }));
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

  return (
    <BasicDialog open={open} onClose={onClose} dialogTitle="Add New Expense">
      <Box sx={{ p: 2, position: 'relative' }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Product Name"
              value={expense.productName}
              onClick={(e) => handleOpenPopover("product", e)}
            />
            <SelectPopover
              open={Boolean(anchorState.productAnchorEl)}
              anchorEl={anchorState.productAnchorEl}
              onClose={() => handleClosePopover("product")}
              onSelect={(value) => handleFieldChangeInternal("productName", value.name)} // Change here to pass name instead of the whole object
              options={products.map(product => ({
                name: product.name,
              }))}
              title="Select Product"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Brand"
              value={expense.brandName}
              onClick={(e) => handleOpenPopover("brand", e)}
            />
            <SelectPopover
              open={Boolean(anchorState.brandAnchorEl)}
              anchorEl={anchorState.brandAnchorEl}
              onClose={() => handleClosePopover("brand")}
              onSelect={(value) => handleFieldChangeInternal("brandName", value)} // Assuming options are strings like "Brand1", "Brand2", etc.
              options={["Brand1", "Brand2", "Brand3"]} // Replace with actual options
              title="Select Brand"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Shop"
              value={expense.shopName}
              onClick={(e) => handleOpenPopover("shop", e)}
            />
            <SelectPopover
              open={Boolean(anchorState.shopAnchorEl)}
              anchorEl={anchorState.shopAnchorEl}
              onClose={() => handleClosePopover("shop")}
              onSelect={(value) => handleFieldChangeInternal("shopName", value)} // Assuming options are strings like "Shop1", "Shop2", etc.
              options={["Shop1", "Shop2", "Shop3"]} // Replace with actual options
              title="Select Shop"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Location"
              value={expense.locationName}
              onChange={(e) => handleFieldChangeInternal("locationName", e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={expense.price}
              onChange={(e) => handleFieldChangeInternal("price", parseFloat(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Volume"
              type="number"
              value={expense.volume}
              onChange={(e) => handleFieldChangeInternal("volume", parseFloat(e.target.value))}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Type"
              value={expense.type}
              onChange={(e) => handleFieldChangeInternal("type", e.target.value)}
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
        <Button onClick={onClose} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleSaveExpense(onAdd)}
          disabled={!isFormValid}
        >
          Save
        </Button>
      </Box>
    </BasicDialog>
  );
};

export default AddExpenseDialog;