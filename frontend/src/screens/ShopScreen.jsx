import React, { useState, lazy, Suspense } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert,
  LinearProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// ------------------------------------------------------
// Lazy-loaded consolidated dialog (ADD / EDIT / DELETE)
// ------------------------------------------------------
const loadShopDialog = () =>
  import("../components/features/Shops/ShopDialogs/ShopDialog");
const ShopDialog = lazy(loadShopDialog);

// ------------------------------------------------------
// Constants
// ------------------------------------------------------
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];

const INITIAL_SELECTED_SHOP = {
  _id: "",
  name: "",
  location: "",
  category: "",
  locationName: "",
  categoryName: "",
};

const SHOPS_QUERY_KEY = ["shops", "paginated"];

const tableColumns = [
  { accessorKey: "name", header: "Butikk" },
  { accessorKey: "locationName", header: "Lokasjon" },
  { accessorKey: "categoryName", header: "Kategori" },
];

// ------------------------------------------------------
// URL builder
// ------------------------------------------------------
const shopUrlBuilder = (endpoint, params) => {
  const url = new URL(endpoint, API_URL);
  url.searchParams.set("start", params.pageIndex * params.pageSize);
  url.searchParams.set("size", params.pageSize);
  url.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  url.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  url.searchParams.set("globalFilter", params.globalFilter ?? "");
  return url;
};

const ShopScreen = () => {
  // ------------------------------------------------------
  // Table State
  // ------------------------------------------------------
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  // ------------------------------------------------------
  // Dialog State
  // ------------------------------------------------------
  const [activeModal, setActiveModal] = useState(null); // ADD | EDIT | DELETE | null
  const [selectedShop, setSelectedShop] = useState(INITIAL_SELECTED_SHOP);

  // ------------------------------------------------------
  // Snackbar
  // ------------------------------------------------------
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // ------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter,
  };

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
    baseQueryKey: SHOPS_QUERY_KEY,
  });

  const tableData = shopsData?.shops ?? [];
  const metaData = shopsData?.meta ?? {};

  // ------------------------------------------------------
  // Dialog handlers
  // ------------------------------------------------------
  const handleCloseDialog = () => {
    setActiveModal(null);
    setSelectedShop(INITIAL_SELECTED_SHOP);
  };

  const handleEdit = (shop) => {
    loadShopDialog();
    setSelectedShop(shop);
    setActiveModal("EDIT");
  };

  const handleDelete = (shop) => {
    loadShopDialog();
    setSelectedShop(shop);
    setActiveModal("DELETE");
  };

  // ------------------------------------------------------
  // Feedback helpers
  // ------------------------------------------------------
  const handleSuccess = (action, shopName) => {
    showSnackbar(`Butikk "${shopName}" ble ${action}`);
    handleCloseDialog();
  };

  const handleError = (action) => {
    showSnackbar(`Kunne ikke ${action}`, "error");
  };

  // ------------------------------------------------------
  // Render
  // ------------------------------------------------------
  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          onMouseEnter={loadShopDialog}
          onFocus={loadShopDialog}
          variant="contained"
          onClick={() => setActiveModal("ADD")}
        >
          Ny Butikk
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: "auto" }} />
          Laster butikker...
        </Box>
      ) : (
        <ReactTable
          data={tableData}
          columns={tableColumns}
          meta={metaData}
          isError={isError}
          isFetching={isFetching}
          isLoading={isLoading}
          refetch={refetch}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          sorting={sorting}
          pagination={pagination}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />
      )}

      <Suspense fallback={null}>
        {activeModal && (
          <ShopDialog
            open
            mode={activeModal}
            shopToEdit={selectedShop}
            onClose={handleCloseDialog}
            onSuccess={(shop) => {
              const action =
                activeModal === "DELETE"
                  ? "slettet"
                  : activeModal === "EDIT"
                  ? "oppdatert"
                  : "lagt til";

              handleSuccess(action, shop?.name ?? selectedShop?.name ?? "");
            }}
            onError={() => handleError("utføre handling")}
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

