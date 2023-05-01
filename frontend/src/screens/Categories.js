import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import axios from "axios";

const Categories = ({ drawerWidth = 240 }) => {
  const [categories, setCategories] = useState([{}]);
  console.log("Categories component rendered");
  console.log(drawerWidth);

  const handleFetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories"); // Replace with your backend API endpoint
      setCategories(response.data);
      console.log(response.data)
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        marginLeft: `${drawerWidth}px`,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ width: "fit-content" }}>
        <Paper elevation={0}>
          <Box sx={{ width: "fit-content", display: "flex", gap: "100px" }}>
            <Button variant="contained">Ny Kategori</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleFetchCategories}
            >
              Hent Kategorier
            </Button>
          </Box>
        </Paper>
      
      <Box sx={{ marginTop: "100px" }}>
      <TableContainer component={Paper} sx={{ width: "100%" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Navn</TableCell>
                <TableCell>Beskrivelse</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.category}</TableCell>
                  <TableCell>{category.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
    </Box>
  );
};

export default Categories;
