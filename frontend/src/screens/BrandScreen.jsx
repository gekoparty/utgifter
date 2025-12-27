import React, { useState, lazy, Suspense } from "react";
import { Box, Button, IconButton, Snackbar, Alert, LinearProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// Lazy Load Dialogs
const AddBrandDialog = lazy(() => import("../components/features/Brands/BrandDialogs/AddBrand/AddBrandDialog"));
const DeleteBrandDialog = lazy(() => import("../components/features/Brands/BrandDialogs/DeleteBrand/DeleteBrandDialog"));
const EditBrandDialog = lazy(() => import("../components/features/Brands/BrandDialogs/EditBrand/EditBrandDialog"));

// Constants
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_BRAND = { _id: "", name: "" };

const brandUrlBuilder = (endpoint, params) => {
  const url = new URL(endpoint, API_URL);
  url.searchParams.set("start", params.pageIndex * params.pageSize);
  url.searchParams.set("size", params.pageSize);
  url.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  url.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  url.searchParams.set("globalFilter", params.globalFilter ?? "");
  return url;
};

const BrandScreen = () => {
  // --- State Management ---
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  
  // Consolidated Dialog State (Cleaner than multiple booleans)
  const [activeModal, setActiveModal] = useState(null); // 'ADD', 'EDIT', 'DELETE', or null
  const [selectedBrand, setSelectedBrand] = useState(INITIAL_SELECTED_BRAND);

  // Snackbar Hook
  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, handleSnackbarClose } = useSnackBar();

  // --- Data Fetching ---
  // Note: With React 19 Compiler, we don't need useDeepCompareMemo here. 
  // Pass the object directly; the compiler handles equality checks.
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter,
  };

  const { data: brandsData, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint: "/api/brands",
    params: fetchParams,
    urlBuilder: brandUrlBuilder,
    baseQueryKey: ["brands", "paginated"], // Array literal is fine in R19
  });

  const tableData = brandsData?.brands || [];
  const metaData = brandsData?.meta || {};

  // --- Handlers ---
  // No useCallback needed with React Compiler
  
  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedBrand(INITIAL_SELECTED_BRAND);
  };

  const handleEdit = (brand) => {
    setSelectedBrand(brand);
    setActiveModal("EDIT");
  };

  const handleDelete = (brand) => {
    setSelectedBrand(brand);
    setActiveModal("DELETE");
  };

  // Action Feedback Wrappers
  const handleSuccess = (action, brandName) => {
    showSnackbar(`Merke "${brandName}" ble ${action}`);
    if (action === "slettet") handleCloseDialog(); // Auto close on success for delete
  };

  const handleError = (action) => {
    showSnackbar(`Kunne ikke ${action}`, "error");
  };

  // --- Table Configuration ---
  const tableColumns = [
    {
      accessorKey: "name",
      header: "Merkenavn",
    },
  ];

  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button variant="contained" onClick={() => setActiveModal("ADD")}>
          Nytt Merke
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: "auto" }} />
          Laster merker...
        </Box>
      ) : (
        <ReactTable
          refetch={refetch}
          data={tableData}
          columns={tableColumns}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          isError={isError}
          isFetching={isFetching}
          isLoading={isLoading}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          pagination={pagination}
          sorting={sorting}
          meta={metaData}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}

      {/* --- Lazy Loaded Dialogs --- */}
      {/* Grouping Suspense is more efficient in React 19 */}
      <Suspense fallback={null}>
        {activeModal === "ADD" && (
          <AddBrandDialog
            open={true}
            onClose={handleCloseDialog}
            onAdd={(brand) => handleSuccess("lagt til", brand.name)}
          />
        )}

        {activeModal === "DELETE" && (
          <DeleteBrandDialog
            open={true}
            onClose={handleCloseDialog}
            selectedBrand={selectedBrand}
            dialogTitle="Bekreft Sletting"
            onDeleteSuccess={(brand) => handleSuccess("slettet", brand.name)}
            onDeleteFailure={() => handleError("slette merke")}
          />
        )}

        {activeModal === "EDIT" && (
          <EditBrandDialog
            open={true}
            onClose={handleCloseDialog}
            selectedBrand={selectedBrand}
            onUpdateSuccess={(brand) => handleSuccess("oppdatert", brand.name)}
            onUpdateFailure={() => handleError("oppdatere merke")}
          />
        )}
      </Suspense>

      {/* --- Feedback --- */}
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
            <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
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

export default BrandScreen;