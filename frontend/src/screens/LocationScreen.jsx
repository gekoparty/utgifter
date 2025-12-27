import React, { useState, lazy, Suspense } from "react";
import { Button, Snackbar, Alert, Box, LinearProgress, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import ReactTable from "../components/commons/React-Table/react-table";

import { usePaginatedData } from "../hooks/usePaginatedData";
import useSnackBar from "../hooks/useSnackBar";
import { API_URL } from "../components/commons/Consts/constants";

// Lazy Loaded Dialogs
const AddLocationDialog = lazy(() => import("../components/features/Locations/LocationDialogs/AddLocation/AddLocationDialog"));
const EditLocationDialog = lazy(() => import("../components/features/Locations/LocationDialogs/EditLocation/EditLocationDialog"));
const DeleteLocationDialog = lazy(() => import("../components/features/Locations/LocationDialogs/DeleteLocation/DeleteLocationDialog"));

// Constants
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const EMPTY_LOCATION = { _id: "", name: "" };

// URL Builder
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
  // --- State Management ---
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  // Consolidated Dialog State
  const [activeModal, setActiveModal] = useState(null); // 'ADD', 'EDIT', 'DELETE', or null
  const [selectedLocation, setSelectedLocation] = useState(EMPTY_LOCATION);

  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, handleSnackbarClose } = useSnackBar();

  // --- Data Fetching ---
  // React 19 Compiler handles object stability; no manual memoization needed
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter,
  };

  const { data, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint: "/api/locations",
    params: fetchParams,
    urlBuilder: locationUrlBuilder,
    baseQueryKey: ["locations", "paginated"],
  });

  const tableData = data?.locations || [];
  const meta = data?.meta || {};

  // --- Handlers ---
  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedLocation(EMPTY_LOCATION);
  };

  const handleEdit = (loc) => {
    setSelectedLocation(loc);
    setActiveModal("EDIT");
  };

  const handleDelete = (loc) => {
    setSelectedLocation(loc);
    setActiveModal("DELETE");
  };

  // Centralized Feedback
  const handleSuccess = (action, locationName) => {
    showSnackbar(`Sted "${locationName}" ble ${action}`);
    if (action === "slettet") handleCloseDialog();
  };

  const handleError = (action) => {
    showSnackbar(`Kunne ikke ${action}`, "error");
  };

  // --- Configuration ---
  const tableColumns = [
    {
      accessorKey: "name",
      header: "Steder",
    },
  ];

  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => setActiveModal("ADD")}
        >
          Nytt sted
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <LinearProgress sx={{ mb: 1, maxWidth: 300, mx: "auto" }} />
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

      {/* --- Lazy Loaded Dialogs --- */}
      <Suspense fallback={null}>
        {activeModal === "ADD" && (
          <AddLocationDialog
            open={true}
            onClose={handleCloseDialog}
            onAdd={(loc) => handleSuccess("lagt til", loc.name)}
          />
        )}

        {activeModal === "DELETE" && (
          <DeleteLocationDialog
            open={true}
            selectedLocation={selectedLocation}
            onClose={handleCloseDialog}
            dialogTitle="Slett sted"
            onDeleteSuccess={(loc) => handleSuccess("slettet", loc.name)}
            onDeleteFailure={(loc) => handleError(`slette "${loc.name}"`)}
          />
        )}

        {activeModal === "EDIT" && (
          <EditLocationDialog
            open={true}
            selectedLocation={selectedLocation}
            onClose={handleCloseDialog}
            onUpdateSuccess={(loc) => handleSuccess("oppdatert", loc.name)}
            onUpdateFailure={() => handleError("lagre endringer")}
          />
        )}
      </Suspense>

      {/* --- Feedback --- */}
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

export default LocationScreen;
