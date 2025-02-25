import React, { useState, useMemo, lazy, Suspense } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useQueryClient } from "@tanstack/react-query";
import { usePaginatedData } from "./common/usePaginatedData";

// Lazy-loaded Dialogs
const AddProductDialog = lazy(() =>
  import("../components/Products/ProductDialogs/AddProductDialog")
);
const DeleteProductDialog = lazy(() =>
  import("../components/Products/ProductDialogs/DeleteProductDialog")
);
const EditProductDialog = lazy(() =>
  import("../components/Products/ProductDialogs/EditProductDialog")
);

// Constants for initial state and API URL
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

// Custom URL builder for products
const productUrlBuilder = (endpoint, { pageIndex, pageSize, sorting, filters, globalFilter }) => {
  const fetchURL = new URL(endpoint, API_URL);
  fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
  fetchURL.searchParams.set("size", `${pageSize}`);
  fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
  fetchURL.searchParams.set("columnFilters", JSON.stringify(filters ?? []));
  fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
  return fetchURL;
};

const ProductScreen = () => {
  // State declarations
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedProduct, setSelectedProduct] = useState(INITIAL_SELECTED_PRODUCT);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Theme, query client, and snackbar setup
  const theme = useTheme();
  const queryClient = useQueryClient();
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Memoized selected product (to prevent unnecessary renders)
  const memoizedSelectedProduct = useMemo(() => selectedProduct, [selectedProduct]);

  // Build parameters for the hook
  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter,
    }),
    [pagination.pageIndex, pagination.pageSize, sorting, columnFilters, globalFilter]
  );

  // Use the usePaginatedData hook to fetch product data
  const { data: productsData, isError, isFetching, isLoading, refetch } = usePaginatedData(
    "/api/products",
    fetchParams,
    productUrlBuilder
  );

  // Table columns configuration
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Produkter",
        size: 150,
        grow: 2,
        minSize: 150,
        maxSize: 400,
      },
      {
        accessorKey: "brand",
        header: "Merker",
        size: 150,
        grow: 1,
        minSize: 150,
        maxSize: 300,
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 150,
        grow: 1,
        minSize: 100,
        maxSize: 250,
      },
      {
        accessorKey: "measures",
        header: "Mål",
        size: 100,
        grow: 1,
        minSize: 50,
        maxSize: 300,
        cell: ({ cell }) => {
          const measures = cell.getValue();
          return Array.isArray(measures) ? measures.join(" ") : measures || "N/A";
        },
      },
    ],
    []
  );

  // Handlers for product actions
  const addProductHandler = (newProduct) => {
    showSuccessSnackbar(`Produkt ${newProduct.name} er lagt til`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  const deleteSuccessHandler = (deletedProduct) => {
    showSuccessSnackbar(`Produkt ${deletedProduct} slettet`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  const editSuccessHandler = (updatedProduct) => {
    showSuccessSnackbar(`Produkt ${updatedProduct.name} oppdatert`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  // Cleanup when dialogs close: reset selected product and remove cache entries
  const handleDialogClose = (closeDialogFn) => {
    closeDialogFn(false);
    setSelectedProduct(INITIAL_SELECTED_PRODUCT);
    queryClient.removeQueries("products");
    queryClient.removeQueries("brands");
  };

  // Render the layout, table, modals, and snackbars
  return (
    <TableLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          width: "100%",
          minHeight: "100%",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddProductDialogOpen(true)}
          >
            Nytt Produkt
          </Button>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 600,
          }}
        >
          {productsData && (
            <ReactTable
              data={productsData?.products}
              columns={tableColumns}
              setColumnFilters={setColumnFilters}
              setGlobalFilter={setGlobalFilter}
              setSorting={setSorting}
              setPagination={setPagination}
              refetch={refetch}
              isError={isError}
              isFetching={isFetching}
              isLoading={isLoading}
              columnFilters={columnFilters}
              globalFilter={globalFilter}
              pagination={pagination}
              sorting={sorting}
              meta={productsData.meta}
              setSelectedProduct={setSelectedProduct}
              handleEdit={(product) => {
                setSelectedProduct(product);
                setEditModalOpen(true);
              }}
              handleDelete={(product) => {
                setSelectedProduct(product);
                setDeleteModalOpen(true);
              }}
              sx={{ flexGrow: 1, width: "100%" }}
            />
          )}
        </Box>
      </Box>

      {/* Modals */}
      <Suspense fallback={<div>Laster...</div>}>
        <DeleteProductDialog
          open={deleteModalOpen}
          dialogTitle="Bekreft Sletting"
          onClose={() => handleDialogClose(setDeleteProductDialogOpen => setDeleteModalOpen(false))}
          selectedProduct={selectedProduct}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={() =>
            showErrorSnackbar(`Kunne ikke slette produktet ${selectedProduct.name}`)
          }
        />
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {memoizedSelectedProduct._id && editModalOpen && (
          <EditProductDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedProduct={selectedProduct}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={() =>
              showErrorSnackbar("Kunne ikke oppdatere produktet")
            }
          />
        )}
      </Suspense>

      <Suspense fallback={<div>Laster Dialog...</div>}>
        {addProductDialogOpen && (
          <AddProductDialog
            open={addProductDialogOpen}
            onClose={() => handleDialogClose(setAddProductDialogOpen)}
            onAdd={addProductHandler}
          />
        )}
      </Suspense>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <SnackbarContent
          sx={{
            backgroundColor:
              snackbarSeverity === "success"
                ? theme.palette.success.main
                : snackbarSeverity === "error"
                ? theme.palette.error.main
                : theme.palette.info.main,
            color: theme.palette.getContrastText(
              snackbarSeverity === "success"
                ? theme.palette.success.main
                : snackbarSeverity === "error"
                ? theme.palette.error.main
                : theme.palette.info.main
            ),
          }}
          message={snackbarMessage}
          action={
            <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>
    </TableLayout>
  );
};

export default ProductScreen;
