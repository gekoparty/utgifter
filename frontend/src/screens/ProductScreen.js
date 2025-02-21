// Import statements
import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
  useTheme,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
const AddProductDialog = lazy(() =>
  import("../components/Products/ProductDialogs/AddProductDialog")
);
const DeleteProductDialog = lazy(() =>
  import("../components/Products/ProductDialogs/DeleteProductDialog")
);
const EditProductDialog = lazy(() =>
  import("../components/Products/ProductDialogs/EditProductDialog")
);

// Constants for initial states and API URL
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

// Main ProductScreen component
const ProductScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedProduct, setSelectedProduct] = useState(
    INITIAL_SELECTED_PRODUCT
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Memoized values and theme for styling
  const theme = useTheme();
  const memoizedSelectedProduct = useMemo(
    () => selectedProduct,
    [selectedProduct]
  );

  // React Query client and query key for caching
  const queryClient = useQueryClient();
  const queryKey = [
    "products",
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
        header: "Produkter",
        size: 150,
        grow: 2,
        minSize: 150,
        maxSize: 400,
      },
      {
        accessorKey: "brand",
        header: "Merker",
        size: 150,
        grow: 1,
        minSize: 150,
        maxSize: 300,
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 150,
        grow: 1,
        minSize: 100,
        maxSize: 250,
      },
      {
        accessorKey: "measures",
        header: "Mål",
        size: 100,
        grow: 1,
        minSize: 50,
        maxSize: 300,
        cell: ({ cell }) => {
          const measures = cell.getValue();
          return Array.isArray(measures)
            ? measures.join(" ")
            : measures || "N/A";
        },
      },
    ],
    []
  );

  // Common function to build the URL
  const buildFetchURL = (
    pageIndex,
    pageSize,
    sorting,
    columnFilters,
    globalFilter
  ) => {
    const fetchURL = new URL("/api/products", API_URL);

    // Append query parameters to the URL
    fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
    fetchURL.searchParams.set("size", `${pageSize}`);
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
    fetchURL.searchParams.set(
      "columnFilters",
      JSON.stringify(columnFilters ?? [])
    );
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");

    return fetchURL;
  };

  // Fetch data function
  const fetchData = async ({ signal }) => {
    try {
      const fetchURL = buildFetchURL(
        pagination.pageIndex,
        pagination.pageSize,
        sorting,
        columnFilters,
        globalFilter
      );

      const response = await fetch(fetchURL.href, {signal});

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText} (${response.status})`);
      }

      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error; // This will show up in React Query as an error state
    }
  };

  // Use React Query to fetch the initial page of data
  const {
    data: productsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: fetchData,
    keepPreviousData: true,
    retry: 1,
    refetchOnMount: true,
  });

  // Common function for prefetching data
  const prefetchPageData = async (
    queryClient,
    nextPageIndex,
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    signal
  ) => {
    const fetchURL = buildFetchURL(
      nextPageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter
    );

    // Prefetch the next page of data
    queryClient.prefetchQuery(
      [
        "products",
        columnFilters,
        globalFilter,
        nextPageIndex,
        pagination.pageSize,
        sorting,
      ],
      async () => {
        const response = await fetch(fetchURL.href, {signal});
        const json = await response.json();
        return json;
      }
    );
  };

  // handlePrefetch now simply calls prefetchPageData
  const handlePrefetch = (nextPageIndex) => {
    const controller = new AbortController();
    prefetchPageData(
      queryClient,
      nextPageIndex,
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      controller.signal
    );
    // Optionally, you can store and later abort this controller if needed.
  };

  

  // AUTOMATIC PREFETCHING with cleanup using an AbortController
  useEffect(() => {
    const nextPageIndex = pagination.pageIndex + 1;
    console.log(
      "Current page:",
      pagination.pageIndex,
      "Prefetching data for page:",
      nextPageIndex
    );

    const controller = new AbortController();
    prefetchPageData(
      queryClient,
      nextPageIndex,
      pagination,
      sorting,
      columnFilters,
      globalFilter,
      controller.signal
    );

    // Cleanup function aborts the prefetch if dependencies change or component unmounts
    return () => controller.abort();
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
    queryClient,
  ]);

  // Ensure default sorting when sorting state is empty
  useEffect(() => {
    if (sorting.length === 0) setSorting(INITIAL_SORTING);
  }, [sorting]);

  // Handlers for product actions (Add, Edit, Delete)
  const addProductHandler = (newProduct) => {
    showSuccessSnackbar(`Produkt ${newProduct.name} er lagt til`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  const deleteSuccessHandler = (deletedProduct) => {
    showSuccessSnackbar(`Produkt ${deletedProduct} slettet`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  const editSuccessHandler = (updatedProduct) => {
    showSuccessSnackbar(`Produkt ${updatedProduct.name} oppdatert`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  // Cleanup function to reset selected product and remove queries when dialogs close
  const handleDialogClose = (closeDialogFn) => {
    closeDialogFn(false);
    setSelectedProduct(INITIAL_SELECTED_PRODUCT);
    // Remove all queries related to products from the cache
    queryClient.removeQueries("products");
    queryClient.removeQueries("brands");
  };

  // Render the main table layout and dialogs
  return (
    <TableLayout>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1, // Allow this whole section to expand
          width: "100%",
          minHeight: "100%", // Ensure it stretches fully inside TableLayout
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddProductDialogOpen(true)}
          >
            Nytt Produkt
          </Button>
        </Box>

        {/* Product Table */}
        <Box
          sx={{
            flexGrow: 1, // Ensures the table fills all remaining space
            display: "flex",
            flexDirection: "column",
            width: "100%",
            minWidth: 600,
          }}
        >
          {productsData && (
            <ReactTable
              data={productsData?.products}
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
              meta={productsData.meta}
              setSelectedProduct={setSelectedProduct}
              handleEdit={(product) => {
                setSelectedProduct(product);
                setEditModalOpen(true);
              }}
              handleDelete={(product) => {
                setSelectedProduct(product);
                setDeleteModalOpen(true);
              }}
              sx={{ flexGrow: 1, width: "100%" }} // Force table to expand fully
            />
          )}
        </Box>
      </Box>

      {/* Modals */}
      <Suspense fallback={<div>Laster...</div>}>
        <DeleteProductDialog
          open={deleteModalOpen}
          dialogTitle="Bekreft Sletting"
          onClose={() => handleDialogClose(setDeleteModalOpen)}
          selectedProduct={selectedProduct}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={() =>
            showErrorSnackbar(
              `Kunne ikke slette produktet ${selectedProduct.name}`
            )
          }
        />
      </Suspense>

      <Suspense fallback={<div>Laster redigeringsdialog...</div>}>
        {memoizedSelectedProduct._id && editModalOpen && (
          <EditProductDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedProduct={selectedProduct}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={() =>
              showErrorSnackbar("Kunne ikke oppdatere produktet")
            }
          />
        )}
      </Suspense>
      <Suspense fallback={<div>Laster Dialog...</div>}>
        {addProductDialogOpen && (
          <AddProductDialog
            open={addProductDialogOpen}
            onClose={() => handleDialogClose(setAddProductDialogOpen)}
            onAdd={addProductHandler}
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
                : theme.palette.info.main,
            color: theme.palette.getContrastText(
              snackbarSeverity === "success"
                ? theme.palette.success.main
                : snackbarSeverity === "error"
                ? theme.palette.error.main
                : theme.palette.info.main
            ),
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

export default ProductScreen;
