import React, { useState, useEffect, useContext, useMemo } from "react";
import { Box, Button, IconButton, Snackbar, SnackbarContent } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import EditProductDialog from "../components/Products/ProductDialogs/EditProductDialog";
import DeleteProductDialog from "../components/Products/ProductDialogs/DeleteProductDialog";
import AddProductDialog from "../components/Products/ProductDialogs/AddProductDialog";

import useCustomHttp from "../hooks/useHttp";
import useSnackBar from "../hooks/useSnackBar";
import { StoreContext } from "../Store/Store";

const tableHeaders = ["Name", "Delete", "Edit"];



const ProductScreen = () => {
  const { loading, error, data: productsData } = useCustomHttp("/api/products");
  const { state, dispatch } = useContext(StoreContext);
  const { products } = state;

  const [selectedProduct, setSelectedProduct] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

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
        resource: "locations",
        payload: productsData,
      });
    }
  }, [productsData, dispatch]);



  const addProductHandler = (newProduct) => {
    showSuccessSnackbar(`Sted "${newProduct.name}" added successfully`);
  };

  const deleteSuccessHandler = (deletedProduct) => {
    showSuccessSnackbar(`Sted "${deletedProduct.name}" deleted successfully`);
  };

  const deleteFailureHandler = (failedProduct) => {
    showErrorSnackbar(`Failed to delete sted "${failedProduct.name}"`);
  };

  const editSuccessHandler = (updatedProduct) => {
    showSuccessSnackbar(`Sted "${updatedProduct.name}" updated successfully`);
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update sted");
  };

  if (error && error.products) {
    console.log(error.products);
    return <div>Error: {error.products}</div>;
  }

  if (loading || products === null) {
    return (
      <div
        style={{
          position: "absolute",
          top: "240px",
          left: "500px",
          zIndex: 9999, // Set a high z-index to ensure it's above the sidebar
        }}
      >
        Loading...
      </div>
    );
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
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
          <CustomTable
            data={products}
            headers={memoizedTableHeaders}
            onDelete={(product) => {
              setSelectedProduct(product);
              setDeleteModalOpen(true);
            }}
            onEdit={(product) => {
              setSelectedProduct(product);
              setEditModalOpen(true);
            }}
          />
        </Box>
      </Box>

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
            <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>

      <AddProductDialog
        onClose={() => setAddProductDialogOpen(false)}
        onAdd={addProductHandler}
        open={addProductDialogOpen}
      />
    </TableLayout>
  );
};

export default ProductScreen;