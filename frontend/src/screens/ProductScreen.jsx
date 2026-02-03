import React, {
  useState,
  lazy,
  Suspense,
  useMemo,
  useCallback,
  startTransition,
} from "react";
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
import ChipsOverflow from "./CellUtils/ChipsOverflow";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

const loadProductDialog = () =>
  import("../components/features/Products/ProductDialogs/ProductDialog");
const ProductDialog = lazy(loadProductDialog);

const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };

const productUrlBuilder = (endpoint, params) => {
  const fetchURL = new URL(endpoint, API_URL);
  fetchURL.searchParams.set("start", `${params.pageIndex * params.pageSize}`);
  fetchURL.searchParams.set("size", `${params.pageSize}`);
  fetchURL.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  fetchURL.searchParams.set(
    "columnFilters",
    JSON.stringify(params.filters ?? []),
  );
  fetchURL.searchParams.set("globalFilter", params.globalFilter ?? "");
  return fetchURL;
};

const ProductScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  const [selectedProduct, setSelectedProduct] = useState(
    INITIAL_SELECTED_PRODUCT,
  );
  const [activeModal, setActiveModal] = useState(null);

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter,
    ],
  );

  const {
    data: productsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/products",
    params: fetchParams,
    urlBuilder: productUrlBuilder,
    baseQueryKey: ["products", "paginated"],
  });

  const tableData = useMemo(
    () => productsData?.products ?? [],
    [productsData?.products],
  );
  const metaData = useMemo(
    () => productsData?.meta ?? {},
    [productsData?.meta],
  );

  const openModal = useCallback((mode, product = INITIAL_SELECTED_PRODUCT) => {
    startTransition(() => {
      setSelectedProduct(product);
      setActiveModal(mode);
    });
  }, []);

  const handleCloseDialog = useCallback(() => {
    setActiveModal(null);
    setSelectedProduct(INITIAL_SELECTED_PRODUCT);
  }, []);

  const tableColumns = useMemo(
    () => [
      { accessorKey: "name", header: "Produkter" },
      { accessorKey: "brand", header: "Merker" },
      {
        accessorKey: "variants",
        header: "Varianter",
        Cell: ({ cell }) => (
          <ChipsOverflow
            items={Array.isArray(cell.getValue()) ? cell.getValue() : []}
            maxVisible={3}
            popoverTitle="Varianter"
            tone="primary"
            getLabel={(x) => (typeof x === "object" ? x?.name : String(x))}
            getKey={(x) => (typeof x === "object" ? x?._id : String(x))}
          />
        ),
      },
      { accessorKey: "category", header: "Kategori" },
      {
        accessorKey: "expenseCount",
        header: "Brukt i utgifter",
        Cell: ({ cell }) => {
          const n = cell.getValue();
          return Number.isFinite(Number(n)) ? Number(n) : 0;
        },
      },
      {
        accessorKey: "measures",
        header: "Mål",
        Cell: ({ cell }) => {
          const measures = cell.getValue();
          return Array.isArray(measures)
            ? measures.join(" ")
            : measures || "N/A";
        },
      },
    ],
    [],
  );

  const preloadDialog = useCallback(() => {
    loadProductDialog();
  }, []);

  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onMouseEnter={preloadDialog}
          onFocus={preloadDialog}
          onClick={() => openModal("ADD")}
        >
          Nytt Produkt
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <LinearProgress sx={{ my: 1, maxWidth: 300, mx: "auto" }} />
          Laster Produkter...
        </Box>
      ) : (
        <ReactTable
          data={tableData}
          columns={tableColumns}
          refetch={refetch}
          meta={metaData}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          sorting={sorting}
          pagination={pagination}
          isError={isError}
          isFetching={isFetching}
          handleEdit={(p) => openModal("EDIT", p)}
          handleDelete={(p) => openModal("DELETE", p)}
        />
      )}

      <Suspense fallback={null}>
        {activeModal && (
          <ProductDialog
            open
            mode={activeModal}
            productToEdit={selectedProduct}
            onClose={handleCloseDialog}
            onSuccess={(p) => {
              const action =
                activeModal === "DELETE"
                  ? "slettet"
                  : activeModal === "EDIT"
                    ? "oppdatert"
                    : "lagt til";

              showSnackbar(
                `Produkt "${p?.name ?? selectedProduct?.name}" ble ${action}`,
              );
              handleCloseDialog();
            }}
            onError={() => showSnackbar("Kunne ikke utføre handling", "error")}
          />
        )}
      </Suspense>

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

export default ProductScreen;
