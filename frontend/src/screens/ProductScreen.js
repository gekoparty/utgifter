// Import statements
import React, { useState, useMemo, useEffect } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AddProductDialog from "../components/Products/ProductDialogs/AddProductDialog";
import DeleteProductDialog from "../components/Products/ProductDialogs/DeleteProductDialog";
import EditProductDialog from "../components/Products/ProductDialogs/EditProductDialog";

// Constants
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 5 };
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_PRODUCT = { _id: "", name: "" };
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const ProductScreen = () => {
  // State variables
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

  // Memoized values
  const memoizedSelectedProduct = useMemo(
    () => selectedProduct,
    [selectedProduct]
  );

  // React Query client and hooks
  const queryClient = useQueryClient();
  const queryKey = [
    "products",
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ];

  // Snackbar state and handlers from custom hook
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
      { accessorKey: "name", header: "Produkter" },
      { accessorKey: "brand", header: "Merker" },
      { accessorKey: "type", header: "Type" },
      {
        accessorKey: "measures",
        header: "Mål",
        cell: ({ cell }) => {
          const measures = cell.getValue();
          if (Array.isArray(measures)) return measures.join(" ");
          return measures || "N/A";
        },
      },
    ],
    []
  );

  // Fetch function for products
  const fetchData = async () => {
    const fetchURL = new URL("/api/products", API_URL);
    fetchURL.searchParams.set(
      "start",
      `${pagination.pageIndex * pagination.pageSize}`
    );
    fetchURL.searchParams.set("size", `${pagination.pageSize}`);
    fetchURL.searchParams.set(
      "columnFilters",
      JSON.stringify(columnFilters ?? [])
    );
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));

    const response = await fetch(fetchURL.href);
    const json = await response.json();
    const products = json.products;

    const brandNamesArray = await Promise.all(
      products.map(async (product) => {
        if (!product.brands || !product.brands.length) return ["N/A"];
        return Promise.all(
          product.brands.map(async (brandId) => {
            const res = await fetch(`/api/brands/${brandId}`);
            const data = await res.json();
            return data.name;
          })
        );
      })
    );

    return {
      products: products.map((product, idx) => ({
        ...product,
        brand: brandNamesArray[idx].join(", "),
      })),
      meta: json.meta,
    };
  };

  // React Query hook for data fetching
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
    refetchOnMount: true,
  });

  // Ensure default sorting
  useEffect(() => {
    if (sorting.length === 0) setSorting(INITIAL_SORTING);
  }, [sorting]);

  // Handlers for product actions
  const addProductHandler = (newProduct) => {
    showSuccessSnackbar(`Produkt ${newProduct.name} er lagt til`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  const deleteFailureHandler = (failedProduct) => {
    showErrorSnackbar(`Kunne ikke slette produktet ${failedProduct.name}`);
  };

  const deleteSuccessHandler = (deletedProduct) => {
    showSuccessSnackbar(`Produkt ${deletedProduct} slettet`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Kunne ikke oppdatere produktet");
  };

  const editSuccessHandler = (updatedProduct) => {
    showSuccessSnackbar(`Produkt ${updatedProduct.name} oppdatert`);
    queryClient.invalidateQueries("products");
    refetch();
  };

  // JSX structure
  return (
    <TableLayout>
      {/* Add Product Button */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddProductDialogOpen(true)}
        >
          Nytt Produkt
        </Button>
      </Box>

      {/* Products Table */}
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
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
              meta={productsData?.meta}
              setSelectedProduct={setSelectedProduct}
              handleEdit={(product) => {
                setSelectedProduct(product);
                setEditModalOpen(true);
              }}
              handleDelete={(product) => {
                setSelectedProduct(product);
                setDeleteModalOpen(true);
              }}
            />
          )}
        </Box>
      </Box>

      {/* Dialogs */}
      <DeleteProductDialog
        open={deleteModalOpen}
        dialogTitle="Confirm Deletion"
        onClose={() => setDeleteModalOpen(false)}
        selectedProduct={selectedProduct}
        onDeleteSuccess={deleteSuccessHandler}
        onDeleteFailure={deleteFailureHandler}
      />
      {memoizedSelectedProduct._id && (
        <EditProductDialog
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          selectedProduct={selectedProduct}
          onUpdateSuccess={editSuccessHandler}
          onUpdateFailure={editFailureHandler}
        />
      )}
      <AddProductDialog
        open={addProductDialogOpen}
        onClose={() => setAddProductDialogOpen(false)}
        onAdd={addProductHandler}
      />

      {/* Snackbar */}
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

export default ProductScreen;
