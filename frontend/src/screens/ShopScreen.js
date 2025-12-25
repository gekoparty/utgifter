import React, { useState, useMemo, lazy, Suspense, useCallback } from "react";
import { Button, Snackbar, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// Lazy-loaded dialogs
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
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_SHOP = { _id: "", name: "", location: "", category: "" };

const ShopScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedShop, setSelectedShop] = useState(INITIAL_SELECTED_SHOP);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const baseQueryKey = useMemo(() => ["shops", "paginated"], []);

  // -------------------------
  // URL builder
  // -------------------------
  const shopUrlBuilder = useCallback(
    (endpoint, { pageIndex, pageSize, sorting, filters, globalFilter }) => {
      const url = new URL(endpoint, API_URL);
      url.searchParams.set("start", pageIndex * pageSize);
      url.searchParams.set("size", pageSize);
      url.searchParams.set("sorting", JSON.stringify(sorting ?? []));
      url.searchParams.set("columnFilters", JSON.stringify(filters ?? []));
      url.searchParams.set("globalFilter", globalFilter ?? "");
      return url;
    },
    []
  );

  // -------------------------
  // Transform shops data with location/category
  // -------------------------
  // ---------------------------------------------
  const transformShopsData = useCallback(async (json) => {
    const shops = json.shops || [];

    // 1. Collect all unique IDs for batch fetching
    const locationIds = [
      ...new Set(shops.map((shop) => shop.location).filter(Boolean)),
    ];
    const categoryIds = [
      ...new Set(shops.map((shop) => shop.category).filter(Boolean)),
    ];

    // Helper to fetch and create ID -> Name map
    const fetchAndCreateMap = async (endpoint, ids) => {
      if (ids.length === 0) return {};
      try {
        // Assuming API supports fetching multiple IDs via 'ids' query parameter
        const res = await fetch(
          `${API_URL}/api/${endpoint}?ids=${ids.join(",")}`
        );
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        const data = await res.json();

        // Create lookup map: { '_id': 'name', ... }
        // We handle the case where the JSON might be an array or an object containing an array.
        const items = Array.isArray(data) ? data : data[endpoint] || [];

        return items.reduce((map, item) => {
          if (item._id && item.name) {
            map[item._id] = item.name;
          }
          return map;
        }, {});
      } catch (error) {
        console.error(`Batch fetch error for ${endpoint}:`, error);
        return {};
      }
    };

    // 2. Batch Fetch: Execute the two large requests in parallel
    const [locationMap, categoryMap] = await Promise.all([
      fetchAndCreateMap("locations", locationIds),
      fetchAndCreateMap("categories", categoryIds),
    ]);

    // 3. Transform shops using the maps
    const transformed = shops.map((shop) => ({
      _id: shop._id,
      name: shop.name,
      location: locationMap[shop.location] || "N/A",
      category: categoryMap[shop.category] || "N/A",
    }));

    return {
      shops: transformed,
      meta: json.meta || {},
    };
  }, []);

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

  const { data, isLoading, isFetching, isError, refetch } = usePaginatedData({
    endpoint: "/api/shops",
    params: fetchParams,
    urlBuilder: shopUrlBuilder,
    baseQueryKey,
    transformFn: transformShopsData,
  });

  const tableData = useMemo(() => data?.shops || [], [data]);
  const metaData = useMemo(() => data?.meta || {}, [data]);

  // -------------------------
  // Columns
  // -------------------------
  const tableColumns = useMemo(
    () => [
      { accessorKey: "name", header: "Butikk" },
      { accessorKey: "location", header: "Lokasjon" },
      { accessorKey: "category", header: "Kategori" },
    ],
    []
  );

  // -------------------------
  // Handlers
  // -------------------------
  const handleAddSuccess = useCallback(
    (shop) => {
      showSnackbar(`Butikk ${shop.name} lagt til`);
      setAddDialogOpen(false);
    },
    [showSnackbar]
  );

  const handleEditSuccess = useCallback(
    (shop) => {
      showSnackbar(`Butikk ${shop.name} oppdatert`);
      setEditDialogOpen(false);
    },
    [showSnackbar]
  );

  const handleDeleteSuccess = useCallback(
    (shop) => {
      showSnackbar(`Butikk ${shop.name} slettet`);
      setDeleteDialogOpen(false);
    },
    [showSnackbar]
  );

  const handleDialogClose = useCallback((setter) => {
    setter(false);
    setSelectedShop(INITIAL_SELECTED_SHOP);
  }, []);

  // -------------------------
  // Render
  // -------------------------
  return (
    <TableLayout>
      <Button
        variant="contained"
        onClick={() => setAddDialogOpen(true)}
        sx={{ mb: 2 }}
      >
        Ny Butikk
      </Button>

      <ReactTable
        data={tableData}
        columns={tableColumns}
        columnFilters={columnFilters}
        globalFilter={globalFilter}
        sorting={sorting}
        pagination={pagination}
        setColumnFilters={setColumnFilters}
        setGlobalFilter={setGlobalFilter}
        setSorting={setSorting}
        setPagination={setPagination}
        refetch={refetch}
        isError={isError}
        isLoading={isLoading}
        isFetching={isFetching}
        meta={metaData}
        handleEdit={(shop) => {
          setSelectedShop(shop);
          setEditDialogOpen(true);
        }}
        handleDelete={(shop) => {
          setSelectedShop(shop);
          setDeleteDialogOpen(true);
        }}
      />

      {/* Dialogs */}
      <Suspense fallback={<div>Laster...</div>}>
        <AddShopDialog
          open={addDialogOpen}
          onClose={() => handleDialogClose(setAddDialogOpen)}
          onAdd={handleAddSuccess}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <EditShopDialog
          open={editDialogOpen && selectedShop._id}
          onClose={() => handleDialogClose(setEditDialogOpen)}
          selectedShop={selectedShop}
          onUpdateSuccess={handleEditSuccess}
          onUpdateFailure={() =>
            showSnackbar(
              `Kunne ikke oppdatere Butikk ${selectedShop.name}`,
              "error"
            )
          }
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteShopDialog
          open={deleteDialogOpen}
          onClose={() => handleDialogClose(setDeleteDialogOpen)}
          selectedShop={selectedShop}
          dialogTitle="Bekreft Sletting"
          onDeleteSuccess={handleDeleteSuccess}
          onDeleteFailure={() =>
            showSnackbar(
              `Kunne ikke slette Butikk ${selectedShop.name}`,
              "error"
            )
          }
        />
      </Suspense>

      {/* Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          variant="filled"
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default ShopScreen;
