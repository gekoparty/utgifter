import React, { useState, useEffect, useContext } from "react";
import { Box, Button, IconButton, Snackbar, SnackbarContent } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import AddBrandDialog from "../components/commons/BrandDialogs/AddBrandDialog";
import DeleteBrandDialog from "../components/commons/BrandDialogs/DeleteBrandDialog";
import EditBrandDialog from "../components/commons/BrandDialogs/EditBrandDialog";

import useCustomHttp from "../hooks/useHttp";
import useSnackBar from "../hooks/useSnackBar";
import { StoreContext } from "../Store/Store";

const tableHeaders = ["Name", "Delete", "Edit"];

const BrandScreen = () => {
  const { loading, error, data: brandsData } = useCustomHttp("/api/brands");
  const { state, dispatch } = useContext(StoreContext);
  const { brands } = state;

  const [selectedBrand, setSelectedBrand] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addBrandDialogOpen, setAddBrandDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  useEffect(() => {
    if (brandsData) {
      dispatch({
        type: "FETCH_SUCCESS",
        resource: "brands",
        payload: brandsData,
      });
    }
  }, [brandsData, dispatch]);


  const addBrandHandler = (newBrand) => {
    showSuccessSnackbar(`Brand "${newBrand.name}" added successfully`);
  };

  const deleteSuccessHandler = (deletedBrand) => {
    showSuccessSnackbar(`Brand "${deletedBrand.name}" deleted successfully`);
  };

  const deleteFailureHandler = (failedBrand) => {
    showErrorSnackbar(`Failed to delete brand "${failedBrand.name}"`);
  };

  const editSuccessHandler = (updatedBrand) => {
    showSuccessSnackbar(`Brand "${updatedBrand.name}" updated successfully`);
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update brand");
  };

  if (error && error.brands) {
    console.log(error.brands);
    return <div>Error: {error.brands}</div>;
  }

  if (loading || brands === null) {
    return <div>Loading...</div>;
  }

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

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
          <CustomTable
            data={brands}
            headers={tableHeaders}
            onDelete={(brand) => {
              setSelectedBrand(brand);
              setDeleteModalOpen(true);
            }}
            onEdit={(brand) => {
              setSelectedBrand(brand);
              setEditModalOpen(true);
            }}
          />
        </Box>
      </Box>

      <EditBrandDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cancelButton={
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        }
        dialogTitle={"Edit Brand"}
        selectedBrand={selectedBrand}
        onUpdateSuccess={editSuccessHandler}
        onUpdateFailure={editFailureHandler}
      />

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

      <AddBrandDialog
        onClose={() => setAddBrandDialogOpen(false)}
        onAdd={addBrandHandler}
        open={addBrandDialogOpen}
      />
    </TableLayout>
  );
};

export default BrandScreen;
