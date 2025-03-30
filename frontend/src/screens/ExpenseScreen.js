import React, {
  useState,
  useMemo,
 
  lazy,
  Suspense,
  useCallback,
} from "react";
import {
  Box,
  Button,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import ReactTable from "../components/commons/React-Table/react-table";
import CloseIcon from "@mui/icons-material/Close";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useTheme } from "@mui/material/styles";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";
import { usePaginatedData } from "../hooks/usePaginatedData";

// Lazy-loaded Expense Dialogs
const AddExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/AddExpense/AddExpenseDialog")
);
const DeleteExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/DeleteExpense/DeleteExpenseDialog")
);
const EditExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/EditExpense/EditExpenseDialog")
);

// =================================================================
// Constants
// =================================================================
const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
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

// =================================================================
// PriceRangeFilter Component
// =================================================================



// =================================================================
// ExpenseScreen Component using usePaginatedData
// =================================================================

const ExpenseScreen = () => {
  // --------------------------------------------------------------
  // State Declarations
  // --------------------------------------------------------------
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

  const queryClient = useQueryClient();
  const theme = useTheme();
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const baseQueryKey = useMemo(() => ["expenses", "paginated"], []);
  const memoizedSelectedExpense = useMemo(
    () => selectedExpense,
    [selectedExpense]
  );

  const expenseUrlBuilder = (endpoint, params) => {
    const fetchURL = new URL(endpoint, API_URL);
    fetchURL.searchParams.set("start", `${params.pageIndex * params.pageSize}`);
    fetchURL.searchParams.set("size", `${params.pageSize}`);
    fetchURL.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
    fetchURL.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
    fetchURL.searchParams.set("globalFilter", params.globalFilter ?? "");
    return fetchURL;
  };

  // --------------------------------------------------------------
  // Data Fetching using usePaginatedData Hook
  // --------------------------------------------------------------
  // Build parameters for the hook – note we map columnFilters to "filters"
  const transformExpenseData = async (json, signal) => {
    try {
      const { meta } = json;
      // Check for both "expenses" and "data"
      const expenseList = json.expenses || json.data || [];
      
      const transformedExpenses = expenseList.map((expense) => ({
        _id: expense._id,
        productName: expense.product?.name || expense.productName || "N/A",
        brandName: expense.brand?.name || expense.brandName || "N/A",
        shopName: expense.shop?.name || expense.shopName || "N/A",
        locationName: expense.location?.name || expense.locationName || "N/A",
        price: expense.price,
        volume: expense.volume,
        discountValue: expense.discountValue,
        discountAmount: expense.discountAmount,
        finalPrice: expense.finalPrice,
        quantity: expense.quantity,
        hasDiscount: expense.hasDiscount,
        purchased: expense.purchased,
        registeredDate: expense.registeredDate,
        purchaseDate: expense.purchaseDate,
        type: expense.type,
        measurementUnit: expense.measurementUnit,
        pricePerUnit: expense.pricePerUnit,
      }));
  
      return {
        expenses: transformedExpenses, // This is what your table uses.
        meta,
      };
    } catch (error) {
      console.error("Error transforming expense data:", error);
      return {
        expenses: [],
        meta: { totalRowCount: 0 },
      };
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

  const {
    data: expensesData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/expenses",
    params: fetchParams,
    urlBuilder: expenseUrlBuilder,
    baseQueryKey,
    transformFn: transformExpenseData,
  });

  const tableData = useMemo(() => expensesData?.expenses || [], [expensesData]);
  const metaData = useMemo(() => expensesData?.meta || {}, [expensesData]);
  // --------------------------------------------------------------
  // Derived Data: Price Statistics Calculation
  // --------------------------------------------------------------
  const priceStatsByType = useMemo(() => {
    if (!expensesData?.expenses) return {};
    const grouped = expensesData.expenses.reduce((acc, item) => {
      (acc[item.type] = acc[item.type] || []).push(item.pricePerUnit);
      return acc;
    }, {});
    const stats = {};
    Object.entries(grouped).forEach(([type, prices]) => {
      prices.sort((a, b) => a - b);
      const min = prices[0];
      const max = prices[prices.length - 1];
      const median = prices[Math.floor(prices.length / 2)];
      stats[type] = { min, max, median };
    });
    return stats;
  }, [expensesData]);

  const handleMutationSuccess = useCallback(
    (message) => {
      showSnackbar(message);
      queryClient.invalidateQueries({ queryKey: baseQueryKey });
    },
    [queryClient, showSnackbar, baseQueryKey]
  );

  const addExpenseHandler = useCallback(
    (newExpense) => {
      const productName =
        newExpense.productName?.name ||
        newExpense.productName ||
        "Ukjent produkt";
      handleMutationSuccess(`Utgift for "${productName}" ble registrert`);
    },
    [handleMutationSuccess]
  );

  const deleteSuccessHandler = useCallback(
    (deletedExpense) => {
      handleMutationSuccess(
        `Utgift for "${deletedExpense.productName}" slettet`
      );
    },
    [handleMutationSuccess]
  );

  const editSuccessHandler = useCallback(
    (updatedExpense) => {
      handleMutationSuccess(
        `Utgift for "${updatedExpense.productName}" oppdatert`
      );
    },
    [handleMutationSuccess]
  );

  const renderDetailPanel = useCallback(
    ({ row }) => <DetailPanel expense={row.original} />,
    []
  );

  // --------------------------------------------------------------
  // Table Configuration & Render Helpers
  // --------------------------------------------------------------

  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "productName",
        header: "Produktnavn",
        Cell: ({ row }) => row.original.productName,
        enableColumnPinning: true,
        meta: { testId: "product-name-column" },
      },
      {
        accessorKey: "pricePerUnit",
        header: "Pris per enhet",
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
        header: "Butikknavn",
        Cell: ({ row }) => row.original.shopName,
        enableColumnPinning: true,
        meta: { testId: "shop-name-column" },
      },
      {
        accessorKey: "purchaseDate",
        header: "Kjøpsdato",
        manualFiltering: true,
        filterVariant: "date",
        Cell: ({ cell }) => {
          const dateValue = cell.getValue();
          return dateValue
            ? new Date(dateValue).toLocaleDateString()
            : "Ugyldig dato";
        },
      },
    ],
    [priceStatsByType, theme]
  );

  // --------------------------------------------------------------
  // Expense Action Handlers
  // --------------------------------------------------------------

  // --------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------
  

  const handleDialogClose = (setDialogOpen) => {
    setDialogOpen(false);
    setSelectedExpense(INITIAL_SELECTED_EXPENSE);
  };

  // --------------------------------------------------------------
  // Render
  // --------------------------------------------------------------
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
          Legg til ny utgift
        </Button>
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
              sx: { width: "100%", overflowX: "auto" },
              "data-testid": "mui-table-container",
            }}
            muiTopToolbarProps={{
              sx: { width: "100%" },
              "data-testid": "mui-top-toolbar",
            }}
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
            setSelectedExpense={setSelectedExpense}
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

      <Suspense fallback={<div>Laster...</div>}>
        {memoizedSelectedExpense._id && (
          <EditExpenseDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedExpense={selectedExpense}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={() => showSnackbar("Oppdatering mislyktes")}
          />
        )}
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteExpenseDialog
          open={deleteModalOpen}
          onClose={() => handleDialogClose(setDeleteModalOpen)}
          selectedExpense={selectedExpense}
          onDeleteSuccess={deleteSuccessHandler}
          dialogTitle="Bekreft sletting av utgift" // Add this line
          onDeleteFailure={() => showSnackbar("Sletting mislyktes")}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <AddExpenseDialog
          open={addExpenseDialogOpen}
          onClose={() => handleDialogClose(setAddExpenseDialogOpen)}
          onAdd={addExpenseHandler}
        />
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

export default ExpenseScreen;
