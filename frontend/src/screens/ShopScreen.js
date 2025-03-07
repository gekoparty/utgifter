import React, { useState, useMemo, lazy, Suspense } from "react";
import { Box, Button, IconButton, Snackbar, Alert } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useQueryClient } from "@tanstack/react-query";
import { usePaginatedData } from "../hooks/usePaginatedData";

// Lazy-loaded Dialogs
const AddShopDialog = lazy(() =>
  import("../components/features/Shops/ShopDialogs/AddShop/AddShopDialog")
);
const DeleteShopDialog = lazy(() =>
  import("../components/features/Shops/ShopDialogs/DeleteShop/DeleteShopDialog")
);
const EditShopDialog = lazy(() =>
  import("../components/features/Shops/ShopDialogs/EditShop/EditShopDialog")
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

  const queryClient = useQueryClient();
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const baseQueryKey = useMemo(() => ["shops", "paginated"], []);

  const memoizedSelectedShop = useMemo(() => selectedShop, [selectedShop]);

  // Custom URL builder for shops. It sends "columnFilters" and
  // modifies filters for "location" or "category" as needed.
  const shopUrlBuilder = (
    endpoint,
    { pageIndex, pageSize, sorting, filters, globalFilter }
  ) => {
    const fetchURL = new URL(endpoint, API_URL);
    fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
    fetchURL.searchParams.set("size", `${pageSize}`);
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
    // Modify filters for location/category if needed.
    const modifiedFilters = filters.map((filter) => {
      if (filter.id === "location" || filter.id === "category") {
        return { id: filter.id, value: "" };
      }
      return filter;
    });
    fetchURL.searchParams.set(
      "columnFilters",
      JSON.stringify(modifiedFilters ?? [])
    );
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
    return fetchURL;
  };

  // CORRECTED: Transform function with proper error handling
  const transformShopsData = async (json, signal) => {
    try {
      const { meta } = json;
      const shopsWithAssociatedData = await Promise.all(
        json.shops.map(async (shop) => {
          try {
            const [locationResponse, categoryResponse] = await Promise.all([
              fetch(`/api/locations/${shop.location}`, { signal }),
              fetch(`/api/categories/${shop.category}`, { signal }),
            ]);

            const locationData = locationResponse.ok
              ? await locationResponse.json()
              : { name: "N/A" };

            const categoryData = categoryResponse.ok
              ? await categoryResponse.json()
              : { name: "N/A" };

            return {
              ...shop,
              location: locationData,
              category: categoryData,
            };
          } catch (error) {
            console.error("Error fetching associated data:", error);
            return {
              ...shop,
              location: { name: "N/A" },
              category: { name: "N/A" },
            };
          }
        })
      );

      return {
        shops: shopsWithAssociatedData.map((shop) => ({
          _id: shop._id,
          name: shop.name,
          location: shop.location?.name || "N/A",
          category: shop.category?.name || "N/A",
        })),
        meta,
      };
    } catch (error) {
      console.error("Error transforming shops data:", error);
      return { shops: [], meta: {} };
    }
  };

  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter,
    }),
    [pagination, sorting, columnFilters, globalFilter]
  );

  // Use the generic hook to fetch shop data.
  const {
    data: shopsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/shops",
    params: fetchParams,
    urlBuilder: shopUrlBuilder,
    baseQueryKey,
    transformFn: transformShopsData,
  });

  const tableData = useMemo(() => shopsData?.shops || [], [shopsData]);
  const metaData = useMemo(() => shopsData?.meta || {}, [shopsData]);

  // Table columns configuration.
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Butikk",
        size: 150,
        grow: 2,
        minSize: 150,
        maxSize: 400,
      },
      {
        accessorKey: "location",
        header: "Lokasjon",
        size: 150,
        grow: 1,
        minSize: 150,
        maxSize: 300,
      },
      {
        accessorKey: "category",
        header: "Kategori",
        size: 100,
        grow: 1,
        minSize: 100,
        maxSize: 250,
      },
    ],
    []
  );

  // Handlers for shop actions.
  const addShopHandler = (newShop) => {
    showSnackbar(`Butikk ${newShop.name} er lagt til`);
    queryClient.invalidateQueries({
      queryKey: baseQueryKey,
      refetchType: "active",
    });
  };

  const deleteFailureHandler = (failedShop) => {
    showSnackbar(`Failed to delete shop ${failedShop.name}`);
  };

  const deleteSuccessHandler = (deletedShop) => {
    showSnackbar(`Shop ${deletedShop.name} deleted successfully`);
    queryClient.invalidateQueries({
      queryKey: baseQueryKey,
      refetchType: "active",
    });
  };

  const editFailureHandler = () => {
    showSnackbar("Failed to update shop");
  };

  const editSuccessHandler = (updatedShop) => {
    showSnackbar(`Shop ${updatedShop.name} updated successfully`);
    queryClient.invalidateQueries({
      queryKey: baseQueryKey,
      refetchType: "active",
    });
  };

  return (
    <TableLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          width: "100%",
          minHeight: "100%",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddShopDialogOpen(true)}
          >
            Ny Butikk
          </Button>
        </Box>

        <Box
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 600,
          }}
        >
          {tableData && (
            <ReactTable
              data={tableData}
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
              meta={metaData}
              setSelectedShop={setSelectedShop}
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
              sx={{ flexGrow: 1, width: "100%" }}
            />
          )}
        </Box>
      </Box>

      <Suspense fallback={<div>Laster Dialog...</div>}>
        <AddShopDialog
          open={addShopDialogOpen}
          onClose={() => setAddShopDialogOpen(false)}
          onAdd={addShopHandler}
        />
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
            dialogTitle="Edit Shop"
            selectedShop={selectedShop}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={editFailureHandler}
          />
        )}
      </Suspense>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        sx={{
          width: "auto", // <-- Change this from 100% to auto
          maxWidth: 400, // <-- Optional: Limit the maximum width
        }}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          variant="filled" // Add variant for better visual consistency
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
          sx={{
            width: "100%",
            "& .MuiAlert-message": { flexGrow: 1 }, // Ensure proper message alignment
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default ShopScreen;
