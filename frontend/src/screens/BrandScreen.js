import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState, useEffect, useContext } from "react";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import AddBrandDialog from "../components/commons/BrandDialogs/AddBrandDialog";
import DeleteBrandDialog from "../components/commons/BrandDialogs/DeleteBrandDialog";
import useCustomHttp from "../hooks/useHttp";
import { StoreContext } from "../Store/Store";

const BrandScreen = () => {
  const { data: brandsData, loading, error,fetchData } = useCustomHttp("/api/brands");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedBrand, setSelectedBrand] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addBrandDialogOpen, setAddBrandDialogOpen] = useState(false);

  const tableHeaders = ["Name", "Delete", "Edit"];

  const { state, dispatch } = useContext(StoreContext);
  const { brands } = state;
  const [tableData, setTableData] = useState(brands);

  const handleAddBrand = (newBrand) => {
    // Handle the newly added brand (e.g., show a success message)
    setSnackbarMessage(`Brand "${newBrand.name}" added successfully`);
    setSnackbarSeverity("success");
    setSnackbarOpen(true);

    // Close the snackbar after 3 seconds (3000 milliseconds)
    setTimeout(() => {
      setSnackbarOpen(false);
    }, 3000);
  };

  const handleDeleteBrand = () => {
    setDeleteModalOpen(false);
  };

  useEffect(() => {
    if (brandsData) {
      dispatch({
        type: 'FETCH_SUCCESS',
        resource: 'brands',
        payload: brandsData,
      });
    }
  }, [brandsData, dispatch]);

  useEffect(() => {
    setTableData(brands);
    console.log("tabledata", brands)
  }, [brands]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
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
          Add Brand
        </Button>
      </Box>

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
          <CustomTable
            data={tableData}
            headers={tableHeaders}
            onDelete={(brand) => {
              setSelectedBrand(brand);
              setDeleteModalOpen(true);
            }}
          />
        </Box>
        <DeleteBrandDialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          dialogTitle="Bekreft Sletting"
          cancelButton={
            <Button onClick={() => setDeleteModalOpen(false)}>Avbryt</Button>
          }
          selectedBrand={selectedBrand}
        />
      </Box>
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        //onClose={handleSnackbarClose}
      >
        <SnackbarContent
          sx={{
            backgroundColor: snackbarSeverity === "success" ? "green" : "red",
          }}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              color="inherit"
              //onClick={handleSnackbarClose}
            >
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>
      <AddBrandDialog
        onClose={() => setAddBrandDialogOpen(false)}
        onAdd={handleAddBrand}
        open={addBrandDialogOpen}
      />
    </TableLayout>
  );
};

export default BrandScreen;
