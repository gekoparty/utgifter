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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from '@mui/icons-material/Edit';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import React, { useState } from "react";
import Paper from "@mui/material/Paper";
import axios from "axios";

const Categories = ({ drawerWidth = 240 }) => {
  const [categories, setCategories] = useState([]);
  console.log("Categories component rendered");
  console.log(drawerWidth);

  const handleFetchCategories = async () => {
    try {
      const response = await axios.get("/api/categories"); // Replace with your backend API endpoint
      setCategories(response.data);
      console.log(response.data);
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
      <Box>
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
                        <TableCell sx={{display: "flex", justifyContent: "space-evenly"}}>
                          <IconButton aria-label="delete" size="medium">
                            <DeleteIcon sx={{fontSize: "inherit"}} color="success"/>
                          </IconButton>
                          <IconButton aria-label="edit" color="secondary" size="medium">
                            <EditIcon sx={{fontSize: "inherit"}}/>
                          </IconButton>
                          <IconButton aria-label="inspect" color="success" size="small">
                            <ZoomInIcon sx={{fontSize: "inherit"}}/>
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
  );
};

export default Categories;
