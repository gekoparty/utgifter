import React, { useState, useMemo, lazy, Suspense } from "react";
import { Box, Button, IconButton, Snackbar, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// Lazy-loaded dialogs for category actions
const AddCategoryDialog = lazy(() =>
  import("../components/features/Categories/CategoryDialogs/AddCategory/AddCategoryDialog")
);
const DeleteCategoryDialog = lazy(() =>
  import("../components/features/Categories/CategoryDialogs/DeleteCategory/DeleteCategoryDialog")
);
const EditCategoryDialog = lazy(() =>
  import("../components/features/Categories/CategoryDialogs/EditCategory/EditCategoryDialog")
);

// Constants for initial states and API URL
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_CATEGORY = { _id: "", name: "" };


// Custom URL builder for categories
const categoryUrlBuilder = (
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

const CategoryScreen = () => {
  // State declarations
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedCategory, setSelectedCategory] = useState(
    INITIAL_SELECTED_CATEGORY
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Theme, query client, and snackbar setup
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const baseQueryKey = useMemo(() => ["categories", "paginated"], []);

  // Memoize selected category to prevent unnecessary renders
  const memoizedSelectedCategory = useMemo(
    () => selectedCategory,
    [selectedCategory]
  );

  // Build fetch parameters for the usePaginatedData hook
  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter,
    ]
  );

  // Use the usePaginatedData hook to fetch category data
  const {
    data: categoriesData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/categories",
    params: fetchParams,
    urlBuilder: categoryUrlBuilder,
    baseQueryKey, // Pass the stable base query key
  });

  const tableData = useMemo(
    () => categoriesData?.categories || [],
    [categoriesData]
  );
  const metaData = useMemo(() => categoriesData?.meta || {}, [categoriesData]);

  // Table columns configuration
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Kategori",
        size: 150,
        grow: 2,
        minSize: 150,
        maxSize: 400,
      },
    ],
    []
  );

  // Handlers for category actions
  const addCategoryHandler = (newCategory) => {
    showSnackbar(`Kategori "${newCategory.name}" er lagt til`);
    // No need to invalidate queries here; the mutation in useCategoryDialog does that.
  };

  const deleteSuccessHandler = (deletedCategory) => {
    showSnackbar(`Kategori "${deletedCategory.name}" slettet`);
  };

  const deleteFailureHandler = (failedCategory) => {
    showSnackbar(`Kunne ikke slette kategori "${failedCategory.name}"`);
  };

  const editSuccessHandler = (updatedCategory) => {
    showSnackbar(`Kategori "${updatedCategory.name}" oppdatert`);
  };

  const editFailureHandler = () => {
    showSnackbar("Kunne ikke oppdatere kategori");
  };

  // Cleanup when dialogs close: reset selected category
  const handleDialogClose = (closeDialogFn) => {
    closeDialogFn(false);
    setSelectedCategory(INITIAL_SELECTED_CATEGORY);
  };

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
            onClick={() => setAddCategoryDialogOpen(true)}
          >
            Ny Kategori
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
          {tableData && (
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
              setSelectedRow={setSelectedCategory}
              handleEdit={(category) => {
                setSelectedCategory(category);
                setEditModalOpen(true);
              }}
              handleDelete={(category) => {
                setSelectedCategory(category);
                setDeleteModalOpen(true);
              }}
              editModalOpen={editModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
              sx={{ flexGrow: 1, width: "100%" }}
            />
          )}
        </Box>
      </Box>

      <Suspense fallback={<div>Laster...</div>}>
        <AddCategoryDialog
          open={addCategoryDialogOpen}
          onClose={() => handleDialogClose(setAddCategoryDialogOpen)}
          onAdd={addCategoryHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteCategoryDialog
          open={deleteModalOpen}
          onClose={() => handleDialogClose(setDeleteModalOpen)}
          dialogTitle="Bekreft sletting"
          cancelButton={
            <Button onClick={() => setDeleteModalOpen(false)}>Avbryt</Button>
          }
          selectedCategory={memoizedSelectedCategory}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        {memoizedSelectedCategory._id && editModalOpen && (
          <EditCategoryDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            dialogTitle="Rediger Kategori"
            cancelButton={
              <Button onClick={() => setEditModalOpen(false)}>Avbryt</Button>
            }
            selectedCategory={memoizedSelectedCategory}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={editFailureHandler}
          />
        )}
      </Suspense>

      {/* MUI v6 Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        sx={{
          width: "auto",
          maxWidth: 400,
        }}
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
          sx={{
            width: "100%",
            "& .MuiAlert-message": { flexGrow: 1 },
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default CategoryScreen;

