import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Box, Button, IconButton, Snackbar, Alert, LinearProgress } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useDeepCompareMemo } from "use-deep-compare";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// Lazy dialogs
const AddBrandDialog = lazy(() => import("../components/features/Brands/BrandDialogs/AddBrand/AddBrandDialog"));
const DeleteBrandDialog = lazy(() => import("../components/features/Brands/BrandDialogs/DeleteBrand/DeleteBrandDialog"));
const EditBrandDialog = lazy(() => import("../components/features/Brands/BrandDialogs/EditBrand/EditBrandDialog"));

const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_BRAND = { _id: "", name: "" };

// URL builder
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
  // Table state
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  // Dialog state
  const [selectedBrand, setSelectedBrand] = useState(INITIAL_SELECTED_BRAND);
  const [addBrandDialogOpen, setAddBrandDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Snackbar
  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, handleSnackbarClose } =
    useSnackBar();

  const baseQueryKey = useMemo(() => ["brands", "paginated"], []);

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

  const { data: brandsData, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint: "/api/brands",
    params: fetchParams,
    urlBuilder: brandUrlBuilder,
    baseQueryKey,
  });

  const tableData = brandsData?.brands || [];
  const metaData = brandsData?.meta || {};

  // Table columns (clean)
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Merkenavn",
      },
    ],
    []
  );

  const handleDialogClose = useCallback((closeFn) => {
    closeFn(false);
    setSelectedBrand(INITIAL_SELECTED_BRAND);
  }, []);

  // Success handlers
  const addBrandHandler = useCallback(
    (brand) => showSnackbar(`Merke "${brand.name}" ble lagt til`),
    [showSnackbar]
  );

  const deleteSuccessHandler = useCallback(
    (brand) => showSnackbar(`Merke "${brand.name}" ble slettet`),
    [showSnackbar]
  );

  const deleteFailureHandler = useCallback(
    (brand) => showSnackbar(`Kunne ikke slette merke "${brand.name}"`, "error"),
    [showSnackbar]
  );

  const editSuccessHandler = useCallback(
    (brand) => showSnackbar(`Merke "${brand.name}" ble oppdatert`),
    [showSnackbar]
  );

  const editFailureHandler = useCallback(
    () => showSnackbar("Kunne ikke oppdatere merke", "error"),
    [showSnackbar]
  );

  // Row actions
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
      <Button variant="contained" onClick={() => setAddBrandDialogOpen(true)} sx={{ mb: 2 }}>
        Nytt Merke
      </Button>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <LinearProgress sx={{ mb: 2 }} />
          Laster merker...
        </Box>
      ) : (
        <ReactTable
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

      {/* Dialogs */}
      <Suspense fallback={<div>Laster dialog...</div>}>
        <AddBrandDialog
          open={addBrandDialogOpen}
          onClose={() => handleDialogClose(setAddBrandDialogOpen)}
          onAdd={addBrandHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteBrandDialog
          open={deleteModalOpen}
          onClose={() => handleDialogClose(setDeleteModalOpen)}
          selectedBrand={selectedBrand}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
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
