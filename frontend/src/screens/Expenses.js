import React, { useState, useEffect, useMemo } from 'react';
import { Box, Grid, Paper, TextField, FormControl, InputLabel, Snackbar, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import BasicDialog from '../components/commons/BasicDialog/BasicDialog';
import SelectPopover from '../components/commons/SelectPopover/SelectPopover';
import { fetchShops, fetchProducts } from '../components/commons/Utils/apiUtils';

const Expenses = ({ drawerWidth = 240 }) => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expense, setExpense] = useState({
    productName: '',
    shopName: '',
    selectedDate: null,
  });
  const [focusedField, setFocusedField] = useState(null);
  const [productAnchorEl, setProductAnchorEl] = useState(null);
  const [shopAnchorEl, setShopAnchorEl] = useState(null);
  const [productOptions, setProductOptions] = useState([]);
  const [shopOptions, setShopOptions] = useState([]);
  const [filteredProductOptions, setFilteredProductOptions] = useState([]);
  const [filteredShopOptions, setFilteredShopOptions] = useState([]);

  const { isLoading: productLoading } = useQuery(['products'], () => fetchProducts(), {
    onSuccess: (data) => {
      setProductOptions(data);
    },
  });
  const { isLoading: shopLoading } = useQuery(['shops'], () => fetchShops(), {
    onSuccess: (data) => {
      setShopOptions(data);
    },
  });

 

useEffect(() => {
  // Update filtered options as their respective fields change
  setFilteredProductOptions(filterOptions(productOptions, expense.productName));
  setFilteredShopOptions(filterOptions(shopOptions, expense.shopName));
}, [expense.productName, expense.shopName, productOptions, shopOptions]);

const handleFieldFocus = (fieldName) => {
  setFocusedField(fieldName);
  handlePopoverOpen(fieldName);
};

const handleFieldChange = (field, value) => {
  console.log("Field changed:", field, "Value:", value);
  setExpense((prevExpense) => ({ ...prevExpense, [field]: value }));
  

  // Update filtered options based on the input value
  const filteredOptions = filterOptions(
      field === 'productName' ? productOptions : shopOptions,
      value
  );
  console.log("Filtered options:", filteredOptions);

  // Set the filtered options based on the field
  if (field === 'productName') {
      setFilteredProductOptions(filteredOptions);
      setFocusedField(field);
  } else {
      setFilteredShopOptions(filteredOptions);
      setFocusedField(field);
  }

  // Open popover when there is input in the TextField
  if (value && value.trim() !== '') {
    handlePopoverOpen(field);
  }
};

  const handlePopoverClose = (field) => {
    if (field === 'product') setProductAnchorEl(null);
    if (field === 'shop') setShopAnchorEl(null);
  };


  const handlePopoverOpen = (field, event) => {
    const anchorEl = event ? event.currentTarget : document.activeElement;
    if (field === 'product') {
        setProductAnchorEl(anchorEl);
        setShopAnchorEl(null);
    }
    if (field === 'shop') {
        setShopAnchorEl(anchorEl);
        setProductAnchorEl(null);
    }
    setFocusedField(field);
};


  const handleSubmit = async (event) => {
    event.preventDefault();
    // Add logic to save the expense data to the database
  };

  const filterOptions = (options, query) => {
    return options.filter(option => option.name.toLowerCase().startsWith(query.toLowerCase()));
  };

  const handleFieldKeyDown = (fieldName) => {
    if (!Boolean(productAnchorEl) && fieldName === 'product' && expense.productName.trim() !== '') {
      handlePopoverOpen(fieldName);
    } else if (!Boolean(shopAnchorEl) && fieldName === 'shop' && expense.shopName.trim() !== '') {
      handlePopoverOpen(fieldName);
    }
  };
  



  console.log("Expense object", expense)



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
                  onChange={(e) => handleFieldChange('productName', e.target.value)}
                  autoComplete="off"
                  onFocus={(e) => handlePopoverOpen('product', e)}
                  onKeyDown={() => handleFieldKeyDown('product')} // Add this line
                  fullWidth
                />
              </FormControl>
              {focusedField === "product" && filteredProductOptions.length > 0 && (
                <SelectPopover
                open={Boolean(productAnchorEl)}
                anchorEl={productAnchorEl}
                onClose={() => handlePopoverClose('product')}
                options={filteredProductOptions}
                onSelect={(product) => {
                  handleFieldChange('productName', product.name);
                  setProductAnchorEl(null); // Close the popover
                }}
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
                  onChange={(e) => handleFieldChange('shopName', e.target.value)}
                  onFocus={(e) => handlePopoverOpen('shop', e)}
                  
                  fullWidth
                  value={expense.shopName}
                />
              </FormControl>
              {focusedField === "shop" && (
                <SelectPopover
                open={Boolean(shopAnchorEl)}
                anchorEl={shopAnchorEl}
                onClose={() => handlePopoverClose('shop')}
                options={filteredShopOptions || []}
                onSelect={(shop) => {
                  handleFieldChange('shopName', shop.name);
                  setShopAnchorEl(null); // Close the popover
                }}
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
