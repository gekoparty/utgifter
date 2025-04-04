import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Box, Button, IconButton, Snackbar, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useDeepCompareMemo } from "use-deep-compare";
import { usePaginatedData } from "../hooks/usePaginatedData";

// Lazy-loaded Dialogs
const AddBrandDialog = lazy(() =>
  import("../components/features/Brands/BrandDialogs/AddBrand/AddBrandDialog")
);
const DeleteBrandDialog = lazy(() =>
  import("../components/features/Brands/BrandDialogs/DeleteBrand/DeleteBrandDialog")
);
const EditBrandDialog = lazy(() =>
  import("../components/features/Brands/BrandDialogs/EditBrand/EditBrandDialog")
);

// Constants
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_BRAND = { _id: "", name: "" };
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.example.com"
    : "http://localhost:3000";

// URL builder for fetching brands
const brandUrlBuilder = (endpoint, params) => {
  const fetchURL = new URL(endpoint, API_URL);
  fetchURL.searchParams.set("start", `${params.pageIndex * params.pageSize}`);
  fetchURL.searchParams.set("size", `${params.pageSize}`);
  fetchURL.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  fetchURL.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  fetchURL.searchParams.set("globalFilter", params.globalFilter ?? "");
  return fetchURL;
};

const BrandScreen = () => {
  // State management
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedBrand, setSelectedBrand] = useState(INITIAL_SELECTED_BRAND);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addBrandDialogOpen, setAddBrandDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);


  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Define a stable query key for paginated data
  const baseQueryKey = useMemo(() => ["brands", "paginated"], []);

  // Build parameters for usePaginatedData hook using deep compare
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

  // Use the usePaginatedData hook to fetch brands data
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
    baseQueryKey,
  });

  const tableData = useMemo(() => brandsData?.brands || [], [brandsData]);
  const metaData = useMemo(() => brandsData?.meta || {}, [brandsData]);

  // Define table columns
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Merkenavn",
        id: "name",
        size: 150,
        // Add explicit cell rendering to verify values
        Cell: ({ cell }) => {
          console.log('Cell value:', cell.getValue());
          return <span>{cell.getValue()}</span>;
        },
      },
    ],
    []
  );

  // Callback to handle dialog close and reset the selected brand
  const handleDialogClose = useCallback((closeDialogFn) => {
    closeDialogFn(false);
    setSelectedBrand(INITIAL_SELECTED_BRAND);
  }, []);

  // Callback wrappers for sorting and global filtering
  const handleSortingChange = useCallback((newSorting) => setSorting(newSorting), []);
  const handleGlobalFilterChange = useCallback((newGlobalFilter) => setGlobalFilter(newGlobalFilter), []);

  // Success and failure handlers: show snackbar messages and let the mutation handle cache invalidation.
  const addBrandHandler = useCallback(
    (newBrand) => {
      showSnackbar(`Merke "${newBrand.name}" lagt til`);
    },
    [showSnackbar]
  );

  const deleteSuccessHandler = useCallback(
    (deletedBrand) => {
      showSnackbar(`Merke "${deletedBrand.name}" slettet`);
    },
    [showSnackbar]
  );

  const deleteFailureHandler = useCallback(
    (failedBrand) => {
      showSnackbar(`Kunne ikke slette merke "${failedBrand.name}"`);
    },
    [showSnackbar]
  );

  const editSuccessHandler = useCallback(
    (updatedBrand) => {
      showSnackbar(`Merke "${updatedBrand.name}" oppdatert`);
    },
    [showSnackbar]
  );

  const editFailureHandler = useCallback(
    () => {
      showSnackbar("Kunne ikke oppdatere merke");
    },
    [showSnackbar]
  );

  // Handlers for editing and deleting a brand
  const handleEdit = useCallback((brand) => {
    setSelectedBrand(brand);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((brand) => {
    setSelectedBrand(brand);
    setDeleteModalOpen(true);
  }, []);


  return (
    <TableLayout>
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, width: "100%" }}>
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" color="primary" onClick={() => setAddBrandDialogOpen(true)}>
            Nytt Merke
          </Button>
        </Box>
        {tableData && (
          <ReactTable
          key={tableData.length} 
            getRowId={(row) => row._id}
            data={tableData}
            columns={tableColumns}
            setColumnFilters={setColumnFilters}
            setGlobalFilter={handleGlobalFilterChange}
            setSorting={handleSortingChange}
            setPagination={setPagination}
            isError={isError}
            refetch={refetch}
            isFetching={isFetching}
            isLoading={isLoading}
            columnFilters={columnFilters}
            globalFilter={globalFilter}
            pagination={pagination}
            sorting={sorting}
            meta={metaData}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
            sx={{ flexGrow: 1, width: "100%", minWidth: 600 }}
          />
        )}
      </Box>

      <Suspense fallback={<div>Laster Dialog...</div>}>
        <AddBrandDialog
          open={addBrandDialogOpen}
          onClose={() => handleDialogClose(setAddBrandDialogOpen)}
          onAdd={addBrandHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteBrandDialog
          open={deleteModalOpen}
          onClose={() => handleDialogClose(setDeleteBrandDialogOpen => setDeleteModalOpen(false))}
          dialogTitle="Bekreft sletting"
          selectedBrand={selectedBrand}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {selectedBrand._id && editModalOpen && (
          <EditBrandDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedBrand={selectedBrand}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={editFailureHandler}
          />
        )}
      </Suspense>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        sx={{ width: "auto", maxWidth: 400 }}
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
          sx={{ width: "100%", "& .MuiAlert-message": { flexGrow: 1 } }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default BrandScreen;
