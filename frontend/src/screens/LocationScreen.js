import React, { useState, useMemo, lazy, Suspense } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "./common/usePaginatedData";

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
const INITIAL_SELECTED_LOCATION = { _id: "", name: "" };
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

// Custom URL builder for locations
const locationUrlBuilder = (
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

  // Theme, query client, and snackbar setup
  const theme = useTheme();
  const queryClient = useQueryClient();
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const memoizedSelectedLocation = useMemo(
    () => selectedLocation,
    [selectedLocation]
  );

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
    data: locationsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData("/api/locations", fetchParams, locationUrlBuilder);

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



  // Cleanup function for closing dialogs and clearing cached queries
  const handleDialogClose = (closeDialogFn) => {
    closeDialogFn(false);
    queryClient.removeQueries("locations");
    setSelectedLocation(INITIAL_SELECTED_LOCATION);
  };

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
            onClick={() => setAddLocationDialogOpen(true)}
          >
            Nytt Sted
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
              setSelectedShop={setSelectedLocation} // (Rename prop if needed)
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
              sx={{ flexGrow: 1, width: "100%" }}
            />
          )}
        </Box>
      </Box>

      <Suspense fallback={<div>Laster Dialog...</div>}>
        <AddLocationDialog
          open={addLocationDialogOpen}
          onClose={() => handleDialogClose(setAddLocationDialogOpen)}
          onAdd={addLocationHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteLocationDialog
          open={deleteModalOpen}
          onClose={() => handleDialogClose(setDeleteModalOpen)}
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
            onClose={() => handleDialogClose(setEditModalOpen)}
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
