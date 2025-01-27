import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import useSnackBar from "../hooks/useSnackBar";
import EditCategoryDialog from "../components/Categories/CategoryDialogs/EditCategoryDialog";
import AddCategoryDialog from "../components/Categories/CategoryDialogs/AddCategoryDialog";
import DeleteCategoryDialog from "../components/Categories/CategoryDialogs/DeleteCategoryDialog";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";

// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 5,
};
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_CATEGORY = {
  _id: "",
  name: "",
};
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

    const generateQueryKey = (
      columnFilters,
      globalFilter,
      pageIndex,
      pageSize,
      sorting
    ) => [
      "categories",
      columnFilters,
      globalFilter,
      pageIndex,
      pageSize,
      sorting,
    ];  

const CategoryScreen = () => {
  
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_SELECTED_CATEGORY);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const theme = useTheme();
  

  const tableColumns = useMemo(
    () => [{ accessorKey: "name", header: "Katerogi" }],
    []
  );


  // React Query
  const queryClient = useQueryClient();
  // React Query
  const queryKey = generateQueryKey(
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting
  );

  // Define your query function
  const fetchData = async () => {
    const fetchURL = new URL("/api/categories", API_URL);

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
    data: categoriesData,
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
  

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update kategori");
  };

  const editSuccessHandler = (updatedCategory) => {
    showSuccessSnackbar(`Sted "${updatedCategory.name}" updated successfully`);
    queryClient.invalidateQueries("categories");
    refetch();
  };

  const deleteSuccessHandler = (deletedCategory) => {
    showSuccessSnackbar(`Sted "${deletedCategory.name}" deleted successfully`);
    queryClient.invalidateQueries("categories");
    refetch();
  };

  const deleteFailureHandler = (failedCategory) => {
    showErrorSnackbar(`Failed to delete sted "${failedCategory.name}"`);
    
  };

  const addCategoryHandler = (newCategory) => {
    showSuccessSnackbar(`Sted "${newCategory.name}" added successfully`);
    queryClient.invalidateQueries("categories");
    refetch();
  };

  

  

  return (
    <TableLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddCategoryDialogOpen(true)}
        >
          Ny Kategori
        </Button>
      </Box>
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", boxShadow: 2  }}>
        {isLoading && <p>Loading...</p>}
        {isError && <p>An error occurred while fetching data.</p>}
        {!isLoading && !isError && (
            <ReactTable
              data={categoriesData?.categories}
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
              meta={categoriesData?.meta}
              rowCount={categoriesData?.meta?.totalRowCount ?? 0}
              setSelectedLocation={setSelectedCategory}
              handleEdit={(category) => {
                setSelectedCategory(category);
                setEditModalOpen(true);
              }}
              handleDelete={(category) => {
                setSelectedCategory(category);
                setDeleteModalOpen(true);
              }}
              editModalOpen={editModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
            />
          )}
      </Box>
      <EditCategoryDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cancelButton={
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
        }
        dialogTitle={"Edit Category"}
        selectedCategory={selectedCategory}
        onUpdateSuccess={editSuccessHandler}
        onUpdateFailure={editFailureHandler}
      />

      <DeleteCategoryDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        dialogTitle="Confirm Deletion"
        cancelButton={
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
        }
        selectedCategory={selectedCategory}
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
            backgroundColor:
              snackbarSeverity === "success"
                ? theme.palette.success.main
                : snackbarSeverity === "error"
                ? theme.palette.error.main
                : theme.palette.info.main, // Default to info if no severity
            color: theme.palette.success.contrastText, // Use theme-based text contrast color
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

      <AddCategoryDialog
        onClose={() => setAddCategoryDialogOpen(false)}
        onAdd={addCategoryHandler}
        open={addCategoryDialogOpen}
      />
    </TableLayout>
  );
};

export default CategoryScreen;
