import React, {
  useState,
  useMemo,
  useEffect,
  lazy,
  Suspense,
  useCallback,
} from "react";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  SnackbarContent,
  Slider,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import debounce from "lodash/debounce";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";

// Lazy-loaded Expense Dialogs
const AddExpenseDialog = lazy(() =>
  import("../components/Expenses/ExpenseDialogs/AddExpenseDialog")
);
const DeleteExpenseDialog = lazy(() =>
  import("../components/Expenses/ExpenseDialogs/DeleteExpenseDialog")
);
const EditExpenseDialog = lazy(() =>
  import("../components/Expenses/ExpenseDialogs/EditExpenseDialog")
);

// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 10,
};
const INITIAL_SORTING = [{ id: "purchaseDate", desc: true }];
const INITIAL_SELECTED_EXPENSE = {
  _id: "",
  productName: "",
  brandName: "",
  shopName: "",
  locationName: "",
  price: 0,
  volume: 0,
  discountValue: 0,
  discountAmount: 0,
  finalPrice: 0,
  quantity: 1,
  hasDiscount: false,
  purchased: true,
  registeredDate: null,
  purchaseDate: null,
  type: "",
  measurementUnit: "",
  pricePerUnit: 0,
};
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const DEBOUNCE_DELAY = 1000;

const PriceRangeFilter = ({ value, onChange }) => {
  // Create a debounced version of the onChange handler
  const debouncedOnChange = useMemo(
    () =>
      debounce((newValue) => {
        onChange(newValue);
      }, 1000),
    [onChange]
  );

  const handleSliderChange = (event, newValue) => {
    debouncedOnChange(newValue);
  };

  // Cleanup the debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  return (
    <Box sx={{ width: 300, mb: 2 }} data-testid="price-range-filter">
      <Slider
        value={value}
        onChange={handleSliderChange}
        valueLabelDisplay="auto"
        min={0}
        max={1000}
        step={10}
        data-testid="slider"
      />
    </Box>
  );
};

const ExpenseScreen = () => {
  // Table state
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedExpense, setSelectedExpense] = useState(
    INITIAL_SELECTED_EXPENSE
  );

  // Dialog modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Price range filter with debouncing so rapid slider changes won’t trigger many fetches
  const [priceRangeFilter, setPriceRangeFilter] = useState([0, 1000]);
  const [debouncedPriceRangeFilter, setDebouncedPriceRangeFilter] = useState([
    0, 1000,
  ]);
  const debouncedSetPriceFilter = useMemo(
    () =>
      debounce(
        (newValue) => setDebouncedPriceRangeFilter(newValue),
        DEBOUNCE_DELAY
      ),
    [] // Empty dependency array - debounce once
  );

  useEffect(() => {
    return () => debouncedSetPriceFilter.cancel();
  }, [debouncedSetPriceFilter]);

  const theme = useTheme();
  const memoizedSelectedExpense = useMemo(
    () => selectedExpense,
    [selectedExpense]
  );

  const queryClient = useQueryClient();

  // Helper: Build the fetch URL using the current table state
  const buildFetchURL = (
    pageIndex,
    pageSize,
    sorting,
    columnFilters,
    globalFilter,
    priceRange
  ) => {
    const fetchURL = new URL("/api/expenses", API_URL);
    fetchURL.searchParams.set("start", `${pageIndex * pageSize}`);
    fetchURL.searchParams.set("size", `${pageSize}`);
    fetchURL.searchParams.set("sorting", JSON.stringify(sorting ?? []));
    fetchURL.searchParams.set(
      "columnFilters",
      JSON.stringify(columnFilters ?? [])
    );
    fetchURL.searchParams.set("globalFilter", globalFilter ?? "");
    fetchURL.searchParams.set("minPrice", `${priceRange[0]}`);
    if (priceRange[1] < 1000) {
      fetchURL.searchParams.set("maxPrice", `${priceRange[1]}`);
    }
    return fetchURL;
  };

  // Calculate price statistics for color coding in the table cells
  const calculatePriceStatsByType = (data) => {
    const stats = {};
    const groupedByType = data.reduce((acc, item) => {
      if (!acc[item.type]) acc[item.type] = [];
      acc[item.type].push(item.pricePerUnit);
      return acc;
    }, {});

    for (const [type, prices] of Object.entries(groupedByType)) {
      prices.sort((a, b) => a - b);
      const min = prices[0];
      const max = prices[prices.length - 1];
      const median = prices[Math.floor(prices.length / 2)];
      stats[type] = { min, max, median };
    }

    return stats;
  };

  // Fetch expenses data and update price stats
  const fetchExpenses = async () => {
    const fetchURL = buildFetchURL(
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter,
      debouncedPriceRangeFilter
    );
    const response = await fetch(fetchURL.href);
    if (!response.ok) {
      throw new Error(`Error: ${response.statusText} (${response.status})`);
    }
    const json = await response.json();
    const stats = calculatePriceStatsByType(json.expenses);
    setPriceStatsByType(stats);
    return { expenses: json.expenses, meta: json.meta };
  };

  // Prefetch function for preloading the next page’s data
  const prefetchPageData = async (nextPageIndex) => {
    const fetchURL = buildFetchURL(
      nextPageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter,
      debouncedPriceRangeFilter
    );
    await queryClient.prefetchQuery(
      [
        "expenses",
        columnFilters,
        globalFilter,
        nextPageIndex,
        pagination.pageSize,
        sorting,
        debouncedPriceRangeFilter,
      ],
      async () => {
        const response = await fetch(fetchURL.href);
        if (!response.ok) {
          throw new Error(`Error: ${response.statusText} (${response.status})`);
        }
        const json = await response.json();
        return { expenses: json.expenses, meta: json.meta };
      }
    );
  };

  // Include debounced price range in the query key so that changing it re-fetches data
  const queryKey = useMemo(
    () => [
      "expenses",
      columnFilters,
      globalFilter,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      debouncedPriceRangeFilter,
    ],
    [
      columnFilters,
      globalFilter,
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      debouncedPriceRangeFilter,
    ]
  );

  // React Query hook for expenses
  const {
    data: expensesData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: queryKey,
    queryFn: fetchExpenses,
    keepPreviousData: true,
    refetchOnMount: true,
  });

  // Ensure default sorting if sorting state becomes empty
  useEffect(() => {
    if (sorting.length === 0) setSorting(INITIAL_SORTING);
  }, [sorting]);

  // Prefetch next page whenever pagination, sorting, or filters change
  useEffect(() => {
    const totalPages = Math.ceil(
      (expensesData?.meta?.totalRowCount || 0) / pagination.pageSize
    );
    if (pagination.pageIndex + 1 < totalPages) {
      prefetchPageData(pagination.pageIndex + 1);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
    columnFilters,
    globalFilter,
    debouncedPriceRangeFilter,
    queryClient,
  ]);

  // Local state for price statistics
  const [priceStatsByType, setPriceStatsByType] = useState({});

  // Render the detail panel for each row (if needed)
  const renderDetailPanel = useCallback(
    ({ row }) => (
      <DetailPanel expense={row.original} data-testid="detail-panel" />
    ),
    []
  );

  // Table columns configuration
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "productName",
        header: "Produkt",
        Cell: ({ row }) => row.original.productName,
        enableColumnPinning: true,
        meta: { testId: "product-name-column" },
      },
      {
        accessorKey: "pricePerUnit",
        header: "Pris pr kg/l",
        Cell: ({ cell, row }) => {
          const price = cell.getValue();
          const type = row.original.type;
          const stats = priceStatsByType[type] || { min: 0, max: 0, median: 0 };

          let backgroundColor = theme.palette.warning.main;
          let textColor = theme.palette.warning.contrastText;

          if (stats.median > 0) {
            if (price <= stats.min + (stats.median - stats.min) / 2) {
              backgroundColor = theme.palette.success.main;
              textColor = theme.palette.success.contrastText;
            } else if (price >= stats.max - (stats.max - stats.median) / 2) {
              backgroundColor = theme.palette.error.main;
              textColor = theme.palette.error.contrastText;
            }
          }

          return (
            <Box
              component="span"
              sx={{
                backgroundColor,
                color: textColor,
                borderRadius: "0.25rem",
                padding: "0.25rem",
              }}
              data-testid={`price-${row.index}`}
            >
              {price?.toLocaleString("nb-NO", {
                style: "currency",
                currency: "NOK",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Box>
          );
        },
        enableColumnPinning: true,
      },
      {
        accessorKey: "shopName",
        header: "Butikk",
        Cell: ({ row }) => row.original.shopName,
        enableColumnPinning: true,
        meta: { testId: "shop-name-column" },
      },
      {
        accessorKey: "purchaseDate",
        header: "Purchase Date",
        manualFiltering: true,
        filterVariant: "date",
        Cell: ({ cell }) => {
          const dateValue = cell.getValue();
          return dateValue
            ? new Date(dateValue).toLocaleDateString()
            : "Invalid Date";
        },
      },
    ],
    [priceStatsByType, theme]
  );

  // Snackbar state and handlers for feedback messages
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Expense action handlers
  const addExpenseHandler = (savedData) => {
    // If the response has a "data" property, extract the first expense.
    const expenseData =
      savedData.data && Array.isArray(savedData.data)
        ? savedData.data[0]
        : savedData;

    // Get the product name from the expense data.
    const productName =
      typeof expenseData.productName === "object"
        ? expenseData.productName.name
        : expenseData.productName;

    if (!expenseData || !productName) {
      showErrorSnackbar(
        "Kunne ikke legge til utgift. Ugyldig respons fra server."
      );
      return;
    }

    showSuccessSnackbar(`Utgift for "${productName}" lagret!`);

    // Force a refetch of expenses to update the table.
    refetch();
  };

  const deleteFailureHandler = (failedExpense) => {
    showErrorSnackbar(`Failed to delete expense ${failedExpense.productName}`);
  };

  const deleteSuccessHandler = (deletedExpense) => {
    const productName =
      typeof deletedExpense.productName === "object"
        ? deletedExpense.productName.name
        : deletedExpense.productName || "Ukjent produkt";
    showSuccessSnackbar(`Utgift for "${productName}" slettet!`);
    // Trigger immediate refetch so that the table updates:
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update expense");
  };

  const editSuccessHandler = (updatedExpense) => {
    // Check if updatedExpense contains a "data" array; if so, extract the first expense.
    const expenseData =
      updatedExpense.data && Array.isArray(updatedExpense.data)
        ? updatedExpense.data[0]
        : updatedExpense;

    // Extract productName properly
    const productName =
      typeof expenseData.productName === "object"
        ? expenseData.productName.name
        : expenseData.productName || "Ukjent produkt";

    showSuccessSnackbar(`Utgift for "${productName}" oppdatert!`);
    refetch(); // Trigger immediate refetch to update the table
  };

  // Handle slider changes by updating the price range filter state
  const handlePriceRangeChange = (newRange) => {
    setPriceRangeFilter(newRange);
  };

  return (
    <TableLayout>
      <Box
        sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
        data-testid="main-container"
      >
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddExpenseDialogOpen(true)}
          data-testid="add-expense-button"
        >
          Ny Utgift
        </Button>
        <PriceRangeFilter
          value={priceRangeFilter}
          onChange={handlePriceRangeChange}
        />
      </Box>

      <Box
        sx={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          boxShadow: 2,
        }}
        data-testid="table-wrapper"
      >
        {expensesData && (
          <ReactTable
            muiTableContainerProps={{
              sx: {
                width: "100%",
                overflowX: "auto",
              },
              "data-testid": "mui-table-container",
            }}
            muiTopToolbarProps={{
              sx: {
                width: "100%",
              },
              "data-testid": "mui-top-toolbar",
            }}
            data={expensesData?.expenses}
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
            meta={expensesData?.meta}
            setSelectedExpense={setSelectedExpense}
            totalRowCount={expensesData?.meta?.totalRowCount}
            rowCount={expensesData?.meta?.totalRowCount || 0}
            handleEdit={(expense) => {
              setSelectedExpense(expense);
              setEditModalOpen(true);
            }}
            handleDelete={(expense) => {
              setSelectedExpense(expense);
              setDeleteModalOpen(true);
            }}
            editModalOpen={editModalOpen}
            setDeleteModalOpen={setDeleteModalOpen}
            initialState={{
              columnPinning: {
                left: ["mrt-row-actions", "productName", "brandName"],
                right: ["finalPrice"],
              },
            }}
            renderDetailPanel={renderDetailPanel}
            data-testid="react-table"
          />
        )}
      </Box>

      {/* Lazy-loaded dialogs wrapped in Suspense */}
      <Suspense fallback={<div>Loading Dialog...</div>}>
        {memoizedSelectedExpense._id && editModalOpen && (
          <EditExpenseDialog
            open={editModalOpen}
            onClose={() => setEditModalOpen(false)}
            selectedExpense={selectedExpense}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={editFailureHandler}
            data-testid="edit-expense-dialog"
          />
        )}
      </Suspense>

      <Suspense fallback={<div>Loading Dialog...</div>}>
        <DeleteExpenseDialog
          open={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          dialogTitle="Confirm Deletion"
          selectedExpense={selectedExpense}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
          data-testid="delete-expense-dialog"
        />
      </Suspense>

      <Suspense fallback={<div>Loading Dialog...</div>}>
        {addExpenseDialogOpen && (
          <AddExpenseDialog
            open={addExpenseDialogOpen}
            onClose={() => setAddExpenseDialogOpen(false)}
            onAdd={addExpenseHandler}
            data-testid="add-expense-dialog"
          />
        )}
      </Suspense>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        data-testid="snackbar"
      >
        <SnackbarContent
          sx={{
            backgroundColor:
              snackbarSeverity === "success"
                ? theme.palette.success.main
                : snackbarSeverity === "error"
                ? theme.palette.error.main
                : theme.palette.info.main,
            color: theme.palette.success.contrastText,
          }}
          message={snackbarMessage}
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
              data-testid="snackbar-close-icon"
            >
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>
    </TableLayout>
  );
};

export default ExpenseScreen;
