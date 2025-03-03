import React, {
  useState,
  useMemo,
  useEffect,
  lazy,
  Suspense,
  useCallback,
} from "react";
import { Box, Button, Snackbar, Slider, Alert } from "@mui/material";

import ReactTable from "../components/commons/React-Table/react-table";
import debounce from "lodash/debounce";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useTheme } from "@mui/material/styles";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";
import { usePaginatedData } from "./common/usePaginatedData"; // Adjust the import path as needed

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

// =================================================================
// Constants
// =================================================================

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

// =================================================================
// PriceRangeFilter Component
// =================================================================

const PriceRangeFilter = ({ value, onChange }) => {
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

  useEffect(() => {
    return () => debouncedOnChange.cancel();
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
  const [priceRangeFilter, setPriceRangeFilter] = useState([0, 1000]);

  // Dialog modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const theme = useTheme();
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // --------------------------------------------------------------
  // Data Fetching using usePaginatedData Hook
  // --------------------------------------------------------------
  // Build parameters for the hook – note we map columnFilters to "filters"
  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter,
      priceRange: priceRangeFilter,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      globalFilter,
      priceRangeFilter,
    ]
  );

  const {
    data: expensesData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData("/api/expenses", fetchParams);

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

  // --------------------------------------------------------------
  // Memoized Handlers for Editing and Deleting Expenses
  // --------------------------------------------------------------
  const handleEditExpense = useCallback((expense) => {
    setSelectedExpense(expense);
    setEditModalOpen(true);
  }, []);

  const handleDeleteExpense = useCallback((expense) => {
    setSelectedExpense(expense);
    setDeleteModalOpen(true);
  }, []);

  const renderDetailPanel = useCallback(
    ({ row }) => (
      <DetailPanel expense={row.original} data-testid="detail-panel" />
    ),
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
  const addExpenseHandler = (savedData) => {
    const expenseData =
      savedData.data && Array.isArray(savedData.data)
        ? savedData.data[0]
        : savedData;

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

    showSuccessSnackbar(`Utgift for "${productName}" ble registrert!`);
    refetch();
  };

  const deleteFailureHandler = (failedExpense) => {
    showErrorSnackbar(
      `Kunne ikke slette utgiften for ${failedExpense.productName}`
    );
  };

  const deleteSuccessHandler = (deletedExpense) => {
    const productName =
      typeof deletedExpense.productName === "object"
        ? deletedExpense.productName.name
        : deletedExpense.productName || "Ukjent produkt";
    showSuccessSnackbar(`Utgiften for "${productName}" ble slettet!`);
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Kunne ikke lagre endringer");
  };

  const editSuccessHandler = (updatedExpense) => {
    const expenseData =
      updatedExpense.data && Array.isArray(updatedExpense.data)
        ? updatedExpense.data[0]
        : updatedExpense;

    const productName =
      typeof expenseData.productName === "object"
        ? expenseData.productName.name
        : expenseData.productName || "Ukjent produkt";

    showSuccessSnackbar(`Utgiften for "${productName}" ble oppdatert!`);

    refetch();
  };

  // --------------------------------------------------------------
  // Event Handlers
  // --------------------------------------------------------------
  const handlePriceRangeChange = (newRange) => {
    setPriceRangeFilter(newRange);
  };

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
              sx: { width: "100%", overflowX: "auto" },
              "data-testid": "mui-table-container",
            }}
            muiTopToolbarProps={{
              sx: { width: "100%" },
              "data-testid": "mui-top-toolbar",
            }}
            data={expensesData.expenses}
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
            meta={expensesData.meta}
            setSelectedExpense={setSelectedExpense}
            totalRowCount={expensesData.meta?.totalRowCount}
            rowCount={expensesData.meta?.totalRowCount || 0}
            handleEdit={handleEditExpense}
            handleDelete={handleDeleteExpense}
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

      <Suspense fallback={<div>Laster inn dialog...</div>}>
        {selectedExpense._id && editModalOpen && (
          <EditExpenseDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedExpense={selectedExpense}
            onUpdateSuccess={editSuccessHandler}
            onUpdateFailure={editFailureHandler}
            data-testid="edit-expense-dialog"
          />
        )}
      </Suspense>

      <Suspense fallback={<div>Laster inn dialog...</div>}>
        <DeleteExpenseDialog
          open={deleteModalOpen}
          onClose={() => handleDialogClose(setDeleteModalOpen)}
          dialogTitle="Bekreft sletting av utgift"
          selectedExpense={selectedExpense}
          onDeleteSuccess={deleteSuccessHandler}
          onDeleteFailure={deleteFailureHandler}
          data-testid="delete-expense-dialog"
        />
      </Suspense>

      <Suspense fallback={<div>Laster inn dialog...</div>}>
        {addExpenseDialogOpen && (
          <AddExpenseDialog
            open={addExpenseDialogOpen}
            onClose={() => handleDialogClose(setAddExpenseDialogOpen)}
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
        // Add these 2 props to filter internal MUI props:
        slotProps={{
          root: {
            "data-testid": "snackbar",
            component: "div",
          },
        }}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default ExpenseScreen;
