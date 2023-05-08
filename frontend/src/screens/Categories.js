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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import React, { useState, useEffect } from "react";
import Paper from "@mui/material/Paper";
import axios from "axios";

const Categories = ({ drawerWidth = 240 }) => {
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState("");

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
    console.log(categoryName)
    try {
      const response = await axios.post("/api/categories", {
        name: categoryName,
      });
      console.log("New category created:", response.data);
      // reset the category name input field
      setCategoryName("");
    } catch (error) {
      console.error("Error creating new category:", error);
    }
  };

  const handleCategoryNameChange = (event) => {
    setCategoryName(event.target.value);
  };

  useEffect(() => {
    handleFetchCategories();
  }, [categories]);

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
                  onClick={handleSubmit}
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
          <Box sx={{ width: "100%", minWidth: "500px" }}>
            <TableContainer component={Paper} sx={{ width: "100%" }}>
              {categories.length > 0 ? (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Navn</TableCell>
                      <TableCell>Beskrivelse</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category) => (
                      <TableRow key={category._id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell
                          sx={{
                            display: "flex",
                            justifyContent: "space-evenly",
                          }}
                        >
                          <IconButton aria-label="delete" size="medium">
                            <DeleteIcon
                              sx={{ fontSize: "inherit" }}
                              color="success"
                            />
                          </IconButton>
                          <IconButton
                            aria-label="edit"
                            color="secondary"
                            size="medium"
                          >
                            <EditIcon sx={{ fontSize: "inherit" }} />
                          </IconButton>
                          <IconButton
                            aria-label="inspect"
                            color="success"
                            size="small"
                          >
                            <ZoomInIcon sx={{ fontSize: "inherit" }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div>No categories found</div>
              )}
            </TableContainer>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Categories;
