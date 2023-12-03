import { useState, useCallback } from "react";
import {
  Box,
  Button,
  Grid,
  Snackbar,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Popover,
  List,
  ListItemButton,
} from "@mui/material";
import {
  fetchBrands,
  fetchLocations,
  fetchCategories,
  fetchShops,
  fetchProducts,
} from "../components/commons/Utils/apiUtils";
import { DatePicker } from "@mui/x-date-pickers";
import CreatableSelect from "react-select/creatable";
import { useQuery } from "@tanstack/react-query";
import BasicDialog from "../components/commons/BasicDialog/BasicDialog";
import { FixedSizeList } from "react-window";

const Expenses = ({ drawerWidth = 240 }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);

  const [expense, setExpense] = useState({
    productName: "",
    productType: "",
    brand: "",
    price: "",
    quantity: "",
    shop: "",
    isPurchased: true,
    selectedDate: null,
  });

  const [existingTypes, setExistingTypes] = useState([]); // Add existingTypes state

  const handlePriceChange = (event) => {
    // Assuming event.target.value is a valid number or an empty string
    const formattedPrice =
      event.target.value !== "" ? parseFloat(event.target.value) : "";

    // Update the expense state, including the formatted price
    setExpense((prevExpense) => ({
      ...prevExpense,
      price: formattedPrice,
    }));
  };

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  // Other necessary functions and event handlers

  const {
    data: brandOptions,
    isLoading: brandLoading,
    isError: brandError,
  } = useQuery(["brands"], fetchBrands);

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
    data: categoryOptions,
    isLoading: categoryLoading,
    isError: categoryError,
  } = useQuery(["categories"], fetchCategories);

  const handleInputChange = (field, value) => {
    setExpense((prevExpense) => ({
      ...prevExpense,
      [field]: value,
    }));
  };

  const handleProductChange = useCallback(
    (productName) => {
      console.log("Product clicked:", productName);

      // Add the selected product type to the existing types
      if (!existingTypes.includes(productName)) {
        setExistingTypes((prevTypes) => [...prevTypes, productName]);
      }

      // Update the TextField value
      setExpense((prevExpense) => ({
        ...prevExpense,
        productName,
      }));

      // Close the Popover
      setAnchorEl(null);
    },
    [setExpense, existingTypes]
  );
  const handleProductTypeChange = (event) => {
    const selectedType = event.target.value;

    // If the selected type is not in the existing types, update the state
    if (!existingTypes.includes(selectedType)) {
      handleInputChange("productType", selectedType);
    }
  };

  const handleNewTypeCreate = (inputValue) => {
    handleInputChange("productType", inputValue);
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

  const Row = ({ index, style }) => (
    <ListItemButton
      key={index}
      style={style}
      onClick={() => handleProductChange(productOptions[index].name)}
    >
      {productOptions[index].name}
    </ListItemButton>
  );

  const content = () => {
    return (
      <>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {productOptions ? (
                <>
                  <TextField
                    label="Product Name"
                    value={expense.productName}
                    onClick={handleOpenMenu}
                    onChange={(event) => {
                      // Handle changes if needed
                    }}
                    fullWidth
                  />
                  <Popover
                    open={Boolean(anchorEl)}
                    anchorEl={anchorEl}
                    onClose={handleCloseMenu}
                    anchorOrigin={{
                      vertical: "bottom",
                      horizontal: "left",
                    }}
                    transformOrigin={{
                      vertical: "top",
                      horizontal: "left",
                    }}
                  >
                    <List>
                      {productOptions.map((product, index) => (
                        <ListItemButton
                          key={index}
                          onClick={() => handleProductChange(product.name)}
                        >
                          {product.name}
                        </ListItemButton>
                      ))}
                    </List>
                  </Popover>
                </>
              ) : null}
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Product Type</InputLabel>
                <Select
                  value={expense.productType}
                  onChange={handleProductTypeChange}
                >
                  {existingTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <CreatableSelect
                className="custom-select"
                options={brandOptions}
                size="small"
                label="Merke"
                value={
                  expense?.brand
                    ? brandOptions?.find(
                        (brand) => brand.name === expense.brand
                      ) || null
                    : null
                }
                onChange={(selectedOption) =>
                  handleInputChange("brand", selectedOption?.name || "")
                }
                getOptionLabel={(option) => option.name}
                getOptionValue={(option) => option.name}
                placeholder="Velg Merke..."
                // ... (other CreatableSelect props)
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Price"
                value={expense.price}
                onChange={handlePriceChange}
                type="number"
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Quantity"
                value={expense.quantity}
                onChange={(event) =>
                  handleInputChange("quantity", event.target.value)
                }
                type="number"
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <CreatableSelect
                className="custom-select"
                options={shopOptions}
                size="small"
                label="Butikk"
                value={
                  expense?.shop
                    ? shopOptions?.find((shop) => shop.name === expense.shop) ||
                      null
                    : null
                }
                onChange={(selectedOption) =>
                  handleInputChange("shop", selectedOption?.name || "")
                }
                getOptionLabel={(option) => option.name}
                getOptionValue={(option) => option.name}
                placeholder="Velg Butikk..."
                // ... (other CreatableSelect props)
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={expense.isPurchased}
                    onChange={(event) =>
                      handleInputChange("isPurchased", event.target.checked)
                    }
                  />
                }
                label="Is Purchased"
              />
            </Grid>
            <Grid item xs={12}>
              <DatePicker
                label="Date"
                value={expense.selectedDate}
                onChange={(date) => handleInputChange("selectedDate", date)}
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
        onClose={handleSnackbarClose}
      >
        {/* Snackbar Content */}
      </Snackbar>
    </Box>
  );
};

export default Expenses;
