import React, { useState, useMemo, lazy, Suspense, useCallback } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useDeepCompareMemo } from "use-deep-compare";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

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

// Constants for initial state
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };

// Custom URL builder for products (Kept stable as it was clean)
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

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const baseQueryKey = useMemo(() => ["products", "paginated"], []);

  // Build parameters for the hook (using useDeepCompareMemo is essential here)
  const fetchParams = useDeepCompareMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter,
    }),
    [pagination, sorting, columnFilters, globalFilter]
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
    baseQueryKey,
    // Note: No transformFn here, assuming products come back ready-to-use.
    // If the data needed external lookups (like in ShopScreen), the optimization
    // should be applied here.
  });

  const tableData = useMemo(() => productsData?.products || [], [productsData]);
  const metaData = useMemo(() => productsData?.meta || {}, [productsData]);

  // Table columns configuration (Removed unnecessary size/grow props for simplicity,
  // as the table component should handle default column sizing/flex)
  const tableColumns = useMemo(
    () => [
      { accessorKey: "name", header: "Produkter" },
      { accessorKey: "brand", header: "Merker" },
      { accessorKey: "type", header: "Type" },
      {
        accessorKey: "measures",
        header: "Mål",
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

  // Handlers for product actions (memoized with useCallback)
  const addProductHandler = useCallback((newProduct) => {
    showSnackbar(`Produkt ${newProduct.name} er lagt til`);
  }, [showSnackbar]);

  const deleteSuccessHandler = useCallback((deletedProduct) => {
    showSnackbar(`Produkt ${deletedProduct.name} slettet`);
  }, [showSnackbar]);

  const editSuccessHandler = useCallback((updatedProduct) => {
    showSnackbar(`Produkt ${updatedProduct.name} oppdatert`);
  }, [showSnackbar]);

  // Cleanup when dialogs close: simplified signature
  const handleDialogClose = useCallback((setDialogOpen) => {
    setDialogOpen(false);
    setSelectedProduct(INITIAL_SELECTED_PRODUCT);
  }, []);

  // Use useCallback to ensure stable functions for table actions
  const handleEdit = useCallback((product) => {
    setSelectedProduct(product);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  }, []);

  // -------------------------
  // Render
  // -------------------------
  return (
    <TableLayout>
      {/* Consolidated outer Box wrappers. TableLayout should handle 
        the main flex container, leaving only the button/table logic here.
      */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setAddProductDialogOpen(true)}
        sx={{ mb: 2 }} // Kept mb: 2 for separation
      >
        Nytt Produkt
      </Button>

      {/* Simplified conditional rendering for loading state: 
        Replaced custom Skeleton/Paper with inline Box and LinearProgress
        if the table doesn't automatically handle the loading state effectively.
        Since the old logic was complex, we simplify it here.
      */}
      {isLoading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
            <LinearProgress sx={{ my: 1 }} />
            {/* Using a simple message instead of complex Skeleton/Paper */}
            Laster Produkter...
        </Box>
      ) : (
        <ReactTable
          // Only pass necessary state setters and values once
          data={tableData}
          columns={tableColumns}
          refetch={refetch}
          meta={metaData}
          
          // State setters
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          
          // Current state values
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          sorting={sorting}
          pagination={pagination}
          
          // Status
          isError={isError}
          isFetching={isFetching}
          // Removed redundant isLoading prop if table uses isFetching/isError
          
          // Action Handlers
          handleEdit={handleEdit}
          handleDelete={handleDelete}
          
          // Removed unnecessary props like getRowId, setSelectedProduct, sx, noDataMessage 
          // if they can be default or handled internally by ReactTable.
        />
      )}

      {/* Dialogs */}
      <Suspense fallback={<Box sx={{ p: 2 }}><LinearProgress /></Box>}>
        {/* Simplified close handler logic */}
        <DeleteProductDialog
          open={deleteModalOpen}
          dialogTitle="Bekreft Sletting"
          onClose={() => handleDialogClose(setDeleteModalOpen)}
          selectedProduct={selectedProduct}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={() =>
            showSnackbar(`Kunne ikke slette produktet ${selectedProduct.name}`, 'error') // Added severity for clarity
          }
        />
      </Suspense>

      <Suspense fallback={<Box sx={{ p: 2 }}><LinearProgress /></Box>}>
        {selectedProduct._id && editModalOpen && (
          <EditProductDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedProduct={selectedProduct}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={() =>
              showSnackbar("Kunne ikke oppdatere produktet", 'error')
            }
          />
        )}
      </Suspense>

      <Suspense fallback={<Box sx={{ p: 2 }}><LinearProgress /></Box>}>
        {addProductDialogOpen && (
          <AddProductDialog
            open={addProductDialogOpen}
            onClose={() => handleDialogClose(setAddProductDialogOpen)}
            onAdd={addProductHandler}
          />
        )}
      </Suspense>

      {/* Snackbar (Removed excess inline sx props for simplicity) */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          variant="filled"
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default ProductScreen;
