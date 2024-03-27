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
  Popover,
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

  const [newProduct, setNewProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const anchorRef = useRef(null);

  const {
    data: productOptions, // Updated destructuring assignment here
    isLoading: productLoading,
    isError: productError,
  } = useQuery(["products"], fetchProducts);

  console.log("Product Options:", productOptions);

  const filteredProductOptions = useMemo(() => {
    if (!newProduct || !productOptions) return productOptions;
    return productOptions.filter((product) =>
      product.name.toLowerCase().includes(newProduct.toLowerCase())
    );
  }, [newProduct, productOptions]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    // Add logic to save the expense data to the database
  };

  const handleNewProductChange = (newValue) => {
    setNewProduct(newValue);
    // Update the anchor element ref
    if (newValue) {
      setAnchorEl(anchorRef.current); // Maintain focus on the text field
    } else {
      setAnchorEl(null); // Close the popover if the input is empty
    }
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setNewProduct(product.name); // Update the TextField value with the selected product name
    setAnchorEl(null); // Close the Popover when a product is selected
  };

  const handleOpenPopover = (event) => {
    if (newProduct) {
      // Open popover only if there is a newProduct value
      setAnchorEl(event.currentTarget);
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
              <TextField
                label="New Product"
                value={newProduct}
                onChange={(e) => handleNewProductChange(e.target.value)}
                autoComplete="off"
                onKeyUp={handleOpenPopover} // Open popover when typing
                fullWidth
              />
              <Popover
                open={Boolean(anchorEl)}
                disableAutoFocus
                disableEnforceFocus
                anchorEl={anchorEl}
                onClose={handleClosePopover}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
              >
                <List sx={{ width: 300 }}>
                  <FixedSizeList
                    height={300}
                    width={300}
                    itemCount={productOptions ? productOptions.length : 0}
                    itemSize={50}
                  >
                    {Row}
                  </FixedSizeList>
                </List>
              </Popover>
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
