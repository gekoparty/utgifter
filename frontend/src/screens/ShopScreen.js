import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
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
const AddShopDialog = lazy(() =>
  import("../components/Shops/ShopDialogs/AddShopDialog")
);
const DeleteShopDialog = lazy(() =>
  import("../components/Shops/ShopDialogs/DeleteShopDialog")
);
const EditShopDialog = lazy(() =>
  import("../components/Shops/ShopDialogs/EditShopDialog")
);

// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 10,
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

  // Memoized values and theme for styling
  const theme = useTheme();
  const memoizedSelectedShop = useMemo(() => selectedShop, [selectedShop]);

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

  // Snackbar state and handlers for feedback messages
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Table columns configuration
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Butikk",
        size: 300,
        grow: 2,
        minSize: 150,
        maxSize: 400,
      },
      {
        accessorKey: "location",
        header: "Lokasjon",
        size: 300,
        grow: 1,
        minSize: 150,
        maxSize: 300,
      },
      {
        accessorKey: "category",
        header: "Kategori",
        size: 300,
        grow: 1,
        minSize: 100,
        maxSize: 250,
      },
    ],
    []
  );

  // --- COMMON FUNCTIONS FOR FETCHING & PREFETCHING ---

  // Build the fetch URL using current table state.

  const buildFetchURL = (pageIndex, pageSize, sorting, columnFilters, globalFilter) => {
    const fetchURL = new URL("/api/shops", API_URL);
    fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
    fetchURL.searchParams.set("size", `${pageSize}`);
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
  

// Modify the filters (if needed)
const modifiedFilters = columnFilters.map((filter) => {
  if (filter.id === "location" || filter.id === "category") {
    return { id: filter.id, value: "" };
  }
  return filter;
});
fetchURL.searchParams.set("columnFilters", JSON.stringify(modifiedFilters ?? []));
fetchURL.searchParams.set("globalFilter", globalFilter ?? "");

return fetchURL;
};

   // Fetch the shop data and then, for each shop, fetch associated location and category data.
   const fetchData = async () => {
    const fetchURL = buildFetchURL(
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter
    );
    const response = await fetch(fetchURL.href);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText} (${response.status})`);
    }
    const json = await response.json();
    const { meta } = json;

    // Fetch the associated location and category data for each shop
    const shopsWithAssociatedData = await Promise.all(
      json.shops.map(async (shop) => {
        const locationResponse = await fetch(`/api/locations/${shop.location}`);
        const locationData = await locationResponse.json();
        const categoryResponse = await fetch(`/api/categories/${shop.category}`);
        const categoryData = await categoryResponse.json();

        return {
          ...shop,
          location: locationData, // keep as object
          category: categoryData,
        };
      })
    );

     // Transform the data for the table
     const transformedData = shopsWithAssociatedData.map((shop) => ({
      _id: shop._id,
      name: shop.name,
      location: shop.location ? shop.location.name : "N/A",
      category: shop.category ? shop.category.name : "N/A",
    }));

    return { shops: transformedData, meta };
  };


  // Prefetch function for preloading the next page
  const prefetchPageData = async (nextPageIndex) => {
    const fetchURL = buildFetchURL(
      nextPageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter
    );
    await queryClient.prefetchQuery(
      [
        "shops",
        columnFilters,
        globalFilter,
        nextPageIndex,
        pagination.pageSize,
        sorting,
      ],
      async () => {
        const response = await fetch(fetchURL.href);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText} (${response.status})`);
        }
        const json = await response.json();
        const { meta } = json;

        // As before, fetch associated data
        const shopsWithAssociatedData = await Promise.all(
          json.shops.map(async (shop) => {
            const locationResponse = await fetch(`/api/locations/${shop.location}`);
            const locationData = await locationResponse.json();
            const categoryResponse = await fetch(`/api/categories/${shop.category}`);
            const categoryData = await categoryResponse.json();
            return {
              ...shop,
              location: locationData,
              category: categoryData,
            };
          })
        );
        const transformedData = shopsWithAssociatedData.map((shop) => ({
          _id: shop._id,
          name: shop.name,
          location: shop.location ? shop.location.name : "N/A",
          category: shop.category ? shop.category.name : "N/A",
        }));
        return { shops: transformedData, meta };
      }
    );
  };

  // Trigger a prefetch for the next page
  const handlePrefetch = (nextPageIndex) => {
    prefetchPageData(nextPageIndex);
  };

   // --- REACT QUERY HOOK ---
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


  // Ensure default sorting when sorting state is empty
  useEffect(() => {
    if (sorting.length === 0) setSorting(INITIAL_SORTING);
  }, [sorting]);

   // Prefetch next page whenever the pagination or filters/sorting change
   useEffect(() => {
    const nextPageIndex = pagination.pageIndex + 1;
    console.log(
      "Current page:",
      pagination.pageIndex,
      "Prefetching data for page:",
      nextPageIndex
    );
    prefetchPageData(nextPageIndex);
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
    queryClient,
  ]);

  // Handlers for product actions (Add, Edit, Delete)
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

      {/* Product Table */}
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

      {/* Modals */}
      <Suspense fallback={<div>Laster Dialog...</div>}>
        <AddShopDialog
          onClose={() => setAddShopDialogOpen(false)}
          //locations={locationsData}
          //categories={categoriesData}
          open={addShopDialogOpen}
          onAdd={addShopHandler}
        ></AddShopDialog>
      </Suspense>
      <Suspense fallback={<div>Laster...</div>}>
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
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {memoizedSelectedShop._id && editModalOpen && (
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
        )}
      </Suspense>

      {/* Snackbar for feedback messages */}
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
    </TableLayout>
  );
};

export default ShopScreen;
