import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import useCustomHttp from "../hooks/useHttp";
import useSnackBar from "../hooks/useSnackBar";
import { StoreContext } from "../Store/Store";
import AddProductDialog from "../components/Products/ProductDialogs/AddProductDialog";
import DeleteProductDialog from "../components/Products/ProductDialogs/DeleteProductDialog";
import EditProductDialog from "../components/Products/ProductDialogs/EditProductDialog";

const tableHeaders = ["Name", "Brand", "Delete", "Edit"];

const ProductScreen = () => {
  const { loading: productLoading, data: productsData } =
    useCustomHttp("/api/products");
  const { loading: brandLoading, data: brandsData } =
    useCustomHttp("/api/brands");

  const { state, dispatch } = useContext(StoreContext);
  const { products } = state;

  const [selectedProduct, setSelectedProduct] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [productsWithBrandName, setProductsWithBrandName] = useState([]);
  // New state variable

  const memoizedTableHeaders = useMemo(() => tableHeaders, []);

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  useEffect(() => {
    if (productsData) {
      dispatch({
        type: "FETCH_SUCCESS",
        resource: "products",
        payload: productsData,
      });
    }
  }, [productsData, dispatch]);

  useEffect(() => {
    // Fetch locations and dispatch the action when locationsData is available
    console.log("brandsdata from Productscreen", brandsData);
    if (brandsData) {
      dispatch({
        type: "FETCH_SUCCESS",
        resource: "brands",
        payload: brandsData,
      });
    }
  }, [brandsData, dispatch]);

  const renderBrandForProducts = (item) => {
    return <>{item.brands}</>;
  };

  const columnRenderers = {
    Brand: renderBrandForProducts, // Use your existing renderBrandForProducts function
  };

  useEffect(() => {
    if (products) {
      const updatedProductsWithBrands = products.map((product) => ({
        ...product,
        brands: product.brands.map((brand) => brand.name).join(", "), // Concatenate brand names
      }));
      setProductsWithBrandName(updatedProductsWithBrands);
    }
  }, [products]);

  const addProductHandler = (newProduct) => {
    showSuccessSnackbar(`Butikk ${newProduct.name} er lagt til`);
  };

  const deleteFailureHandler = (failedProduct) => {
    showErrorSnackbar(`Failed to delete product ${failedProduct.name}`);
  };

  const deleteSuccessHandler = (deletedProduct) => {
    showSuccessSnackbar(`Product ${deletedProduct} deleted successfully`);
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update product");
  };

  const editSuccessHandler = (selectedProdct) => {
    showSuccessSnackbar(`Product ${selectedProduct.name} updated succesfully`);
  };

  if (productLoading || products === null) {
    return <div>Loading....</div>;
  }

  return (
    <TableLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddProductDialogOpen(true)}
        >
          Nytt Produkt
        </Button>
      </Box>

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}></Box>
      </Box>
      <CustomTable
        data={productsWithBrandName}
        headers={memoizedTableHeaders}
        onDelete={(product) => {
          setSelectedProduct(product);
          setDeleteModalOpen(true);
        }}
        onEdit={(product) => {
          setSelectedProduct(product);
          setEditModalOpen(true);
        }}
        columnRenderers={columnRenderers}
      />

      <DeleteProductDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        dialogTitle="Confirm Deletion"
        cancelButton={
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
        }
        selectedProduct={selectedProduct}
        onDeleteSuccess={deleteSuccessHandler}
        onDeleteFailure={deleteFailureHandler}
      />

      <EditProductDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cancelButton={
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        }
        dialogTitle={"Edit Product"}
        selectedProduct={selectedProduct}
        onUpdateSuccess={editSuccessHandler}
        onUpdateFailure={editFailureHandler}
        brands={brandsData}
      />

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <SnackbarContent
          sx={{
            backgroundColor: snackbarSeverity === "success" ? "green" : "red",
          }}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>
      <AddProductDialog
        onClose={() => setAddProductDialogOpen(false)}
        brands={brandsData}
        open={addProductDialogOpen}
        onAdd={addProductHandler}
      ></AddProductDialog>
    </TableLayout>
  );
};

export default ProductScreen;
