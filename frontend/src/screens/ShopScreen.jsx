import React, { useState, lazy, Suspense } from "react";
import { Button, Snackbar, Alert, IconButton, Box } from "@mui/material";
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
  // --- State Management ---
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  
  // Consolidated Dialog State
  const [selectedShop, setSelectedShop] = useState(INITIAL_SELECTED_SHOP);
  const [activeModal, setActiveModal] = useState(null); // 'ADD', 'EDIT', 'DELETE', or null

  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, handleSnackbarClose } = useSnackBar();

  // --- API Functions (Plain functions are stable in R19) ---
  
  const shopUrlBuilder = (endpoint, { pageIndex, pageSize, sorting, filters, globalFilter }) => {
    const url = new URL(endpoint, API_URL);
    url.searchParams.set("start", pageIndex * pageSize);
    url.searchParams.set("size", pageSize);
    url.searchParams.set("sorting", JSON.stringify(sorting ?? []));
    url.searchParams.set("columnFilters", JSON.stringify(filters ?? []));
    url.searchParams.set("globalFilter", globalFilter ?? "");
    return url;
  };

  const transformShopsData = async (json) => {
    const shops = json.shops || [];

    // 1. Collect all unique IDs for batch fetching
    const locationIds = [ ...new Set(shops.map((shop) => shop.location).filter(Boolean)) ];
    const categoryIds = [ ...new Set(shops.map((shop) => shop.category).filter(Boolean)) ];

    const fetchAndCreateMap = async (endpoint, ids) => {
      if (ids.length === 0) return {};
      try {
        const res = await fetch(`${API_URL}/api/${endpoint}?ids=${ids.join(",")}`);
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        const data = await res.json();
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
  };

  // --- Data Hook ---
  // No useMemo or useDeepCompareMemo needed for fetchParams object
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter,
  };

  const { data, isLoading, isFetching, isError, refetch } = usePaginatedData({
    endpoint: "/api/shops",
    params: fetchParams,
    urlBuilder: shopUrlBuilder,
    baseQueryKey: ["shops", "paginated"],
    transformFn: transformShopsData,
  });

  const tableData = data?.shops || [];
  const metaData = data?.meta || {};

  // --- Handlers (No useCallback needed in R19) ---
  
  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedShop(INITIAL_SELECTED_SHOP);
  };

  const handleEdit = (shop) => {
    setSelectedShop(shop);
    setActiveModal("EDIT");
  };

  const handleDelete = (shop) => {
    setSelectedShop(shop);
    setActiveModal("DELETE");
  };

  // Centralized Action Feedback
  const handleSuccess = (action, shopName) => {
    showSnackbar(`Butikk ${shopName} ${action}`);
    handleCloseDialog();
  };

  const handleError = (message) => {
    showSnackbar(message, "error");
  };

  // --- Table Configuration (No useMemo needed in R19) ---
  const tableColumns = [
    { accessorKey: "name", header: "Butikk" },
    { accessorKey: "location", header: "Lokasjon" },
    { accessorKey: "category", header: "Kategori" },
  ];

  // -------------------------
  // Render
  // -------------------------
  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => setActiveModal("ADD")}
        >
          Ny Butikk
        </Button>
      </Box>

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
        handleEdit={handleEdit}
        handleDelete={handleDelete}
      />

      {/* Dialogs - Grouped Suspense */}
      <Suspense fallback={null}>
        {activeModal === "ADD" && (
          <AddShopDialog
            open={true}
            onClose={handleCloseDialog}
            onAdd={(shop) => handleSuccess("lagt til", shop.name)}
          />
        )}

        {activeModal === "EDIT" && (
          <EditShopDialog
            open={true}
            onClose={handleCloseDialog}
            selectedShop={selectedShop}
            onUpdateSuccess={(shop) => handleSuccess("oppdatert", shop.name)}
            onUpdateFailure={() => handleError(`Kunne ikke oppdatere Butikk ${selectedShop.name}`)}
          />
        )}

        {activeModal === "DELETE" && (
          <DeleteShopDialog
            open={true}
            onClose={handleCloseDialog}
            selectedShop={selectedShop}
            dialogTitle="Bekreft Sletting"
            onDeleteSuccess={(shop) => handleSuccess("slettet", shop.name)}
            onDeleteFailure={() => handleError(`Kunne ikke slette Butikk ${selectedShop.name}`)}
          />
        )}
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
