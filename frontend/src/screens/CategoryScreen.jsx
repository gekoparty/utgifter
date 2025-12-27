import React, { useState, lazy, Suspense } from "react";
import { Box, Button, IconButton, Snackbar, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// Lazy-loaded dialogs
const AddCategoryDialog = lazy(() => import("../components/features/Categories/CategoryDialogs/AddCategory/AddCategoryDialog"));
const DeleteCategoryDialog = lazy(() => import("../components/features/Categories/CategoryDialogs/DeleteCategory/DeleteCategoryDialog"));
const EditCategoryDialog = lazy(() => import("../components/features/Categories/CategoryDialogs/EditCategory/EditCategoryDialog"));

// Constants
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_CATEGORY = { _id: "", name: "" };

const categoryUrlBuilder = (endpoint, params) => {
  const fetchURL = new URL(endpoint, API_URL);
  fetchURL.searchParams.set("start", `${params.pageIndex * params.pageSize}`);
  fetchURL.searchParams.set("size", `${params.pageSize}`);
  fetchURL.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  fetchURL.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  fetchURL.searchParams.set("globalFilter", params.globalFilter ?? "");
  return fetchURL;
};

const CategoryScreen = () => {
  // --- State Management ---
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  
  // Consolidated Dialog State
  const [activeModal, setActiveModal] = useState(null); // 'ADD', 'EDIT', 'DELETE', or null
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_SELECTED_CATEGORY);

  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, handleSnackbarClose } = useSnackBar();

  // --- Data Fetching ---
  // React 19 Compiler handles object stability; no useMemo needed
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter,
  };

  const { data: categoriesData, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint: "/api/categories",
    params: fetchParams,
    urlBuilder: categoryUrlBuilder,
    baseQueryKey: ["categories", "paginated"],
  });

  const tableData = categoriesData?.categories || [];
  const metaData = categoriesData?.meta || {};

  // --- Handlers ---
  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedCategory(INITIAL_SELECTED_CATEGORY);
  };

  const handleEdit = (category) => {
    setSelectedCategory(category);
    setActiveModal("EDIT");
  };

  const handleDelete = (category) => {
    setSelectedCategory(category);
    setActiveModal("DELETE");
  };

  // Centralized Feedback Logic
  const handleSuccess = (action, categoryName) => {
    showSnackbar(`Kategori "${categoryName}" ${action}`);
    if (action === "slettet") handleCloseDialog();
  };

  const handleError = (action) => {
    showSnackbar(`Kunne ikke ${action}`, "error");
  };

  // Table Configuration
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

  return (
    <TableLayout>
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, width: "100%", height: "100%" }}>
        
        {/* Header / Actions */}
        <Box sx={{ mb: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => setActiveModal("ADD")}
          >
            Ny Kategori
          </Button>
        </Box>

        {/* Main Table Area */}
        <Box sx={{ flexGrow: 1, width: "100%", minWidth: 600 }}>
            <ReactTable
              data={tableData}
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
              meta={metaData}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
            />
        </Box>
      </Box>

      {/* --- Lazy Loaded Dialogs --- */}
      <Suspense fallback={null}>
        {activeModal === "ADD" && (
          <AddCategoryDialog
            open={true}
            onClose={handleCloseDialog}
            onAdd={(newCat) => handleSuccess("er lagt til", newCat.name)}
          />
        )}

        {activeModal === "DELETE" && (
          <DeleteCategoryDialog
            open={true}
            onClose={handleCloseDialog}
            dialogTitle="Bekreft sletting"
            selectedCategory={selectedCategory}
            onDeleteSuccess={(cat) => handleSuccess("slettet", cat.name)}
            onDeleteFailure={(cat) => handleError(`slette kategori "${cat.name}"`)}
          />
        )}

        {activeModal === "EDIT" && (
          <EditCategoryDialog
            open={true}
            onClose={handleCloseDialog}
            dialogTitle="Rediger Kategori"
            selectedCategory={selectedCategory}
            onUpdateSuccess={(cat) => handleSuccess("oppdatert", cat.name)}
            onUpdateFailure={() => handleError("oppdatere kategori")}
          />
        )}
      </Suspense>

      {/* --- Feedback --- */}
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