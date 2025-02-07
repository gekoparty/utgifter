import React, { useState, useEffect, useMemo, lazy, Suspense } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import useSnackBar from "../hooks/useSnackBar";

// Lazy-loaded dialogs for location actions
const AddLocationDialog = lazy(() =>
  import("../components/Locations/LocationDialogs/AddLocationDialog")
);
const EditLocationDialog = lazy(() =>
  import("../components/Locations/LocationDialogs/EditLocationDialog")
);
const DeleteLocationDialog = lazy(() =>
  import("../components/Locations/LocationDialogs/DeleteLocationDialog")
);

// Constants for initial states and API URL
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_LOCATION = {
  _id: "",
  name: "",
};
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const LocationScreen = () => {
  // Table state variables
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedLocation, setSelectedLocation] = useState(
    INITIAL_SELECTED_LOCATION
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Theme and memoization for selected location
  const theme = useTheme();
  const memoizedSelectedLocation = useMemo(
    () => selectedLocation,
    [selectedLocation]
  );

  // React Query client and query key
  const queryClient = useQueryClient();
  const queryKey = [
    "locations",
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ];

  // Snackbar for user feedback
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Table columns configuration
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Steder....",
        size: 600,
        grow: 2,
        minWidth: 400,
        maxSize: 600,
      },
    ],
    []
  );

  // Function to build the API URL with current table state
  const buildFetchURL = (
    pageIndex,
    pageSize,
    sorting,
    columnFilters,
    globalFilter
  ) => {
    const fetchURL = new URL("/api/locations", API_URL);
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

  // Fetch locations data from the API
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
    return json;
  };

  // Prefetch data for the next page
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
        "locations",
        columnFilters,
        globalFilter,
        nextPageIndex,
        pagination.pageSize,
        sorting,
      ],
      async () => {
        const response = await fetch(fetchURL.href);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText} (${response.status})`);
        }
        const json = await response.json();
        console.log(`Prefetched data for page ${nextPageIndex}:`, json);
        return json;
      }
    );
  };

  // Optionally, trigger prefetching manually
  const handlePrefetch = (nextPageIndex) => {
    prefetchPageData(nextPageIndex);
  };

  // Use React Query to fetch location data
  const {
    data: locationsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchData,
    keepPreviousData: true,
    refetchOnMount: true,
  });

  // Ensure default sorting if none is provided
  useEffect(() => {
    if (sorting.length === 0) setSorting(INITIAL_SORTING);
  }, [sorting]);

  // Automatically prefetch the next page when table state changes
  useEffect(() => {
    const nextPageIndex = pagination.pageIndex + 1;
    console.log(
      "Current page:",
      pagination.pageIndex,
      "Prefetching data for page:",
      nextPageIndex
    );
    prefetchPageData(nextPageIndex);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
    queryClient,
  ]);

  // Handlers for location actions
  const addLocationHandler = (newLocation) => {
    showSuccessSnackbar(`Sted "${newLocation.name}" added successfully`);
    queryClient.invalidateQueries("locations");
    refetch();
  };

  const deleteSuccessHandler = (deletedLocation) => {
    showSuccessSnackbar(`Sted "${deletedLocation.name}" deleted successfully`);
    queryClient.invalidateQueries("locations");
    refetch();
  };

  const deleteFailureHandler = (failedLocation) => {
    showErrorSnackbar(`Failed to delete sted "${failedLocation.name}"`);
  };

  const editSuccessHandler = (updatedLocation) => {
    showSuccessSnackbar(`Sted "${updatedLocation.name}" updated successfully`);
    queryClient.invalidateQueries("locations");
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update sted");
  };

  return (
    <TableLayout>
      {/* Header with action button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 2,
          minWidth: 600,
        }}
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddLocationDialogOpen(true)}
        >
          Nytt Sted
        </Button>
      </Box>

      {/* Table for displaying locations */}
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          minWidth: 600,
        }}
      >
        {locationsData && (
          <ReactTable
            data={locationsData?.locations}
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
            meta={locationsData?.meta}
            setSelectedShop={setSelectedLocation}
            totalRowCount={locationsData?.meta?.totalRowCount}
            rowCount={locationsData?.meta?.totalRowCount ?? 0}
            handleEdit={(location) => {
              setSelectedLocation(location);
              setEditModalOpen(true);
            }}
            handleDelete={(location) => {
              setSelectedLocation(location);
              setDeleteModalOpen(true);
            }}
            editModalOpen={editModalOpen}
            setDeleteModalOpen={setDeleteModalOpen}
          />
        )}
      </Box>

      {/* Modals */}
      <Suspense fallback={<div>Laster Dialog...</div>}>
        <AddLocationDialog
          open={addLocationDialogOpen}
          onClose={() => setAddLocationDialogOpen(false)}
          onAdd={addLocationHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteLocationDialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          dialogTitle="Confirm Deletion"
          cancelButton={
            <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
          }
          selectedLocation={selectedLocation}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {memoizedSelectedLocation._id && editModalOpen && (
          <EditLocationDialog
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            cancelButton={
              <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
            }
            dialogTitle="Edit Location"
            selectedLocation={selectedLocation}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={editFailureHandler}
          />
        )}
      </Suspense>

      {/* Snackbar for feedback messages */}
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

export default LocationScreen;
