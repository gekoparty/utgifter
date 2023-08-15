import React, { useState, useEffect, useContext, useMemo } from "react";
import { Box, Button, IconButton, Snackbar, SnackbarContent } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import AddLocationDialog from "../components/Locations/LocationDialogs/AddLocationDialog";
import DeleteLocationDialog from "../components/Locations/LocationDialogs/DeleteLocationDialog"
import EditLocationDialog from '../components/Locations/LocationDialogs/EditLocationDialog';

import useCustomHttp from "../hooks/useHttp";
import useSnackBar from "../hooks/useSnackBar";
import { StoreContext } from "../Store/Store";

const tableHeaders = ["Name", "Delete", "Edit"];



const LocationScreen = () => {
  const { loading, error, data: locationsData } = useCustomHttp("/api/locations");
  const { state, dispatch } = useContext(StoreContext);
  const { locations } = state;
  console.log(state)

  const [selectedLocation, setSelectedLocation] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const memoizedTableHeaders = useMemo(() => tableHeaders, []);
  

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  useEffect(() => {
    if (locationsData) {
      dispatch({
        type: "FETCH_SUCCESS",
        resource: "locations",
        payload: locationsData,
      });
    }
  }, [locationsData, dispatch]);



  const addLocationHandler = (newLocation) => {
    showSuccessSnackbar(`Sted "${newLocation.name}" added successfully`);
  };

  const deleteSuccessHandler = (deletedLocation) => {
    showSuccessSnackbar(`Sted "${deletedLocation.name}" deleted successfully`);
  };

  const deleteFailureHandler = (failedLocation) => {
    showErrorSnackbar(`Failed to delete sted "${failedLocation.name}"`);
  };

  const editSuccessHandler = (updatedLocation) => {
    showSuccessSnackbar(`Sted "${updatedLocation.name}" updated successfully`);
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update sted");
  };

  if (error && error.locations) {
    console.log(error.locations);
    return <div>Error: {error.locations}</div>;
  }

  if (loading || locations === null) {
    return (
      <div
        style={{
          position: "absolute",
          top: "240px",
          left: "500px",
          zIndex: 9999, // Set a high z-index to ensure it's above the sidebar
        }}
      >
        Loading...
      </div>
    );
  }

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
          <CustomTable
            data={locations}
            headers={memoizedTableHeaders}
            onDelete={(location) => {
              setSelectedLocation(location);
              setDeleteModalOpen(true);
            }}
            onEdit={(location) => {
              setSelectedLocation(location);
              setEditModalOpen(true);
            }}
          />
        </Box>
      </Box>

      <EditLocationDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cancelButton={
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        }
        dialogTitle={"Edit Location"}
        selectedLocation={selectedLocation}
        onUpdateSuccess={editSuccessHandler}
        onUpdateFailure={editFailureHandler}
      />

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