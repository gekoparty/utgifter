import React, { useState, lazy, Suspense } from "react";
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
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// Lazy-loaded Dialogs
const AddProductDialog = lazy(() =>
  import("../components/features/Products/ProductDialogs/AddProduct/AddProductDialog")
);
const DeleteProductDialog = lazy(() =>
  import("../components/features/Products/ProductDialogs/DeleteProduct/DeleteProductDialog")
);
const EditProductDialog = lazy(() =>
  import("../components/features/Products/ProductDialogs/EditProduct/EditProductDialog")
);

// Constants
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };

// Custom URL builder
const productUrlBuilder = (endpoint, params) => {
  const fetchURL = new URL(endpoint, API_URL);
  fetchURL.searchParams.set("start", `${params.pageIndex * params.pageSize}`);
  fetchURL.searchParams.set("size", `${params.pageSize}`);
  fetchURL.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  fetchURL.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  fetchURL.searchParams.set("globalFilter", params.globalFilter ?? "");
  return fetchURL;
};

const ProductScreen = () => {
  // --- Table State ---
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  
  // --- Dialog State Consolidation ---
  const [selectedProduct, setSelectedProduct] = useState(INITIAL_SELECTED_PRODUCT);
  const [activeModal, setActiveModal] = useState(null); // 'ADD', 'EDIT', 'DELETE', or null

  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, handleSnackbarClose } = useSnackBar();

  // --- Data Fetching ---
  // No useDeepCompareMemo needed in R19
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter,
  };

  const { data: productsData, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint: "/api/products",
    params: fetchParams,
    urlBuilder: productUrlBuilder,
    baseQueryKey: ["products", "paginated"],
  });

  const tableData = productsData?.products || [];
  const metaData = productsData?.meta || {};

  // --- Handlers (No useCallback needed in R19) ---

  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedProduct(INITIAL_SELECTED_PRODUCT);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setActiveModal("EDIT");
  };

  const handleDelete = (product) => {
    setSelectedProduct(product);
    setActiveModal("DELETE");
  };
  
  // Centralized Action Feedback
  const handleSuccess = (action, productName) => {
    showSnackbar(`Produkt "${productName}" ${action}`);
    if (action === "slettet") handleCloseDialog();
  };

  const handleError = (message) => {
    showSnackbar(message, "error");
  };


  // --- Table Configuration (No useMemo needed in R19) ---
  const tableColumns = [
    { accessorKey: "name", header: "Produkter" },
    { accessorKey: "brand", header: "Merker" },
    { accessorKey: "type", header: "Type" },
    {
      accessorKey: "measures",
      header: "Mål",
      cell: ({ cell }) => {
        const measures = cell.getValue();
        return Array.isArray(measures) ? measures.join(" ") : measures || "N/A";
      },
    },
  ];

  // -------------------------
  // Render
  // -------------------------
  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setActiveModal("ADD")}
        >
          Nytt Produkt
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <LinearProgress sx={{ my: 1, maxWidth: 300, mx: "auto" }} />
          Laster Produkter...
        </Box>
      ) : (
        <ReactTable
          data={tableData}
          columns={tableColumns}
          refetch={refetch}
          meta={metaData}
          
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          sorting={sorting}
          pagination={pagination}
          
          isError={isError}
          isFetching={isFetching}
          
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}

      {/* Dialogs - Grouped Suspense */}
      <Suspense fallback={null}> 
        {activeModal === "ADD" && (
          <AddProductDialog
            open={true}
            onClose={handleCloseDialog}
            onAdd={(newProduct) => handleSuccess("er lagt til", newProduct.name)}
          />
        )}

        {activeModal === "DELETE" && (
          <DeleteProductDialog
            open={true}
            dialogTitle="Bekreft Sletting"
            onClose={handleCloseDialog}
            selectedProduct={selectedProduct}
            onDeleteSuccess={(deletedProduct) => handleSuccess("slettet", deletedProduct.name)}
            onDeleteFailure={() => handleError(`Kunne ikke slette produktet ${selectedProduct.name}`)}
          />
        )}

        {activeModal === "EDIT" && (
          <EditProductDialog
            open={true}
            onClose={handleCloseDialog}
            selectedProduct={selectedProduct}
            onUpdateSuccess={(updatedProduct) => handleSuccess("oppdatert", updatedProduct.name)}
            onUpdateFailure={() => handleError("Kunne ikke oppdatere produktet")}
          />
        )}
      </Suspense>

      {/* Snackbar */}
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