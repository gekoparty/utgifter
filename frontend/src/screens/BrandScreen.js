import React, { useState, useMemo } from "react";

import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import AddBrandDialog from "../components/Brands/BrandDialogs/AddBrandDialog";
import DeleteBrandDialog from "../components/Brands/BrandDialogs/DeleteBrandDialog";
import EditBrandDialog from "../components/Brands/BrandDialogs/EditBrandDialog";
import ReactTable from "../components/commons/React-Table/react-table";

import useSnackBar from "../hooks/useSnackBar";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 5,
};
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_BRAND = {
  _id: "",
  name: "",
};
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const BrandScreen = () => {
  // State
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedBrand, setSelectedBrand] = useState(INITIAL_SELECTED_BRAND);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addBrandDialogOpen, setAddBrandDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Define the column configuration outside of the component
  const tableColumns = useMemo(
    () => [{ accessorKey: "name", header: "Merkenavn" }],
    []
  );

  // React Query
  const queryClient = useQueryClient();
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
    const fetchURL = new URL("/api/brands", API_URL);

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
    refetch,
  } = useQuery({
    queryKey: queryKey,
    queryFn: fetchData,
    keepPreviousData: true,
    refetchOnMount: true,
  });

  // Snackbar
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Handlers

  const addBrandHandler = (newBrand) => {
    showSuccessSnackbar(`Brand "${newBrand.name}" added successfully`);
    queryClient.invalidateQueries("brands");
    refetch();
  };

  const deleteSuccessHandler = (deletedBrand) => {
    showSuccessSnackbar(`Brand "${deletedBrand.name}" deleted successfully`);
    queryClient.invalidateQueries("brands");
    refetch();
    setSelectedBrand(INITIAL_SELECTED_BRAND);
  };

  const deleteFailureHandler = (failedBrand) => {
    showErrorSnackbar(`Failed to delete brand "${failedBrand.name}"`);
  };

  const editSuccessHandler = (updatedBrand) => {
    showSuccessSnackbar(`Brand "${updatedBrand.name}" updated successfully`);
    queryClient.invalidateQueries("brands");
    refetch();
    setSelectedBrand(INITIAL_SELECTED_BRAND);
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update brand");
  };

  // Render
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
              setSelectedBrand={setSelectedBrand}
              handleEdit={(brand) => {
                setSelectedBrand(brand);
                setEditModalOpen(true);
              }}
              handleDelete={(brand) => {
                setSelectedBrand(brand);
                setDeleteModalOpen(true);
              }}
              editModalOpen={editModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
            />
          )}
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

      <AddBrandDialog
        onClose={() => setAddBrandDialogOpen(false)}
        onAdd={addBrandHandler}
        open={addBrandDialogOpen}
      />
    </TableLayout>
  );
};

export default BrandScreen;
