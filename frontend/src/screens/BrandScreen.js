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
  
  const BrandScreen = ({ drawerWidth = 240 }) => {
    const [brands, setBrands] = useState([]);
    const [brandName, setBrandName] = useState("");
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");
    const [snackbarSeverity, setSnackbarSeverity] = useState("success");
    const [selectedBrand, setSelectedBrand] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
    const handleFetchBrands= async () => {
      try {
        const response = await axios.get("/api/brands"); // Replace with your backend API endpoint
        setBrands(response.data);
      } catch (error) {
        console.error(error);
      }
    };
  
    const handleSubmit = async (event) => {
      event.preventDefault();
      try {
        const response = await axios.post("/api/brands", {
          name: brandName,
        });
        handleSnackbarOpen(`${response.data.name} lagt til`, "success");
        // reset the category name input field
        setBrandName("");
        handleFetchBrands();
      } catch (error) {
        console.error("Error creating new category:", error);
        handleSnackbarOpen("Klarte ikke å legge til nytt merke", "error");
      }
    };
  
    const handleBrandNameChange = (event) => {
      setBrandName(event.target.value);
    };
  
    const handleSnackbarOpen = (message, severity) => {
      setSnackbarOpen(true);
      setSnackbarMessage(message);
      setSnackbarSeverity(severity);
    };
  
    const handleSnackbarClose = () => {
      setSnackbarOpen(false);
    };
  
    const handleDeleteBrand = async (brandId) => {
      try {
        await axios.delete(`/api/brands/${brandId}`);
        handleFetchBrands();
        handleSnackbarOpen("Merket ble slettet", "success");
        setDeleteModalOpen(false);
      } catch (error) {
        console.error("Error deleting brand:", error);
        handleSnackbarOpen("Klarte ikke å slette merket", "error");
      }
    };
  
    const content = () => {
      return (
        <>
          <Typography component="p">
            Er du sikker på at du vil slette dette merket, utgifter tilhørende{" "}
            <Typography component="span" fontWeight="bold">
              "{selectedBrand?.name}"
            </Typography>{" "}
            vil også påvirkes
          </Typography>
        </>
      );
    };
  
    useEffect(() => {
      handleFetchBrands();
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
                    Nytt Merke
                  </Button>
                </Grid>
                <Grid item>
                  <TextField
                    fullWidth
                    label="Merke"
                    size="small"
                    color="secondary"
                    value={brandName}
                    onChange={handleBrandNameChange}
                  />
                </Grid>
              </Grid>
            </Box>
          </form>
  
          <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
              <TableContainer component={Paper} sx={{ width: "100%" }}>
                {brands.length > 0 ? (
                  <Table size="small" aria-label="a dense table">
                    <TableHead>
                      <TableRow>
                        <TableCell align="center">
                          <Typography variant="h6">Merker</Typography>
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
                      {brands.map((brand, index) => (
                        <TableRow
                          key={brand._id}
                          sx={{
                            backgroundColor:
                              index % 2 === 0 ? grey[300] : "white",
                          }}
                        >
                          <TableCell>{brand.name}</TableCell>
                          <TableCell>
                            <IconButton
                              aria-label="delete"
                              size="medium"
                              onClick={() => {
                                console.log("brand._id:", brand._id);
                                setSelectedBrand(brand);
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
                            >
                              <EditIcon sx={{ fontSize: "inherit" }} />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div>Ingen Merker funnet</div>
                )}
              </TableContainer>
            </Box>
            <BasicDialog
              getContent={() => content()}
              open={deleteModalOpen}
              onClose={() => setDeleteModalOpen(false)}
              confirmButtonText="Bekreft Sletting"
              cancelButtonText="Kanseler"
              dialogTitle="Bekreft Sletting"
              cancelButton={
                <Button onClick={() => setDeleteModalOpen(false)}>Avbryt</Button>
              }
              confirmButton={
                <Button
                  onClick={() => handleDeleteBrand(selectedBrand?._id)}
                >
                  Slett
                </Button>
              }
            />
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
  
  export default BrandScreen;