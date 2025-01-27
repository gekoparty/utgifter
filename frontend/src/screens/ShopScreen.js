import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";

import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useTheme } from "@mui/material/styles";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import AddShopDialog from "../components/Shops/ShopDialogs/AddShopDialog";
import DeleteShopDialog from "../components/Shops/ShopDialogs/DeleteShopDialog";
import EditShopDialog from "../components/Shops/ShopDialogs/EditShopDialog";

// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 5,
};
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_SHOP = {
  _id: "",
  name: "",
};
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const ShopScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedShop, setSelectedShop] = useState(INITIAL_SELECTED_SHOP);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addShopDialogOpen, setAddShopDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const theme = useTheme();

  const tableColumns = useMemo(
    () => [
      { accessorKey: "name", header: "Butikk" }, // Use "Name" as the header for all resources
      { accessorKey: "location", header: "Lokasjon" }, // Example for location
      { accessorKey: "category", header: "Kategori" }, // Example for category
      // Other columns as needed
    ],
    []
  );

  // React Query
  const queryClient = useQueryClient();
  const queryKey = [
    "shops",
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ];

  // Define your query function
  const fetchData = async () => {
    const fetchURL = new URL("/api/shops", API_URL);

    fetchURL.searchParams.set(
      "start",
      `${pagination.pageIndex * pagination.pageSize}`
    );
    fetchURL.searchParams.set("size", `${pagination.pageSize}`);

    // Modify the filter values based on selectedLocationId and selectedCategoryId
    const modifiedFilters = columnFilters.map((filter) => {
      if (filter.id === "location") {
        return { id: "location", value: "" };
      } else if (filter.id === "category") {
        return { id: "category", value: "" };
      }
      return filter;
    });

    fetchURL.searchParams.set(
      "columnFilters",
      JSON.stringify(modifiedFilters ?? [])
    );
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));

    const response = await fetch(fetchURL.href);
    const json = await response.json();
    const { meta } = json;

    // Fetch the associated location and category data for each shop
    const shopsWithAssociatedData = await Promise.all(
      json.shops.map(async (shop) => {
        const locationResponse = await fetch(`/api/locations/${shop.location}`);
        const locationData = await locationResponse.json();

        const categoryResponse = await fetch(
          `/api/categories/${shop.category}`
        );
        const categoryData = await categoryResponse.json();

        return {
          ...shop,
          location: locationData, // Keep the location and category as objects
          category: categoryData,
        };
      })
    );

    // Transform the data for rendering in the table
    const transformedData = shopsWithAssociatedData.map((shop) => ({
      _id: shop._id,
      name: shop.name,
      location: shop.location ? shop.location.name : "N/A",
      category: shop.category ? shop.category.name : "N/A",
      // ... other columns if needed
    }));

    // Return the transformed data as part of the query result
    return { shops: transformedData, meta };
  };

  if (sorting.length === 0) {
    setSorting([{ id: "name", desc: false }]);
  }

  const {
    data: shopsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKey,
    queryFn: fetchData,
    keepPreviousData: true,
    refetchOnMount: true,
  });

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const addShopHandler = (newShop) => {
    showSuccessSnackbar(`Butikk ${newShop.name} er lagt til`);
    queryClient.invalidateQueries("shops");
    refetch();
  };

  const deleteFailureHandler = (failedShop) => {
    showErrorSnackbar(`Failed to delete shop ${failedShop.name}`);
  };

  const deleteSuccessHandler = (deletedShop) => {
    showSuccessSnackbar(`Shop ${deletedShop} deleted successfully`);

    queryClient.invalidateQueries("shops");
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update shop");
  };

  const editSuccessHandler = (selectedShop) => {
    showSuccessSnackbar(`Shop ${selectedShop.name} updated succesfully`);
    queryClient.invalidateQueries("shops");
    refetch();
  };

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
        {shopsData && (
          <ReactTable
            data={shopsData?.shops}
            columns={tableColumns}
            setColumnFilters={setColumnFilters}
            setGlobalFilter={setGlobalFilter}
            setSorting={setSorting}
            setPagination={setPagination}
            refetch={refetch}
            isError={isError}
            isFetching={isFetching}
            isLoading={isLoading}
            columnFilters={columnFilters}
            globalFilter={globalFilter}
            pagination={pagination}
            sorting={sorting}
            meta={shopsData?.meta}
            setSelectedShop={setSelectedShop}
            totalRowCount={shopsData?.meta?.totalRowCount}
            rowCount={shopsData?.meta?.totalRowCount ?? 0}
            handleEdit={(shop) => {
              setSelectedShop(shop);
              setEditModalOpen(true);
            }}
            handleDelete={(shop) => {
              setSelectedShop(shop);
              setDeleteModalOpen(true);
            }}
            editModalOpen={editModalOpen}
            setDeleteModalOpen={setDeleteModalOpen}
          />
        )}
      </Box>

      <DeleteShopDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        dialogTitle="Confirm Deletion"
        cancelButton={
          <Button onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
        }
        selectedShop={selectedShop}
        onDeleteSuccess={deleteSuccessHandler}
        onDeleteFailure={deleteFailureHandler}
      />

      <EditShopDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cancelButton={
          <Button onClick={() => setEditModalOpen(false)}>Cancel</Button>
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
            backgroundColor:
              snackbarSeverity === "success"
                ? theme.palette.success.main
                : snackbarSeverity === "error"
                ? theme.palette.error.main
                : theme.palette.info.main, // Default to info if no severity
            color: theme.palette.success.contrastText, // Use theme-based text contrast color
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
        //locations={locationsData}
        //categories={categoriesData}
        open={addShopDialogOpen}
        onAdd={addShopHandler}
      ></AddShopDialog>
    </TableLayout>
  );
};

export default ShopScreen;
