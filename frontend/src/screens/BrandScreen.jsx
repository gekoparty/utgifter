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

// ------------------------------------------------------
// Lazy-loaded consolidated dialog (ADD / EDIT / DELETE)
// ------------------------------------------------------
const loadBrandDialog = () =>
  import("../components/features/Brands/BrandDialogs/BrandDialog");
const BrandDialog = lazy(loadBrandDialog);

// ------------------------------------------------------
// Constants
// ------------------------------------------------------
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_BRAND = { _id: "", name: "" };
const BRANDS_QUERY_KEY = ["brands", "paginated"];
const tableColumns = [
  {
    accessorKey: "name",
    header: "Merkenavn",
  },
];

// ------------------------------------------------------
// URL builder
// ------------------------------------------------------
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
  // ------------------------------------------------------
  // Table State
  // ------------------------------------------------------
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  // ------------------------------------------------------
  // Dialog State
  // ------------------------------------------------------
  const [activeModal, setActiveModal] = useState(null); // ADD | EDIT | DELETE | null
  const [selectedBrand, setSelectedBrand] = useState(INITIAL_SELECTED_BRAND);

  // ------------------------------------------------------
  // Snackbar
  // ------------------------------------------------------
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // ------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter,
  };

  const {
    data: brandsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/brands",
    params: fetchParams,
    urlBuilder: brandUrlBuilder,
    baseQueryKey: BRANDS_QUERY_KEY,
  });

  const tableData = brandsData?.brands ?? [];
  const metaData = brandsData?.meta ?? {};

  // ------------------------------------------------------
  // Dialog handlers
  // ------------------------------------------------------
  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedBrand(INITIAL_SELECTED_BRAND);
  };

  const handleEdit = (brand) => {
    loadBrandDialog();
    setSelectedBrand(brand);
    setActiveModal("EDIT");
  };

  const handleDelete = (brand) => {
    loadBrandDialog();
    setSelectedBrand(brand);
    setActiveModal("DELETE");
  };

  // ------------------------------------------------------
  // Feedback helpers
  // ------------------------------------------------------
  const handleSuccess = (action, brandName) => {
    showSnackbar(`Merke "${brandName}" ble ${action}`);
    handleCloseDialog();
  };

  const handleError = (action) => {
    showSnackbar(`Kunne ikke ${action}`, "error");
  };

  

  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          onMouseEnter={loadBrandDialog}
          onFocus={loadBrandDialog}
          variant="contained"
          onClick={() => setActiveModal("ADD")}
        >
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
          data={tableData}
          columns={tableColumns}
          meta={metaData}
          isError={isError}
          isFetching={isFetching}
          isLoading={isLoading}
          refetch={refetch}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          sorting={sorting}
          pagination={pagination}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}

      <Suspense fallback={null}>
        {activeModal && (
          <BrandDialog
            open
            mode={activeModal}
            brandToEdit={selectedBrand}
            onClose={handleCloseDialog}
            onSuccess={(brand) => {
              const action =
                activeModal === "DELETE"
                  ? "slettet"
                  : activeModal === "EDIT"
                  ? "oppdatert"
                  : "lagt til";

              handleSuccess(action, brand.name);
            }}
            onError={() => handleError("utføre handling")}
          />
        )}
      </Suspense>

      {/* ------------------------------------------------ */}
      {/* Snackbar */}
      {/* ------------------------------------------------ */}
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

export default BrandScreen;
