import React, {
  useState,
  useMemo,
  useEffect,
  lazy,
  Suspense,
} from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import ReactTable from "../components/commons/React-Table/react-table";
import { useTheme } from "@mui/material/styles";
import useSnackBar from "../hooks/useSnackBar";
import { useQuery, useQueryClient } from "@tanstack/react-query";

// Lazy-load Brand Dialogs for consistency
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
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 5 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_BRAND = { _id: "", name: "" };
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const BrandScreen = () => {
  // State management for table filters, sorting, pagination, selection, and dialogs.
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedBrand, setSelectedBrand] = useState(INITIAL_SELECTED_BRAND);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addBrandDialogOpen, setAddBrandDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const theme = useTheme();
  const memoizedSelectedBrand = useMemo(
    () => selectedBrand,
    [selectedBrand]
  );

  // React Query client for cache manipulation
  const queryClient = useQueryClient();

  // Helper: Build the fetch URL for brands using the current table state.
  const buildFetchURL = (
    pageIndex,
    pageSize,
    sorting,
    columnFilters,
    globalFilter
  ) => {
    const fetchURL = new URL("/api/brands", API_URL);
    fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
    fetchURL.searchParams.set("size", `${pageSize}`);
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
    fetchURL.searchParams.set(
      "columnFilters",
      JSON.stringify(columnFilters ?? [])
    );
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
    return fetchURL;
  };

  // Fetch data function that retrieves brands from the API.
  const fetchData = async () => {
    const fetchURL = buildFetchURL(
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter
    );
    const response = await fetch(fetchURL.href);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText} (${response.status})`);
    }
    const json = await response.json();
    // If sorting is empty, enforce default sorting.
    if (sorting.length === 0) setSorting(INITIAL_SORTING);
    return json;
  };

  // Prefetch next page data to optimize navigation.
  const prefetchPageData = async (nextPageIndex) => {
    const fetchURL = buildFetchURL(
      nextPageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter
    );
    await queryClient.prefetchQuery(
      [
        "brands",
        columnFilters,
        globalFilter,
        nextPageIndex,
        pagination.pageSize,
        sorting,
      ],
      async () => {
        const response = await fetch(fetchURL.href);
        if (!response.ok) {
          throw new Error(
            `Error: ${response.statusText} (${response.status})`
          );
        }
        const json = await response.json();
        return json;
      }
    );
  };

  // React Query hook to fetch brand data.
  const {
    data: brandsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [
      "brands",
      columnFilters,
      globalFilter,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
    ],
    queryFn: fetchData,
    keepPreviousData: true,
    refetchOnMount: true,
  });

  // Prefetch the next page whenever pagination, filters, or sorting change.
  useEffect(() => {
    const nextPageIndex = pagination.pageIndex + 1;
    prefetchPageData(nextPageIndex);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
    queryClient,
  ]);

  // Snackbar for user feedback.
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Handlers for brand actions.
  const addBrandHandler = (newBrand) => {
    showSuccessSnackbar(`Brand "${newBrand.name}" added successfully`);
    queryClient.invalidateQueries("brands");
    refetch();
  };

  const deleteSuccessHandler = (deletedBrand) => {
    showSuccessSnackbar(`Brand "${deletedBrand.name}" deleted successfully`);
    queryClient.invalidateQueries("brands");
    refetch();
    setSelectedBrand(INITIAL_SELECTED_BRAND);
  };

  const deleteFailureHandler = (failedBrand) => {
    showErrorSnackbar(`Failed to delete brand "${failedBrand.name}"`);
  };

  const editSuccessHandler = (updatedBrand) => {
    showSuccessSnackbar(`Brand "${updatedBrand.name}" updated successfully`);
    queryClient.invalidateQueries("brands");
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update brand");
  };

  // Table column configuration.
  const tableColumns = useMemo(
    () => [{ accessorKey: "name", header: "Merkenavn" }],
    []
  );

  return (
    <TableLayout>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
      >
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
          width: "100%",
          display: "flex",
          justifyContent: "center",
          boxShadow: 2,
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
            meta={brandsData?.meta}
            setSelectedBrand={setSelectedBrand}
            totalRowCount={brandsData?.meta?.totalRowCount}
            rowCount={brandsData?.meta?.totalRowCount ?? 0}
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

      {/* Lazy-loaded Dialogs */}
      <Suspense fallback={<div>Laster Dialog...</div>}>
        <AddBrandDialog
          open={addBrandDialogOpen}
          onClose={() => setAddBrandDialogOpen(false)}
          onAdd={addBrandHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteBrandDialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          dialogTitle="Confirm Deletion"
          cancelButton={
            <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          }
          selectedBrand={selectedBrand}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {memoizedSelectedBrand._id && editModalOpen && (
          <EditBrandDialog
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            cancelButton={
              <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
            }
            dialogTitle="Edit Brand"
            selectedBrand={selectedBrand}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={editFailureHandler}
          />
        )}
      </Suspense>

      {/* Snackbar for Feedback */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <SnackbarContent
          sx={{
            backgroundColor:
              snackbarSeverity === "success"
                ? theme.palette.success.main
                : snackbarSeverity === "error"
                ? theme.palette.error.main
                : theme.palette.info.main,
            color: theme.palette.success.contrastText,
          }}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>
    </TableLayout>
  );
};

export default BrandScreen;

