import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import AddBrandDialog from "../components/Brands/BrandDialogs/AddBrandDialog";
import DeleteBrandDialog from "../components/Brands/BrandDialogs/DeleteBrandDialog";
import EditBrandDialog from "../components/Brands/BrandDialogs/EditBrandDialog";
import ReactTable from "../components/commons/React-Table/react-table";
import useCustomHttp from "../hooks/useHttp";
import useSnackBar from "../hooks/useSnackBar";
import { StoreContext } from "../Store/Store";
import { useQuery } from "@tanstack/react-query";

//const tableHeaders = ["Name", "Delete", "Edit"];

const BrandScreen = () => {
  const [data, setData] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 5,
  });

  const queryKey = [
    "brands",
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ];

  // Define your query function
  const fetchData = async () => {
    console.log("Fetching data for page:", pagination.pageIndex);
    const fetchURL = new URL(
      '/api/brands', // Update the API endpoint here
      process.env.NODE_ENV === 'production'
        ? 'https://www.material-react-table.com'
        : 'http://localhost:3000',
    );
    
    fetchURL.searchParams.set(
      'start',
      `${pagination.pageIndex * pagination.pageSize}`,
    );
    fetchURL.searchParams.set('size', `${pagination.pageSize}`);
    fetchURL.searchParams.set('columnFilters', JSON.stringify(columnFilters ?? []));
    fetchURL.searchParams.set('globalFilter', globalFilter ?? '');
    fetchURL.searchParams.set('sorting', JSON.stringify(sorting ?? []));
  
    const response = await fetch(fetchURL.href);
    const json = await response.json();
    console.log("Response from server:", json); // Log the response here
    // Set the initial sorting to ascending for the first render
    if (sorting.length === 0) {
      setSorting([{ id: "name", desc: false }]);
    }
    return json;
   
  };
  
  const {
    data: brandsData,
    isError,
    isFetching,
    isLoading,
    refetch
  } = useQuery({
    queryKey: queryKey,
    queryFn: fetchData,
    keepPreviousData: true, // Add this line
  });

  

  const { state, dispatch } = useContext(StoreContext);
  const { brands } = state;
  console.log(state);

  const [selectedBrand, setSelectedBrand] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addBrandDialogOpen, setAddBrandDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const tableColumns = useMemo(
    () => [
      { accessorKey: "_id", header: "ID" },
      { accessorKey: "name", header: "Merkenavn" },
    ],
    []
  );

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

 /*  if (error && error.brands) {
    console.log(error.brands);
    return <div>Error: {error.brands}</div>;
  } */

 /*  if (loading || brands === null) {
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
  } */

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
          {brandsData && (
            <ReactTable
           
              data={brandsData}
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
             
              
            />
          )}

          {/* <CustomTable
            data={brands}
            headers={memoizedTableHeaders}
            onDelete={(brand) => {
              setSelectedBrand(brand);
              setDeleteModalOpen(true);
            }}
            onEdit={(brand) => {
              setSelectedBrand(brand);
              setEditModalOpen(true);
            }}
          /> */}
        </Box>
      </Box>

      {/*  <EditBrandDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cancelButton={
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        }
        dialogTitle={"Edit Brand"}
        selectedBrand={selectedBrand}
        onUpdateSuccess={editSuccessHandler}
        onUpdateFailure={editFailureHandler}
      /> */}

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

      {/* <AddBrandDialog
        onClose={() => setAddBrandDialogOpen(false)}
        onAdd={addBrandHandler}
        open={addBrandDialogOpen}
      /> */}
    </TableLayout>
  );
};

export default BrandScreen;
