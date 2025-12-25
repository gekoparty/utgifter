import { useState, useMemo, useCallback, lazy, Suspense } from "react";
import { Button, Snackbar, Alert, Box, LinearProgress, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import ReactTable from "../components/commons/React-Table/react-table";

import { usePaginatedData } from "../hooks/usePaginatedData";
import { useDeepCompareMemo } from "use-deep-compare";
import useSnackBar from "../hooks/useSnackBar";

import { API_URL } from "../components/commons/Consts/constants";

// Lazy dialogs
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
const EMPTY_LOCATION = { _id: "", name: "" };

// URL builder
const locationUrlBuilder = (endpoint, params) => {
  const url = new URL(endpoint, API_URL);
  url.searchParams.set("start", params.pageIndex * params.pageSize);
  url.searchParams.set("size", params.pageSize);
  url.searchParams.set("sorting", JSON.stringify(params.sorting || []));
  url.searchParams.set("columnFilters", JSON.stringify(params.filters || []));
  url.searchParams.set("globalFilter", params.globalFilter || "");
  return url;
};

const LocationScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  const [selectedLocation, setSelectedLocation] = useState(EMPTY_LOCATION);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Snackbar
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Query params (memoized)
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

  // Data hook
  const {
    data,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/locations",
    params: fetchParams,
    urlBuilder: locationUrlBuilder,
    baseQueryKey: ["locations", "paginated"],
  });

  const tableData = data?.locations || [];
  const meta = data?.meta || {};

  // Columns (simple)
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Steder",
      },
    ],
    []
  );

  // Dialog close helper
  const closeDialog = useCallback((fn) => {
    fn(false);
    setSelectedLocation(EMPTY_LOCATION);
  }, []);

  // Handlers
  const handleEdit = useCallback((loc) => {
    setSelectedLocation(loc);
    setEditDialogOpen(true);
  }, []);

  const handleDelete = useCallback((loc) => {
    setSelectedLocation(loc);
    setDeleteDialogOpen(true);
  }, []);

  return (
    <TableLayout>
      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => setAddDialogOpen(true)}
      >
        Nytt sted
      </Button>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <LinearProgress sx={{ mb: 1 }} />
          Laster steder...
        </Box>
      ) : (
        <ReactTable
          data={tableData}
          columns={tableColumns}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          sorting={sorting}
          pagination={pagination}
          meta={meta}
          isError={isError}
          isFetching={isFetching}
          refetch={refetch}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}

      {/* Add */}
      <Suspense fallback={<div>Laster...</div>}>
        <AddLocationDialog
          open={addDialogOpen}
          onClose={() => closeDialog(setAddDialogOpen)}
          onAdd={(loc) => showSnackbar(`Sted "${loc.name}" ble lagt til`)}
        />
      </Suspense>

      {/* Delete */}
      <Suspense fallback={<div>Laster...</div>}>
        <DeleteLocationDialog
          open={deleteDialogOpen}
          selectedLocation={selectedLocation}
          onClose={() => closeDialog(setDeleteDialogOpen)}
          onDeleteSuccess={(loc) =>
            showSnackbar(`Sted "${loc.name}" ble slettet`)
          }
          onDeleteFailure={(loc) =>
            showSnackbar(`Kunne ikke slette "${loc.name}"`, "error")
          }
          dialogTitle="Slett sted"
        />
      </Suspense>

      {/* Edit */}
      <Suspense fallback={<div>Laster...</div>}>
        {selectedLocation._id && (
          <EditLocationDialog
            open={editDialogOpen}
            selectedLocation={selectedLocation}
            onClose={() => closeDialog(setEditDialogOpen)}
            onUpdateSuccess={(loc) =>
              showSnackbar(`Sted "${loc.name}" ble oppdatert`)
            }
            onUpdateFailure={() =>
              showSnackbar("Kunne ikke lagre endringer", "error")
            }
          />
        )}
      </Suspense>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        onClose={handleSnackbarClose}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          variant="filled"
          action={
            <IconButton size="small" onClick={handleSnackbarClose}>
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

export default LocationScreen;
