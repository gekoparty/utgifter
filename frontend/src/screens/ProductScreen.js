import React, { useState, useMemo, lazy, Suspense } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Skeleton,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useDeepCompareMemo } from "use-deep-compare";
import { useQueryClient } from "@tanstack/react-query";
import { usePaginatedData } from "../hooks/usePaginatedData";

// Lazy-loaded Dialogs
const AddProductDialog = lazy(() =>
  import(
    "../components/features/Products/ProductDialogs/AddProduct/AddProductDialog"
  )
);
const DeleteProductDialog = lazy(() =>
  import(
    "../components/features/Products/ProductDialogs/DeleteProduct/DeleteProductDialog"
  )
);
const EditProductDialog = lazy(() =>
  import(
    "../components/features/Products/ProductDialogs/EditProduct/EditProductDialog"
  )
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
const productUrlBuilder = (
  endpoint,
  { pageIndex, pageSize, sorting, filters, globalFilter }
) => {
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
  const [selectedProduct, setSelectedProduct] = useState(
    INITIAL_SELECTED_PRODUCT
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const queryClient = useQueryClient();
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar, // ✅ Use only this now
    handleSnackbarClose,
  } = useSnackBar();

  // Proper query key structure for v4
  const baseQueryKey = useMemo(() => ["products", "paginated"], []);

  // Build parameters for the hook
  const fetchParams = useDeepCompareMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter,
    }),
    [pagination, sorting, columnFilters, globalFilter] // Deep comparison
  );

  const {
    data: productsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/products",
    params: fetchParams,
    urlBuilder: productUrlBuilder,
    baseQueryKey, // Pass the stable base query key
  });

  // SAFETY: Ensure data is always an array
  const tableData = useMemo(() => productsData?.products || [], [productsData]);
  const metaData = useMemo(() => productsData?.meta || {}, [productsData]);
  const memoizedSorting = useMemo(() => sorting, [sorting]);

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
          return Array.isArray(measures)
            ? measures.join(" ")
            : measures || "N/A";
        },
      },
    ],
    []
  );

  // Handlers for product actions
  const addProductHandler = (newProduct) => {
    showSnackbar(`Produkt ${newProduct.name} er lagt til`);
    queryClient.invalidateQueries({
      queryKey: baseQueryKey,
      refetchType: "active",
    });
  };

  const deleteSuccessHandler = (deletedProduct) => {
    showSnackbar(`Produkt ${deletedProduct.name} slettet`);
    queryClient.invalidateQueries({
      queryKey: baseQueryKey,
      refetchType: "active",
    });
  };

  const editSuccessHandler = (updatedProduct) => {
    showSnackbar(`Produkt ${updatedProduct.name} oppdatert`);
    queryClient.invalidateQueries({
      queryKey: baseQueryKey,
      refetchType: "active",
    });
  };

  // Cleanup when dialogs close: reset selected product and remove cache entries
  const handleDialogClose = (setDialogOpen) => {
    setDialogOpen(false);
    setSelectedProduct(INITIAL_SELECTED_PRODUCT);
  };

  // Use useCallback to ensure stable functions
  const handleEdit = (product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  };

  const handleDelete = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
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
          {isLoading ? (
            <Paper
              elevation={3}
              sx={{
                p: 4,
                backgroundColor: "white",
                textAlign: "center",
              }}
            >
              <Skeleton variant="rectangular" width="100%" height={200} />
              <Box sx={{ mt: 2 }}>Laster Produkter...</Box>
            </Paper>
          ) : (
            <ReactTable
              getRowId={(row) => row._id}
              data={tableData} // Always pass the table, even if empty
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
              sorting={memoizedSorting}
              meta={metaData}
              setSelectedProduct={setSelectedProduct}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              sx={{ flexGrow: 1, width: "100%" }}
              noDataMessage="Ingen produkter funnet"
            />
          )}
        </Box>
      </Box>

      {/* Modals */}
      <Suspense fallback={<div>Laster...</div>}>
        <DeleteProductDialog
          open={deleteModalOpen}
          dialogTitle="Bekreft Sletting"
          onClose={() =>
            handleDialogClose((setDeleteProductDialogOpen) =>
              setDeleteModalOpen(false)
            )
          }
          selectedProduct={selectedProduct}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={() =>
            showSnackbar(`Kunne ikke slette produktet ${selectedProduct.name}`)
          }
        />
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {selectedProduct._id && editModalOpen && (
          <EditProductDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedProduct={selectedProduct}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={() =>
              showSnackbar("Kunne ikke oppdatere produktet")
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

      {/* Updated Snackbar with MUI v6 Alert */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        sx={{
          width: "auto", // <-- Change this from 100% to auto
          maxWidth: 400, // <-- Optional: Limit the maximum width
        }}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          variant="filled" // Add variant for better visual consistency
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            width: "100%",
            "& .MuiAlert-message": { flexGrow: 1 }, // Ensure proper message alignment
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default ProductScreen;
