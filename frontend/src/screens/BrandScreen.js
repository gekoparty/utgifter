import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useDeepCompareMemo } from "use-deep-compare";
import { usePaginatedData } from "../hooks/usePaginatedData";

const AddBrandDialog = lazy(() =>
  import("../components/features/Brands/BrandDialogs/AddBrand/AddBrandDialog")
);
const DeleteBrandDialog = lazy(() =>
  import("../components/features/Brands/BrandDialogs/DeleteBrand/DeleteBrandDialog")
);
const EditBrandDialog = lazy(() =>
  import("../components/features/Brands/BrandDialogs/EditBrand/EditBrandDialog")
);

const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_BRAND = { _id: "", name: "" };
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://api.example.com"
    : "http://localhost:3000";

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

  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Merkenavn",
        id: "name",
        size: 150,
        Cell: ({ cell }) => <span>{cell.getValue()}</span>,
      },
    ],
    []
  );

  const handleDialogClose = useCallback((closeDialogFn) => {
    closeDialogFn(false);
    setSelectedBrand(INITIAL_SELECTED_BRAND);
  }, []);

  const handleSortingChange = useCallback((newSorting) => setSorting(newSorting), []);
  const handleGlobalFilterChange = useCallback((newGlobalFilter) => setGlobalFilter(newGlobalFilter), []);

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
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          width: "100%",
          p: 3,
          bgcolor: "#f9f9f9",
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddBrandDialogOpen(true)}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              px: 3,
              py: 1,
              fontWeight: "bold",
              boxShadow: 1,
              bgcolor: "#1976d2",
              ":hover": {
                bgcolor: "#1565c0",
              },
            }}
          >
            + Nytt Merke
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
            sx={{
              flexGrow: 1,
              width: "100%",
              minWidth: 600,
              bgcolor: "white",
              borderRadius: 2,
              boxShadow: 1,
              p: 2,
              "& .MuiTableHead-root": {
                bgcolor: "#f1f3f5",
              },
              "& .MuiTableCell-root": {
                borderBottom: "1px solid #e0e0e0",
              },
            }}
          />
        )}
      </Box>

      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        }
      >
        <AddBrandDialog
          open={addBrandDialogOpen}
          onClose={() => handleDialogClose(setAddBrandDialogOpen)}
          onAdd={addBrandHandler}
        />
      </Suspense>

      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        }
      >
        <DeleteBrandDialog
          open={deleteModalOpen}
          onClose={() => handleDialogClose(() => setDeleteModalOpen(false))}
          dialogTitle="Bekreft sletting"
          selectedBrand={selectedBrand}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
        />
      </Suspense>

      <Suspense
        fallback={
          <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
            <CircularProgress size={28} />
          </Box>
        }
      >
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
        sx={{ width: "auto", maxWidth: 400, mb: { xs: 2, sm: 4 } }}
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
          sx={{ width: "100%", borderRadius: 1, "& .MuiAlert-message": { flexGrow: 1 } }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default BrandScreen;
