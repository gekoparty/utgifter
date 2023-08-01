import React, { useContext, useState, useMemo, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import CloseIcon from "@mui/icons-material/Close";
import useCustomHttp from "../hooks/useHttp";
import useSnackBar from "../hooks/useSnackBar";
import EditCategoryDialog from "../components/Categories/CategoryDialogs/EditCategoryDialog";
import AddCategoryDialog from "../components/Categories/CategoryDialogs/AddCategoryDialog";
import DeleteCategoryDialog from "../components/Categories/CategoryDialogs/DeleteCategoryDialog";
import { StoreContext } from "../Store/Store";

const tableHeaders = ["Name", "Delete", "Edit"];

const CategoryScreen = () => {
  const {
    loading,
    error,
    data: categoriesData,
  } = useCustomHttp("/api/categories");
  const { state, dispatch } = useContext(StoreContext);
  const { categories } = state;
  const [selectedCategory, setSelectedCategory] = useState({});
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const memoizedTableHeaders = useMemo(() => tableHeaders, []);

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update kategori");
  };

  const editSuccessHandler = (updatedCategory) => {
    showSuccessSnackbar(`Sted "${updatedCategory.name}" updated successfully`);
  };

  const deleteSuccessHandler = (deletedCategory) => {
    showSuccessSnackbar(`Sted "${deletedCategory.name}" deleted successfully`);
  };

  const deleteFailureHandler = (failedCategory) => {
    showErrorSnackbar(`Failed to delete sted "${failedCategory.name}"`);
  };

  const addCategoryHandler = (newCategory) => {
    showSuccessSnackbar(`Sted "${newCategory.name}" added successfully`);
  };

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  useEffect(() => {
    if (categoriesData) {
      dispatch({
        type: "FETCH_SUCCESS",
        resource: "categories",
        payload: categoriesData,
      });
    }
  }, [categoriesData, dispatch]);

  if (error && error.categories) {
    console.log(error.categories);
    return <div>Error: {error.categories}</div>;
  }

  if (loading || categories === null) {
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

  console.log(state)

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
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
          <CustomTable
            data={categories}
            headers={memoizedTableHeaders}
            onDelete={(category) => {
              setSelectedCategory(category);
              setDeleteModalOpen(true);
            }}
            onEdit={(category) => {
              setSelectedCategory(category);
              setEditModalOpen(true);
            }}
          />
        </Box>
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

      <AddCategoryDialog
        onClose={() => setAddCategoryDialogOpen(false)}
        onAdd={addCategoryHandler}
        open={addCategoryDialogOpen}
      />
    </TableLayout>
  );
};

export default CategoryScreen;
