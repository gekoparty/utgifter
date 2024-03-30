import { useState, useMemo, useRef } from "react";
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
  List,
  FormControlLabel,
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
import SelectPopover from "../components/commons/SelectPopover/SelectPopover";

const Expenses = ({ drawerWidth = 240 }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const [expense, setExpense] = useState({
    productName: "",
    productType: "",
    brand: "",
    price: "",
    quantity: "",
    shopName: "",
    isPurchased: true,
    selectedDate: null,
  });

  const [newProduct, setNewProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopPopoverOpen, setShopPopoverOpen] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [popoverAnchorEl, setPopoverAnchorEl] = useState(null);
  const [shopAnchorEl, setShopAnchorEl] = useState(null);
  const [productAnchorEl, setProductAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const anchorRef = useRef(null);

  const {
    data: productOptions, // Updated destructuring assignment here
    isLoading: productLoading,
    isError: productError,
  } = useQuery(["products"], fetchProducts);

  const {
    data: shopOptions,
    isLoading: shopLoading,
    isError: shopError,
  } = useQuery(["shops"], fetchShops); // Fetch shop options

  console.log("Product Options:", productOptions);
  console.log("Shop Options:", shopOptions);

  const filteredProductOptions = useMemo(() => {
    if (!expense.productName || !productOptions) return productOptions;
    return productOptions.filter((product) =>
      product.name.toLowerCase().startsWith(expense.productName.toLowerCase())
    );
  }, [expense.productName, productOptions]);

  const filteredShopOptions = useMemo(() => {
    if (!expense.shopName || !shopOptions) return shopOptions;
    return shopOptions.filter((shop) =>
      shop.name.toLowerCase().startsWith(expense.shopName.toLowerCase())
    );
  }, [expense.shopName, shopOptions]);

  const handleFieldFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Add logic to save the expense data to the database
  };
  const handleOpenShopPopover = (event) => {
    if (shopOptions) {
      setShopAnchorEl(event.currentTarget); // Set anchorEl for shop popover
      setProductAnchorEl(null); // Close product popover if open
      setShopPopoverOpen(true);
    }
  };

  const handleNewProductChange = (newValue) => {
    setExpense({ ...expense, productName: newValue });
    handleFieldFocus("product");
  };

  const handleNewShopChange = (newValue) => {
    setExpense({ ...expense, shopName: newValue });
    handleFieldFocus("shop");
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setExpense({ ...expense, productName: product.name });
    setPopoverAnchorEl(null);
  };
  const handleShopSelect = (shop) => {
    setSelectedShop(shop);
    setExpense({ ...expense, shopName: shop.name });
    setPopoverAnchorEl(null);
  };

  const handleOpenProductPopover = (event) => {
    if (expense.productName) {
      setProductAnchorEl(event.currentTarget); // Set anchorEl for product popover
      setShopAnchorEl(null); // Close shop popover if open
      setShopPopoverOpen(false); // Ensure shop popover is closed
    }
  };
  const handleClosePopover = () => {
    setAnchorEl(null);
  };

  const Row = ({ index, style }) => {
    // Check if filteredProductOptions[index] exists
    const product = filteredProductOptions[index];

    if (!product) {
      return null; // Return null if product is not defined
    }

    return (
      <ListItemButton
        style={style}
        key={product.id}
        onClick={() => handleProductSelect(product)}
      >
        {product.name}
      </ListItemButton>
    );
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
                  label="New Product"
                  value={expense.productName}
                  onChange={(e) => handleNewProductChange(e.target.value)}
                  autoComplete="off"
                  onKeyDown={handleOpenProductPopover}
                  onFocus={() => handleFieldFocus("product")}
                  fullWidth
                />
              </FormControl>
              {focusedField === "product" && (
                <SelectPopover
                  open={Boolean(productAnchorEl)} // Use productAnchorEl for product popover
                  anchorEl={productAnchorEl}
                  onClose={() => setProductAnchorEl(null)}
                  options={filteredProductOptions}
                  onSelect={handleProductSelect}
                  type="product"
                />
              )}
            </Grid>
            {/* Add new TextField for adding a shop */}
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel></InputLabel>
                <TextField
                  label="New Shop"
                  autoComplete="off"
                  onChange={(e) => handleNewShopChange(e.target.value)}
                  onKeyDown={handleOpenShopPopover}
                  onFocus={() => handleFieldFocus("shop")}
                  fullWidth
                  value={expense.shopName}
                />
              </FormControl>
              {focusedField === "shop" && (
                <SelectPopover
                  open={Boolean(shopAnchorEl)} // Use shopPopoverOpen for shop popover
                  anchorEl={shopAnchorEl}
                  onClose={() => setShopAnchorEl(null)}
                  options={filteredShopOptions}
                  onSelect={handleShopSelect}
                  type="shop"
                />
              )}
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
