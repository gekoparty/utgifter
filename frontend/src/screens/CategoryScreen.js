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

const AddCategoryDialog = lazy(() =>
  import("../components/Categories/CategoryDialogs/AddCategoryDialog")
);
const DeleteCategoryDialog = lazy(() =>
  import("../components/Categories/CategoryDialogs/DeleteCategoryDialog")
);
const EditCategoryDialog = lazy(() =>
  import("../components/Categories/CategoryDialogs/EditCategoryDialog")
);

// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 10,
};
const INITIAL_SORTING = [{ id: "name", desc: false }];
const INITIAL_SELECTED_CATEGORY = {
  _id: "",
  name: "",
};
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const CategoryScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedCategory, setSelectedCategory] = useState(INITIAL_SELECTED_CATEGORY);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addCategoryDialogOpen, setAddCategoryDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const theme = useTheme();
  const memoizedSelectedCategory = useMemo(() => selectedCategory, [selectedCategory]);

  // React Query
  const queryClient = useQueryClient();
  const queryKey = [
    "categories",
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ];

  // Snackbar
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Table columns
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Kategori",
        size: 150,
        grow: 2,
        minSize: 150,
        maxSize: 400,
      },
    ],
    []
  );

  // Fetch URL builder
  const buildFetchURL = (pageIndex, pageSize, sorting, columnFilters, globalFilter) => {
    const fetchURL = new URL("/api/categories", API_URL);
    fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
    fetchURL.searchParams.set("size", `${pageSize}`);
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
    fetchURL.searchParams.set("columnFilters", JSON.stringify(columnFilters ?? []));
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
    return fetchURL;
  };

  // Data fetching
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
    return json;
  };

  // Prefetching
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
        "categories",
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
        return await response.json();
      }
    );
  };

  const handlePrefetch = (nextPageIndex) => {
    prefetchPageData(nextPageIndex);
  };

  // React Query hook
  const {
    data: categoriesData,
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

  // Effects
  useEffect(() => {
    if (sorting.length === 0) setSorting(INITIAL_SORTING);
  }, [sorting]);

  useEffect(() => {
    const nextPageIndex = pagination.pageIndex + 1;
    prefetchPageData(nextPageIndex);
  }, [pagination.pageIndex, pagination.pageSize, sorting, columnFilters, globalFilter]);

  // Handlers
  const addCategoryHandler = (newCategory) => {
    showSuccessSnackbar(`Kategori "${newCategory.name}" er lagt til`);
    queryClient.invalidateQueries("categories");
    refetch();
  };

  const deleteSuccessHandler = (deletedCategory) => {
    showSuccessSnackbar(`Kategori "${deletedCategory.name}" slettet`);
    queryClient.invalidateQueries("categories");
    refetch();
  };

  const deleteFailureHandler = (failedCategory) => {
    showErrorSnackbar(`Kunne ikke slette kategori "${failedCategory.name}"`);
  };

  const editSuccessHandler = (updatedCategory) => {
    showSuccessSnackbar(`Kategori "${updatedCategory.name}" oppdatert`);
    queryClient.invalidateQueries("categories");
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Kunne ikke oppdatere kategori");
  };

  return (
    <TableLayout>
      <Box sx={{ 
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        width: "100%",
        minHeight: "100%",
      }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => setAddCategoryDialogOpen(true)}
          >
            Ny Kategori
          </Button>
        </Box>

        <Box sx={{ 
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          minWidth: 600,
        }}>
          {categoriesData && (
            <ReactTable
              data={categoriesData?.categories}
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
              meta={categoriesData?.meta}
              totalRowCount={categoriesData?.meta?.totalRowCount}
              rowCount={categoriesData?.meta?.totalRowCount ?? 0}
              setSelectedRow={setSelectedCategory}
              handleEdit={(category) => {
                setSelectedCategory(category);
                setEditModalOpen(true);
              }}
              handleDelete={(category) => {
                setSelectedCategory(category);
                setDeleteModalOpen(true);
              }}
              editModalOpen={editModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
              sx={{ flexGrow: 1, width: "100%" }}
            />
          )}
        </Box>
      </Box>

      {/* Dialogs */}
      <Suspense fallback={<div>Laster...</div>}>
        <AddCategoryDialog
          open={addCategoryDialogOpen}
          onClose={() => setAddCategoryDialogOpen(false)}
          onAdd={addCategoryHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteCategoryDialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          dialogTitle="Bekreft sletting"
          cancelButton={
            <Button onClick={() => setDeleteModalOpen(false)}>Avbryt</Button>
          }
          selectedCategory={memoizedSelectedCategory}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        {memoizedSelectedCategory._id && editModalOpen && (
          <EditCategoryDialog
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            dialogTitle="Rediger Kategori"
      cancelButton={
        <Button onClick={() => setEditModalOpen(false)}>Avbryt</Button>
      }
            selectedCategory={memoizedSelectedCategory}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={editFailureHandler}
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
        <SnackbarContent
          sx={{
            backgroundColor:
              snackbarSeverity === "success"
                ? theme.palette.success.main
                : theme.palette.error.main,
            color: theme.palette.success.contrastText,
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

export default CategoryScreen;