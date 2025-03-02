import React, { useState, useMemo, lazy, Suspense } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useQueryClient } from "@tanstack/react-query";
import { usePaginatedData } from "./common/usePaginatedData"; // Generic data hook

// Lazy-loaded Dialogs
const AddBrandDialog = lazy(() =>
  import("../components/Brands/BrandDialogs/AddBrandDialog")
);
const DeleteBrandDialog = lazy(() =>
  import("../components/Brands/BrandDialogs/DeleteBrandDialog")
);
const EditBrandDialog = lazy(() =>
  import("../components/Brands/BrandDialogs/EditBrandDialog")
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
const brandUrlBuilder = (
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

  const queryClient = useQueryClient();
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const memoizedSelectedBrand = useMemo(() => selectedBrand, [selectedBrand]);


   // Build parameters for usePaginatedData hook
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

  // Use the usePaginatedData hook to fetch locations data
   const {
     data: brandsData,
     isError,
     isFetching,
     isLoading,
     refetch,
   } = usePaginatedData("/api/brands", fetchParams, brandUrlBuilder);

  // Table columns
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Merkenavn",
        size: 150,
        grow: 2,
        minSize: 150,
        maxSize: 400,
      },
    ],
    []
  );


 // Cleanup function for closing dialogs and clearing cached queries
 const handleDialogClose = (closeDialogFn) => {
  closeDialogFn(false);
  setSelectedBrand(INITIAL_SELECTED_BRAND);
};

 // Handlers for brand actions
  const addBrandHandler = (newBrand) => {
    showSuccessSnackbar(`Merke "${newBrand.name}" lagt til`);
    queryClient.invalidateQueries(["brands"]);
    refetch();
  };

  const deleteFailureHandler = (failedBrand) => {
    showErrorSnackbar(`Kunne ikke slette merke "${failedBrand.name}"`);
  };

  const deleteSuccessHandler = (deletedBrand) => {
    showSuccessSnackbar(`Merke "${deletedBrand.name}" slettet`);
    queryClient.invalidateQueries(["brands"]);
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Kunne ikke oppdatere merke");
  };

  const editSuccessHandler = (updatedBrand) => {
    showSuccessSnackbar(`Merke "${updatedBrand.name}" oppdatert`);
    queryClient.invalidateQueries(["brands"]);
    refetch();
  };

  

  return (
    <TableLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddBrandDialogOpen(true)}
        >
          Nytt Merke
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
        {brandsData && (
          <ReactTable
            data={brandsData.brands}
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
            meta={brandsData.meta}
            setSelectedBrand={setSelectedBrand}
            totalRowCount={brandsData.meta?.totalRowCount}
            handleEdit={(brand) => {
              setSelectedBrand(brand);
              setEditModalOpen(true);
            }}
            handleDelete={(brand) => {
              setSelectedBrand(brand);
              setDeleteModalOpen(true);
            }}
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
          onClose={() => handleDialogClose(setDeleteModalOpen)}
          dialogTitle="Bekreft sletting" // Add this line
          selectedBrand={selectedBrand}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {memoizedSelectedBrand._id && editModalOpen && (
          <EditBrandDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedBrand={selectedBrand}
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
        slotProps={{
          root: {
            'data-testid': 'snackbar',
            component: 'div',
          }
        }}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon />
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

export default BrandScreen;
