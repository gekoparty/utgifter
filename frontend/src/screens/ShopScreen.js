import {
  Box,
  Button,
  IconButton,
  TextField,
  Snackbar,
  SnackbarContent,
  Typography,
  FormControl,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState, useEffect } from "react";
import axios from "axios";
import BasicDialog from "../components/commons/BasicDialog/BasicDialog";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import useShops from './hooks/useShops';

const ShopScreen = ({ drawerWidth = 240 }) => {
  const [shops, setShops] = useState([]);
  const [shopName, setShopName] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [selectedShop, setSelectedShop] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addShopModalOpen, setAddShopModalOpen] = useState(false);
  const [newShopName, setNewShopName] = useState("");
  const [newShopLocation, setNewShopLocation] = useState("");
  const [newShopCategory, setNewShopCategory] = useState("");
 

  const handleFetchShops = async () => {
    try {
      const response = await axios.get("/api/shops"); // Replace with your backend API endpoint
      const fetchedShops = response.data.map((shop) => {
        console.log(shop); // Log the shop object to the console
        return {
          ...shop,
          _id: shop._id, // Assuming the shop ID is available in the 'id' property, adjust accordingly
        };
      });
      console.log(fetchedShops)
      setShops(fetchedShops);
    } catch (error) {
      console.error(error);
    }
  };

  const handleShopNameChange = (event) => {
    setShopName(event.target.value);
  };

  const handleSnackbarOpen = (message, severity) => {
    setSnackbarOpen(true);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleDeleteShop = async (shopId) => {
    try {
      await axios.delete(`/api/shops/${shopId}`);
      handleFetchShops();
      handleSnackbarOpen("Butikk ble slettet", "success");
      setDeleteModalOpen(false);
    } catch (error) {
      console.error("Error deleting shops:", error);
      handleSnackbarOpen("Klarte ikke å slette butikken", "error");
    }
  };

  const handleAddShop = async () => {
    console.log(newShopCategory, newShopLocation);
    try {
      const response = await axios.post("/api/shops", {
        name: newShopName,
        location: newShopLocation,
        category: newShopCategory,
      });
      handleSnackbarOpen(`${response.data.name} added`, "success");
      setAddShopModalOpen(false);
      setNewShopName("");
      setNewShopLocation("");
      setNewShopCategory("");
      handleFetchShops();
    } catch (error) {
      console.error("Error creating new shop:", error);
      handleSnackbarOpen("Failed to add new shop", "error");
    }
  };

  const content = () => {
    return (
      <>
        <Typography component="p">
          Er du sikker på at du vil slette denne butikken, utgifter tilhørende{" "}
          <Typography component="span" fontWeight="bold">
            "{selectedShop?.name}"
          </Typography>{" "}
          vil også påvirkes
        </Typography>
      </>
    );
  };

  useEffect(() => {
    handleFetchShops();
  }, []);

  const handleEdit = (itemId) => {
    // Handle edit action here
    console.log("Edit item:", itemId);
  };
  

  const tableHeaders = ["Name", "Location", "Category", "Delete", "Edit"];

  return (
    <Box
      sx={{
        flexGrow: 1,
        marginLeft: `${drawerWidth}px`,
        display: "flex",
        justifyContent: "center",
      }}
    >
      {/* Faded background overlay */}
      {addShopModalOpen && (
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.6)",
            zIndex: 999,
          }}
        />
      )}
      <Box sx={{ width: "100%", maxWidth: "800px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddShopModalOpen(true)}
          >
            Add Shop
          </Button>
        </Box>

        <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
          <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
          <CustomTable data={shops} headers={tableHeaders} onDelete={handleDeleteShop} onEdit={handleEdit} />;
          </Box>
          <BasicDialog
            open={addShopModalOpen}
            onClose={() => setAddShopModalOpen(false)}
            dialogTitle="Add Shop"
            cancelButtonText="Cancel"
            confirmButtonText="Save"
            cancelButton={
              <Button
                onClick={() => {
                  setAddShopModalOpen(false);
                  setNewShopName("");
                  setNewShopLocation("");
                  setNewShopCategory("");
                }}
              >
                Cancel
              </Button>
            }
            confirmButton={<Button onClick={handleAddShop}>Save</Button>}
          >
            <FormControl sx={{ width: 400 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  marginTop: 1,
                }}
              >
                <TextField
                  label="Shop Name"
                  value={newShopName}
                  onChange={(event) => setNewShopName(event.target.value)}
                />
                <TextField
                  label="Location"
                  value={newShopLocation}
                  onChange={(event) => setNewShopLocation(event.target.value)}
                />
                <TextField
                  label="Category"
                  value={newShopCategory}
                  onChange={(event) => setNewShopCategory(event.target.value)}
                />
              </Box>
            </FormControl>
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

export default ShopScreen;
