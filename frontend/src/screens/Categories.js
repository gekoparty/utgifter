import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Grid,
  Snackbar,
  SnackbarContent,
  Paper,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { grey } from "@mui/material/colors";
import BasicDialog from "../components/commons/BasicDialog/BasicDialog";

const Categories = ({ drawerWidth = 240 }) => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleFetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories"); // Replace with your backend API endpoint
      setCategories(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post("/api/categories", {
        name: categoryName,
      });
      handleSnackbarOpen(`${response.data.name} lagt til`, "success");
      // reset the category name input field
      setCategoryName("");
      handleFetchCategories();
    } catch (error) {
      console.error("Error creating new category:", error);
      handleSnackbarOpen("Klarte ikke å legge til ny kategori", "error");
    }
  };

  const handleCategoryNameChange = (event) => {
    setCategoryName(event.target.value);
  };

  const handleSnackbarOpen = (message, severity) => {
    setSnackbarOpen(true);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleEditCategory = (category) => {
    // Implement the logic for editing a category
    console.log("Editing category:", category);
  };

  const handleDeleteCategory = async (categoryId) => {
    try {
      await axios.delete(`/api/categories/${categoryId}`);
      handleFetchCategories();
      handleSnackbarOpen("Kategorien ble slettet", "success");
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting category:", error);
      handleSnackbarOpen("Klarte ikke å slette kategorien", "error");
    }
  };

  const content = () => {
    return (
      <>
        <Typography component="p">
          Er du sikker på at du vil slette denne kategorien, utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedCategory?.name}"
          </Typography>{" "}
          vil også påvirkes
        </Typography>
      </>
    );
  };

  useEffect(() => {
    handleFetchCategories();
  }, []);

  return (
    <Box
      sx={{
        flexGrow: 1,
        marginLeft: `${drawerWidth}px`,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "100%", maxWidth: "800px" }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Grid container spacing={1} alignItems="center">
              <Grid item>
                <Button
                  sx={{ p: "7px" }}
                  size="medium"
                  variant="contained"
                  type="submit"
                >
                  Ny Kategori
                </Button>
              </Grid>
              <Grid item>
                <TextField
                  fullWidth
                  label="Kategori"
                  size="small"
                  color="secondary"
                  value={categoryName}
                  onChange={handleCategoryNameChange}
                />
              </Grid>
            </Grid>
          </Box>
        </form>

        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
            <TableContainer component={Paper} sx={{ width: "100%" }}>
              {categories.length > 0 ? (
                <Table size="small" aria-label="a dense table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="center">
                        <Typography variant="h6">Kategorier</Typography>
                      </TableCell>
                      <TableCell sx={{ width: "50px" }} align="center">
                        <Typography variant="h6">Slett</Typography>
                      </TableCell>
                      <TableCell sx={{ width: "50px" }} align="center">
                        <Typography variant="h6">Rediger</Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {categories.map((category, index) => (
                      <TableRow
                        key={category._id}
                        sx={{
                          backgroundColor:
                            index % 2 === 0 ? grey[300] : "white",
                        }}
                      >
                        <TableCell>{category.name}</TableCell>
                        <TableCell>
                          <IconButton
                            aria-label="delete"
                            size="medium"
                            onClick={() => {
                              console.log("category._id:", category._id);
                              setSelectedCategory(category);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <DeleteIcon
                              sx={{ fontSize: "inherit" }}
                              color="success"
                            />
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            aria-label="edit"
                            color="secondary"
                            size="medium"
                            onClick={() => handleEditCategory(category)}
                          >
                            <EditIcon sx={{ fontSize: "inherit" }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div>Ingen Kategorier funnet</div>
              )}
            </TableContainer>
          </Box>
          <BasicDialog
            open={deleteModalOpen}
            onClose={() => setDeleteModalOpen(false)}
            cancelButtonText="Avbryt"
            confirmButtonText="Slett"
            dialogTitle="Bekreft Sletting"
            cancelButton={
              <Button onClick={() => setDeleteModalOpen(false)}>Avbryt</Button>
            }
            confirmButton={
              <Button
                onClick={() => handleDeleteCategory(selectedCategory?._id)}
              >
                Slett
              </Button>
            }
          >
            {content()}
          </BasicDialog>
        </Box>
      </Box>
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
    </Box>
  );
};

export default Categories;
