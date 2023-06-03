import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Grid,
  Snackbar,
  SnackbarContent,
  Paper,
  IconButton,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import axios from "axios";
import DatePicker from "@mui/lab/DatePicker";

import BasicDialog from "../components/commons/BasicDialog/BasicDialog";

const Expenses = ({ drawerWidth = 240 }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // State variables for form fields
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [shop, setShop] = useState("");
  const [isPurchased, setIsPurchased] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);

  // Other necessary functions and event handlers

  const handleProductNameChange = (event) => {
    setProductName(event.target.value);
  };

  const handleProductTypeChange = (event) => {
    setProductType(event.target.value);
  };

  const handleBrandChange = (event) => {
    setBrand(event.target.value);
  };

  const handlePriceChange = (event) => {
    setPrice(event.target.value);
  };

  const handleQuantityChange = (event) => {
    setQuantity(event.target.value);
  };

  const handleShopChange = (event) => {
    setShop(event.target.value);
  };

  const handleIsPurchasedChange = (event) => {
    setIsPurchased(event.target.checked);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Add logic to save the expense data to the database
  };

  const handleSnackbarOpen = (message, severity) => {
    setSnackbarOpen(true);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const content = () => {
    return (
      <>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Product Name"
                value={productName}
                onChange={handleProductNameChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Product Type</InputLabel>
                <Select value={productType} onChange={handleProductTypeChange}>
                  {/* Options for product types */}
                  <MenuItem value="no-fat">No Fat</MenuItem>
                  <MenuItem value="less-fat">Less Fat</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Brand"
                value={brand}
                onChange={handleBrandChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Price"
                value={price}
                onChange={handlePriceChange}
                type="number"
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Quantity"
                value={quantity}
                onChange={handleQuantityChange}
                type="number"
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Shop</InputLabel>
                <Select value={shop} onChange={handleShopChange}>
                  {/* Options for shops */}
                  <MenuItem value="shop1">Shop 1</MenuItem>
                  <MenuItem value="shop2">Shop 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={isPurchased}
                    onChange={handleIsPurchasedChange}
                  />
                }
                label="Is Purchased"
              />
            </Grid>
            <Grid item xs={12}>
              <DatePicker
                label="Date"
                value={selectedDate}
                onChange={handleDateChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary">
                Save Expense
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
          <Paper sx={{ p: 2 }}> {/* Add Paper component to contain the form */}
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
        onClose={handleSnackbarClose}
      >
        {/* Snackbar Content */}
      </Snackbar>
    </Box>
  );
};

export default Expenses;
