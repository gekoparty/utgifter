import React, { useState, lazy, Suspense } from "react";
import { Button, Snackbar, Alert, Box, LinearProgress, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import ReactTable from "../components/commons/React-Table/react-table";

import { usePaginatedData } from "../hooks/usePaginatedData";
import useSnackBar from "../hooks/useSnackBar";
import { API_URL } from "../components/commons/Consts/constants";

// ------------------------------------------------------
// Lazy-loaded consolidated dialog (ADD / EDIT / DELETE)
// ------------------------------------------------------
const loadLocationDialog = () =>
  import("../components/features/Locations/LocationDialogs/LocationDialog");
const LocationDialog = lazy(loadLocationDialog);

// Constants
const LOCATIONS_QUERY_KEY = ["locations", "paginated"];
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_LOCATION = { _id: "", name: "" };
const TABLE_COLUMNS = [{ accessorKey: "name", header: "Steder" }];

// URL Builder
const locationUrlBuilder = (endpoint, params) => {
  const url = new URL(endpoint, API_URL);
  url.searchParams.set("start", params.pageIndex * params.pageSize);
  url.searchParams.set("size", params.pageSize);
  url.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  url.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  url.searchParams.set("globalFilter", params.globalFilter ?? "");
  return url;
};

const LocationScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  const [activeModal, setActiveModal] = useState(null); // ADD | EDIT | DELETE | null
  const [selectedLocation, setSelectedLocation] = useState(INITIAL_SELECTED_LOCATION);

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

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
    baseQueryKey: LOCATIONS_QUERY_KEY,
  });

  const tableData = data?.locations ?? [];
  const meta = data?.meta ?? {};

  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedLocation(INITIAL_SELECTED_LOCATION);
  };

  const handleEdit = (loc) => {
    loadLocationDialog();
    setSelectedLocation(loc);
    setActiveModal("EDIT");
  };

  const handleDelete = (loc) => {
    loadLocationDialog();
    setSelectedLocation(loc);
    setActiveModal("DELETE");
  };

  const handleSuccess = (action, locationName) => {
    showSnackbar(`Sted "${locationName}" ble ${action}`);
    handleCloseDialog();
    // ✅ no refetch here if mutations invalidate LOCATIONS_QUERY_KEY
  };

  const handleError = (action) => {
    showSnackbar(`Kunne ikke ${action}`, "error");
  };

  

  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onMouseEnter={loadLocationDialog}
          onFocus={loadLocationDialog}
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
          columns={TABLE_COLUMNS}  
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          sorting={sorting}
          pagination={pagination}
          meta={meta}
          refetch={refetch}
          isError={isError}
          isFetching={isFetching}
          isLoading={isLoading}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}

      <Suspense fallback={null}>
        {activeModal && (
          <LocationDialog
            open
            mode={activeModal}
            locationToEdit={selectedLocation}
            onClose={handleCloseDialog}
            onSuccess={(loc) => {
              const action =
                activeModal === "DELETE"
                  ? "slettet"
                  : activeModal === "EDIT"
                  ? "oppdatert"
                  : "lagt til";

              handleSuccess(action, loc.name);
            }}
            onError={() => handleError("utføre handling")}
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

