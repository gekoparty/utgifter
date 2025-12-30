import React, { useState, lazy, Suspense } from "react";
import { Box, Button, IconButton, Snackbar, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// ------------------------------------------------------
// Lazy-loaded consolidated dialog (ADD / EDIT / DELETE)
// ------------------------------------------------------
const loadCategoryDialog = () =>
  import("../components/features/Categories/CategoryDialogs/CategoryDialog");
const CategoryDialog = lazy(loadCategoryDialog);

// ------------------------------------------------------
// Constants
// ------------------------------------------------------
const CATEGORIES_QUERY_KEY = ["categories", "paginated"];
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_CATEGORY = { _id: "", name: "" };

// URL builder
const categoryUrlBuilder = (endpoint, params) => {
  const url = new URL(endpoint, API_URL);
  url.searchParams.set("start", `${params.pageIndex * params.pageSize}`);
  url.searchParams.set("size", `${params.pageSize}`);
  url.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  url.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  url.searchParams.set("globalFilter", params.globalFilter ?? "");
  return url;
};

const tableColumns = [
    {
      accessorKey: "name",
      header: "Kategori",
      size: 150,
      grow: 2,
      minSize: 150,
      maxSize: 400,
    },
  ];

const CategoryScreen = () => {
  // ------------------------------------------------------
  // Table state
  // ------------------------------------------------------
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  // ------------------------------------------------------
  // Dialog state
  // ------------------------------------------------------
  const [activeModal, setActiveModal] = useState(null); // ADD | EDIT | DELETE | null
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_SELECTED_CATEGORY);

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

  const { data: categoriesData, isError, isFetching, isLoading, refetch } =
    usePaginatedData({
      endpoint: "/api/categories",
      params: fetchParams,
      urlBuilder: categoryUrlBuilder,
      baseQueryKey: CATEGORIES_QUERY_KEY,
    });

  const tableData = categoriesData?.categories ?? [];
  const metaData = categoriesData?.meta ?? {};

  // ------------------------------------------------------
  // Handlers
  // ------------------------------------------------------
  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedCategory(INITIAL_SELECTED_CATEGORY);
  };

  const handleEdit = (category) => {
    loadCategoryDialog(); // preload on intent
    setSelectedCategory(category);
    setActiveModal("EDIT");
  };

  const handleDelete = (category) => {
    loadCategoryDialog(); // preload on intent
    setSelectedCategory(category);
    setActiveModal("DELETE");
  };

  const handleSuccess = (action, categoryName) => {
    showSnackbar(`Kategori "${categoryName}" ble ${action}`);
    handleCloseDialog();
    // ✅ no refetch here if hook invalidates CATEGORIES_QUERY_KEY
    // keep refetch only for manual refresh button
  };

  const handleError = (action) => {
    showSnackbar(`Kunne ikke ${action}`, "error");
  };

  // ------------------------------------------------------
  // Columns (optionally move outside component like Brand/Location)
  // ------------------------------------------------------
  

  return (
    <TableLayout>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onMouseEnter={loadCategoryDialog}
          onFocus={loadCategoryDialog}
          onClick={() => setActiveModal("ADD")}
        >
          Ny Kategori
        </Button>
      </Box>

      {/* Table */}
      <Box sx={{ flexGrow: 1, width: "100%", minWidth: 600 }}>
        <ReactTable
          data={tableData}
          columns={tableColumns}
          meta={metaData}
          refetch={refetch}
          isError={isError}
          isFetching={!activeModal && isFetching} // optional: avoid progress bars behind modal
          isLoading={isLoading}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          pagination={pagination}
          sorting={sorting}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      </Box>

      {/* Dialog (single consolidated) */}
      <Suspense fallback={null}>
        {activeModal && (
          <CategoryDialog
            open
            mode={activeModal}
            categoryToEdit={selectedCategory}
            onClose={handleCloseDialog}
            onSuccess={(cat) => {
              const action =
                activeModal === "DELETE"
                  ? "slettet"
                  : activeModal === "EDIT"
                  ? "oppdatert"
                  : "lagt til";

              handleSuccess(action, cat.name);
            }}
            onError={() => handleError("utføre handling")}
          />
        )}
      </Suspense>

      {/* Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        sx={{ maxWidth: 400 }}
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
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default CategoryScreen;
