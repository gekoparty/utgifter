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
import AddBrandDialog from "../components/Brands/BrandDialogs/AddBrandDialog";
import DeleteBrandDialog from "../components/Brands/BrandDialogs/DeleteBrandDialog";
import EditBrandDialog from "../components/Brands/BrandDialogs/EditBrandDialog";

import useCustomHttp from "../hooks/useHttp";
import useSnackBar from "../hooks/useSnackBar";
import { StoreContext } from "../Store/Store";

const tableHeaders = ["Name", "Location", "Category", "Delete", "Edit"];

const ShopScreen = () => {
  const { loading, error, data: shopsData } = useCustomHttp("/api/shops");
  const { state, dispatch } = useContext(StoreContext);
  const { shops } = state;

  const [selectedBrand, setSelectedBrand] = useState({});
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
          setSelectedBrand(shop);
          setDeleteModalOpen(true);
        }}
        onEdit={(shop) => {
          setSelectedBrand(shop);
          setEditModalOpen(true);
        }}
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
    </TableLayout>
  );
};

export default ShopScreen;
