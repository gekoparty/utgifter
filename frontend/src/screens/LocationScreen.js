import React, { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Box, Button, IconButton, Snackbar, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useDeepCompareMemo } from "use-deep-compare";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

const AddLocationDialog = lazy(() =>
  import("../components/features/Locations/LocationDialogs/AddLocation/AddLocationDialog")
);
const EditLocationDialog = lazy(() =>
  import("../components/features/Locations/LocationDialogs/EditLocation/EditLocationDialog")
);
const DeleteLocationDialog = lazy(() =>
  import("../components/features/Locations/LocationDialogs/DeleteLocation/DeleteLocationDialog")
);

const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_LOCATION = { _id: "", name: "" };


const locationUrlBuilder = (endpoint, params) => {
  const fetchURL = new URL(endpoint, API_URL);
  Object.entries({
    start: params.pageIndex * params.pageSize,
    size: params.pageSize,
    sorting: JSON.stringify(params.sorting ?? []),
    columnFilters: JSON.stringify(params.filters ?? []),
    globalFilter: params.globalFilter ?? "",
  }).forEach(([key, value]) => fetchURL.searchParams.set(key, value));
  return fetchURL;
};

const LocationScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedLocation, setSelectedLocation] = useState(INITIAL_SELECTED_LOCATION);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Define a stable query key for paginated data
  const baseQueryKey = useMemo(() => ["locations", "paginated"], []);

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
    data: locationsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/locations",
    params: fetchParams,
    urlBuilder: locationUrlBuilder,
    baseQueryKey,
  });

  const tableData = useMemo(() => locationsData?.locations || [], [locationsData]);
  const metaData = useMemo(() => locationsData?.meta || {}, [locationsData]);

  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Steder",
        size: 600,
        grow: 2,
        minWidth: 400,
        maxSize: 600,
      },
    ],
    []
  );

  const handleDialogClose = useCallback((closeDialogFn) => {
    closeDialogFn(false);
    setSelectedLocation(INITIAL_SELECTED_LOCATION);
  }, []);

  const handleSortingChange = useCallback((newSorting) => setSorting(newSorting), []);
  const handleGlobalFilterChange = useCallback((newGlobalFilter) => setGlobalFilter(newGlobalFilter), []);

  // Success handlers now only show snackbar messages.
  // Cache invalidation and refetching are handled by the useLocationDialog hook.
  const addLocationHandler = useCallback(
    (newLocation) => {
      showSnackbar(`Sted "${newLocation.name}" ble lagt til`);
    },
    [showSnackbar]
  );

  const deleteSuccessHandler = useCallback(
    (deletedLocation) => {
      showSnackbar(`Sted "${deletedLocation.name}" ble slettet`);
    },
    [showSnackbar]
  );

  const editSuccessHandler = useCallback(
    (updatedLocation) => {
      showSnackbar(`Sted "${updatedLocation.name}" ble oppdatert`);
    },
    [showSnackbar]
  );

  const handleEdit = useCallback((location) => {
    setSelectedLocation(location);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((location) => {
    setSelectedLocation(location);
    setDeleteModalOpen(true);
  }, []);

  return (
    <TableLayout>
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, width: "100%" }}>
        <Box sx={{ mb: 2 }}>
          <Button variant="contained" onClick={() => setAddLocationDialogOpen(true)}>
            Nytt Sted
          </Button>
        </Box>
        {tableData && (
          <ReactTable
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
          dialogTitle="Bekreft sletting"
          cancelButton={<Button onClick={() => setDeleteModalOpen(false)}>Avbryt</Button>}
          selectedLocation={selectedLocation}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={(failedLocation) =>
            showSnackbar(`Kunne ikke slette sted "${failedLocation.name}"`)
          }
        />
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {selectedLocation._id && (
          <EditLocationDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            cancelButton={<Button onClick={() => setEditModalOpen(false)}>Avbryt</Button>}
            dialogTitle="Rediger sted"
            selectedLocation={selectedLocation}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={() => showSnackbar("Kunne ikke lagre endringer av sted")}
          />
        )}
      </Suspense>

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
            <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
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

export default LocationScreen;
