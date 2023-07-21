import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import TableLayout from "../components/commons/TableLayout/TableLayout";
import CustomTable from "../components/commons/CustomTable/CustomTable";
import useCustomHttp from "../hooks/useHttp";
import useSnackBar from "../hooks/useSnackBar";
import { StoreContext } from "../Store/Store";
import AddShopDialog from "../components/Shops/ShopDialogs/AddShopDialog";
import DeleteShopDialog from "../components/Shops/ShopDialogs/DeleteShopDialog";
import EditShopDialog from "../components/Shops/ShopDialogs/EditShopDialog";

const tableHeaders = ["Name", "Location", "Category", "Delete", "Edit"];

const ShopScreen = () => {
  const { loading, error, data: shopsData } = useCustomHttp("/api/shops");
  const { state, dispatch } = useContext(StoreContext);
  const { shops } = state;

  const [selectedShop, setSelectedShop] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addShopDialogOpen, setAddShopDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const memoizedTableHeaders = useMemo(() => tableHeaders, []);

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  useEffect(()=> {
    if(shopsData) {
      dispatch({
        type: "FETCH_SUCCESS",
        resource: "shops",
        payload: shopsData
      })
    }
  },[shopsData, dispatch])

  const addShopHandler = (newShop) => {
    showSuccessSnackbar(`Butikk ${newShop.name} er lagt til`)
  }

  const deleteFailureHandler = (failedShop) => {
    showErrorSnackbar(`Failed to delete shop ${failedShop.name}`)
  }

  const deleteSuccessHandler = (deletedShop) =>  {
    showSuccessSnackbar(`Shop ${deletedShop} deleted successfully` )
  }

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update shop")
  }

  const editSuccessHandler = (selectedShop) => {
    showSuccessSnackbar(`Shop ${selectedShop.name} updated succesfully`)
  }

  if(loading || shops === null) {
    return <div>Loading....</div>
  }

  return (
    <TableLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddShopDialogOpen(true)}
        >
          Ny Butikk
        </Button>
      </Box>

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}></Box>
      </Box>
      <CustomTable
        data={shops}
        headers={memoizedTableHeaders}
        onDelete={(shop) => {
          setSelectedShop(shop);
          setDeleteModalOpen(true);
        }}
        onEdit={(shop) => {
          setSelectedShop(shop);
          setEditModalOpen(true);
        }}
      />

      <DeleteShopDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        dialogTitle="Confirm Deletion"
        cancelButton={
          <Button onClick={()=> deleteModalOpen(false)}>Cancel</Button>
        }
        selectedShop={selectedShop}
        onDeleteSuccess={deleteSuccessHandler}
        onDeleteFailure={deleteFailureHandler}
       />

       <EditShopDialog
       open={editModalOpen}
       onClose={()=> setEditModalOpen(false)}
       cancelButton={
        <Button onClick={()=> setEditModalOpen(false)}>Cancel</Button>
       }
       dialogTitle={"Edit Shop"}
       selectedShop={selectedShop}
       onUpdateSuccess={editSuccessHandler}
       onUpdateFailure={editFailureHandler}

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
      <AddShopDialog
        onClose={() => setAddShopDialogOpen(false)}
        open={addShopDialogOpen}
        onAdd={addShopHandler}
      ></AddShopDialog>
    </TableLayout>
  );
};

export default ShopScreen;
