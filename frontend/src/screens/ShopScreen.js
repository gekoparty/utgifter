import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import React, { useState, useEffect, useContext } from "react";

import BasicDialog from "../components/commons/BasicDialog/BasicDialog";
import CustomTable from "../components/commons/CustomTable/CustomTable";

import AddShopForm from "../components/AddShopForm/AddShopForm";
import DeleteShopDialog from "../components/commons/DeleteShopDialog/DeleteShopDialog";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import { StoreContext } from "../Store/Store";




const ShopScreen = ({id}) => {
  const { state: { data: shops, loading, error }, dispatch } = useContext(StoreContext);
 console.log(shops, "from shopscreen")
  
  
 
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

  

  const handleSnackbarOpen = (message, severity) => {
    setSnackbarOpen(true);
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };



   // Add useEffect to refetch the shop data when a deletion occurs
  /*  useEffect(() => {
    const fetchShops = async () => {
      dispatch({ type: 'FETCH_SHOPS_REQUEST' });
  
      try {
        // Simulate API call
        const response = await new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: [
                { _id: '1', name: 'Shop 1', location: 'Location 1', category: 'Category 1' },
                { _id: '2', name: 'Shop 2', location: 'Location 2', category: 'Category 2' },
                { _id: '3', name: 'Shop 3', location: 'Location 3', category: 'Category 3' },
              ],
            });
          }, 2000);
        });
  
        dispatch({ type: 'FETCH_SHOPS_SUCCESS', payload: response.data });
      } catch (error) {
        dispatch({ type: 'FETCH_SHOPS_FAILURE', payload: error });
      }
    };
  
    if (!loading) {
      fetchShops();
    }
  }, [dispatch, loading]); */

  


  /* const handleAddShop = async () => {
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
    } catch (error) {
      console.error("Error creating new shop:", error);
      handleSnackbarOpen("Failed to add new shop", "error");
    }
  }; */

  const handleDeleteShop = () => {
    console.log("deleting")
  }

  
  const tableHeaders = ["Name", "Location", "Category", "Delete", "Edit"];

  if (loading || shops === null) {
    return <div>Loading...</div>;
  }

  return (
    
    <TableLayout>
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
        <CustomTable
            data={shops}
            headers={tableHeaders}
            onDelete={handleDeleteShop}
          />   
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
              }}
            > 
              Cancel
            </Button>
          }
          confirmButton={<Button onClick={""}>Save</Button>}
        > 
          <AddShopForm onSubmit={""} />
        </BasicDialog> 
        {/* <DeleteShopDialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          shop={selectedShop ? selectedShop : null}
          onDelete={() => {
            handleSnackbarOpen("Butikk ble slettet", "success");
            setDeleteModalOpen(false);
            
          }}
          
        /> */}
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
    </TableLayout>
  );
};

export default ShopScreen;
