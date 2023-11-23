import React, { useState, useMemo } from "react";
import { Box, Button, IconButton, Snackbar, SnackbarContent } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import AddLocationDialog from "../components/Locations/LocationDialogs/AddLocationDialog";
import DeleteLocationDialog from "../components/Locations/LocationDialogs/DeleteLocationDialog"
import EditLocationDialog from '../components/Locations/LocationDialogs/EditLocationDialog';
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import useSnackBar from "../hooks/useSnackBar";



// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 5,
};
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

  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedLocation, setSelectedLocation] = useState(INITIAL_SELECTED_LOCATION);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const tableColumns = useMemo(
    () => [{ accessorKey: "name", header: "Steder" }],
    []
  );

  // React Query
  const queryClient = useQueryClient();
  const queryKey = [
    "locations",
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ];

  // Define your query function
  const fetchData = async () => {
    const fetchURL = new URL("/api/locations", API_URL);

    fetchURL.searchParams.set(
      "start",
      `${pagination.pageIndex * pagination.pageSize}`
    );
    fetchURL.searchParams.set("size", `${pagination.pageSize}`);
    fetchURL.searchParams.set(
      "columnFilters",
      JSON.stringify(columnFilters ?? [])
    );
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));

    const response = await fetch(fetchURL.href);
    const json = await response.json();

    // Set the initial sorting to ascending for the first render
    if (sorting.length === 0) {
      setSorting([{ id: "name", desc: false }]);
    }
    return json;
  };

  const {
    data: locationsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKey,
    queryFn: fetchData,
    keepPreviousData: true,
    refetchOnMount: true,
  });


  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();



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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddLocationDialogOpen(true)}
        >
          Nytt Sted
        </Button>
      </Box>

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
        {locationsData && (
            <ReactTable
              data={locationsData?.locations}
              columns={tableColumns}
              setColumnFilters={setColumnFilters}
              setGlobalFilter={setGlobalFilter}
              totalRowCount={locationsData.meta.totalRowCount} 
              meta={locationsData?.meta}
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
              rowCount={locationsData?.meta?.totalRowCount ?? 0}
              setSelectedLocation={setSelectedLocation}
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
      </Box>

      <EditLocationDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cancelButton={
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        }
        dialogTitle={"Rediger sted"}
        selectedLocation={selectedLocation}
        onUpdateSuccess={editSuccessHandler}
        onUpdateFailure={editFailureHandler}
      />

      <DeleteLocationDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        dialogTitle="Bekreft sletting"
        cancelButton={
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
        }
        selectedLocation={selectedLocation}
        onDeleteSuccess={deleteSuccessHandler}
        onDeleteFailure={deleteFailureHandler}
      />

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <SnackbarContent
          sx={{
            backgroundColor: snackbarSeverity === "success" ? "green" : "red",
          }}
          message={snackbarMessage}
          action={
            <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>

      <AddLocationDialog
        onClose={() => setAddLocationDialogOpen(false)}
        onAdd={addLocationHandler}
        open={addLocationDialogOpen}
      />
    </TableLayout>
  );
};

export default LocationScreen;