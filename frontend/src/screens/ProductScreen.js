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
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import AddProductDialog from "../components/Products/ProductDialogs/AddProductDialog";
import DeleteProductDialog from "../components/Products/ProductDialogs/DeleteProductDialog";
import EditProductDialog from '../components/Products/ProductDialogs/EditProductDialog';


// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 5,
};
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_PRODUCT = {
  _id: "",
  name: "",
};
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const ProductScreen = () => {
  
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedProduct, setSelectedProduct] = useState(INITIAL_SELECTED_PRODUCT);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addProductDialogOpen, setAddProductDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  
  
  
  
  const tableColumns = useMemo(
    () => [
      { accessorKey: "name", header: "Produkter" }, // Use "Name" as the header for all resources
      { accessorKey: "brand", header: "Merker" },
      {accessorKey: "type", header: "Type"} // Example for location
      // Other columns as needed
    ],
    []
  );

  // React Query
  const queryClient = useQueryClient();
  const queryKey = [
    "products",
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ];

  // Define your query function
  const fetchData = async () => {
    const fetchURL = new URL("/api/products", API_URL);
  
    fetchURL.searchParams.set(
      "start",
      `${pagination.pageIndex * pagination.pageSize}`
    );
    fetchURL.searchParams.set("size", `${pagination.pageSize}`);
  
    const modifiedFilters = columnFilters.map((filter) => {
      if (filter.id === "brand") {
        return { id: "brand", value: "" };
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
  
    const products = json.products;
  
    // Fetch brand names for each product
    const brandPromises = products.map(async (product) => {
      if (!product.brands || !product.brands.length) {
        return ["N/A"]; // Handle products with no brands
      }
  
      // Map each brand ID to its corresponding brand name
      const brandNames = await Promise.all(
        product.brands.map(async (brandId) => {
          const brandResponse = await fetch(`/api/brands/${brandId}`);
          const brandData = await brandResponse.json();
          return brandData.name; // Extract the brand name
        })
      );
  
      return brandNames; // Return array of brand names
    });
  
    const brandNamesArray = await Promise.all(brandPromises);
  
    // Associate brand names array with each product
    const productsWithBrandNames = products.map((product, index) => ({
      ...product,
      brand: brandNamesArray[index], // Add brand names array property
    }));
  
    // Transform the data for rendering in the table
    const transformedData = productsWithBrandNames.map((product) => ({
      _id: product._id,
      name: product.name,
      brand: product.brand.join(", "), // Join brand names array
      type: product.type,
      measurementUnit: product.measurementUnit,
    }));
  
    return { products: transformedData, meta: json.meta };
  };

  if (sorting.length === 0) {
    setSorting([{ id: "name", desc: false }]);
  }

  const {
    data: productsData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKey,
    queryFn: fetchData,
    keepPreviousData: true,
    refetchOnMount: true,
  })


  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  

  const addProductHandler = (newProduct) => {
    showSuccessSnackbar(`Butikk ${newProduct.name} er lagt til`)
    queryClient.invalidateQueries("products");
    refetch();
  }

  const deleteFailureHandler = (failedProduct) => {
    showErrorSnackbar(`Failed to delete product ${failedProduct.name}`)
  }

  const deleteSuccessHandler = (deletedProduct) =>  {
    showSuccessSnackbar(`Product ${deletedProduct} deleted successfully` )

    queryClient.invalidateQueries("products");
    refetch();
  }

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update products")
  }

  const editSuccessHandler = (selectedProduct) => {
    showSuccessSnackbar(`Product ${selectedProduct.name} updated succesfully`)
    queryClient.invalidateQueries("products");
    refetch();
  }


  return (
    <TableLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddProductDialogOpen(true)}
        >
          Nytt Produkt
        </Button>
      </Box>

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
              totalRowCount={productsData?.meta?.totalRowCount} 
              rowCount={productsData?.meta?.totalRowCount ?? 0}
              handleEdit={(product) => {
                console.log("Selected Product:", product);
                setSelectedProduct(product);
                setEditModalOpen(true);
              }}
              handleDelete={(product) => {
                setSelectedProduct(product);
                setDeleteModalOpen(true);
              }}
              editModalOpen={editModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
              
            />
          )}
        </Box>
      </Box>
      

      <DeleteProductDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        dialogTitle="Confirm Deletion"
        cancelButton={
          <Button onClick={()=> setDeleteModalOpen(false)}>Cancel</Button>
        }
        selectedProduct={selectedProduct}
        onDeleteSuccess={deleteSuccessHandler}
        onDeleteFailure={deleteFailureHandler}
       />

       <EditProductDialog
       open={editModalOpen}
       onClose={()=> setEditModalOpen(false)}
       cancelButton={
        <Button onClick={()=> setEditModalOpen(false)}>Cancel</Button>
       }
       dialogTitle={"Edit Product"}
       selectedProduct={selectedProduct}
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
      <AddProductDialog
        onClose={() => setAddProductDialogOpen(false)}
        //locations={locationsData}
        //categories={categoriesData}
        open={addProductDialogOpen}
        onAdd={addProductHandler}
      ></AddProductDialog>
    </TableLayout>
  );
};

export default ProductScreen;