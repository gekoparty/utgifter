import React, { useState, useMemo, useCallback } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useTheme } from "@mui/material/styles";
import AddExpenseDialog from "../components/Expenses/ExpenseDialogs/AddExpenseDialog";
import DeleteExpenseDialog from "../components/Expenses/ExpenseDialogs/DeleteExpenseDialog";
import EditExpenseDialog from "../components/Expenses/ExpenseDialogs/EditExpenseDialog";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";

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

// Debounced Price Range Filter Component
const PriceRangeFilter = ({ value, onChange }) => {
  const handleSliderChange = (event, newValue) => {
    onChange(newValue);
  };

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
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedExpense, setSelectedExpense] = useState(
    INITIAL_SELECTED_EXPENSE
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [priceRangeFilter, setPriceRangeFilter] = useState([0, 1000]);
  const [priceStatsByType, setPriceStatsByType] = useState({});

  const theme = useTheme();

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

  const renderDetailPanel = useCallback(
    ({ row }) => <DetailPanel row={row} data-testid="detail-panel" />,
    []
  );

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
  
          let backgroundColor = theme.palette.warning.main; // Default to warning
          let textColor = theme.palette.warning.contrastText; // Default contrast text
  
          if (stats.median > 0) {
            if (price <= stats.min + (stats.median - stats.min) / 2) {
              backgroundColor = theme.palette.success.main; // Use success color
              textColor = theme.palette.success.contrastText; // Success text contrast
            } else if (price >= stats.max - (stats.max - stats.median) / 2) {
              backgroundColor = theme.palette.error.main; // Use error color
              textColor = theme.palette.error.contrastText; // Error text contrast
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
        filterVariant: "date",
        Cell: ({ cell }) => {
          const dateValue = cell.getValue(); // Ensure this is a valid date string
          return dateValue ? new Date(dateValue).toLocaleDateString() : "Invalid Date";
        },
      }
    ],
    [priceStatsByType, priceRangeFilter]
  );

  const queryClient = useQueryClient();
  const queryKey = [
    "expenses",
    columnFilters,
    globalFilter,
    pagination.pageIndex,
    pagination.pageSize,
    sorting,
  ];

  const fetchExpenses = async () => {
    const fetchURL = new URL("/api/expenses", API_URL);
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
    fetchURL.searchParams.set("minPrice", `${priceRangeFilter[0]}`);
    if (priceRangeFilter[1] < 1000) {
      fetchURL.searchParams.set("maxPrice", `${priceRangeFilter[1]}`);
    }

    const response = await fetch(fetchURL.href);
    const json = await response.json();

    const stats = calculatePriceStatsByType(json.expenses);
    setPriceStatsByType(stats);

    return { expenses: json.expenses, meta: json.meta };
  };

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

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const addExpenseHandler = (newExpense) => {
    if (!newExpense || !newExpense.productName) {
      showErrorSnackbar("Failed to add expense due to missing product name.");
      return;
    }
    showSuccessSnackbar(`Expense ${newExpense.productName} added successfully`);
    queryClient.invalidateQueries("expenses");
    refetch();
  };

  const deleteFailureHandler = (failedExpense) => {
    showErrorSnackbar(`Failed to delete expense ${failedExpense.productName}`);
  };

  const deleteSuccessHandler = (deletedExpense) => {
    const productName =
      deletedExpense.productName?.name || deletedExpense.productName;
    showSuccessSnackbar(`Expense "${productName}" deleted successfully`);
    queryClient.invalidateQueries("expenses");
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update expense");
  };

  const editSuccessHandler = (updatedExpense) => {
    showSuccessSnackbar(
      `Expense ${updatedExpense.productName} updated successfully`
    );
    queryClient.invalidateQueries("expenses");
    refetch();
  };

  const debouncedRefetch =
    (debounce(() => {
      refetch();
    }, 1000),
    []);

  const handlePriceRangeChange = (newRange) => {
    setPriceRangeFilter(newRange);
    debouncedRefetch();
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
          New Expense
        </Button>
        <PriceRangeFilter
          value={priceRangeFilter}
          onChange={handlePriceRangeChange}
          data-testid="price-range-filter"
        />
      </Box>

      <Box
        sx={{ width: "100%", display: "flex", justifyContent: "center", boxShadow: 2  }}
        data-testid="table-wrapper"
      >
          {expensesData && (
            <ReactTable
              muiTableContainerProps={{
                sx: {
                  width: "100%", // Ensure table spans full width
                  overflowX: "auto", // Prevent horizontal overflow
                },
                "data-testid": "mui-table-container",
              }}
              muiTopToolbarProps={{
                sx: {
                  width: "100%", // Ensure the toolbar spans the full width
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
              rowCount={expensesData?.meta?.totalRowCount ?? 0}
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

      <DeleteExpenseDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        dialogTitle="Confirm Deletion"
        selectedExpense={selectedExpense}
        onDeleteSuccess={deleteSuccessHandler}
        onDeleteFailure={deleteFailureHandler}
        data-testid="delete-expense-dialog"
      />

      <EditExpenseDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        selectedExpense={selectedExpense}
        onUpdateSuccess={editSuccessHandler}
        onUpdateFailure={editFailureHandler}
        data-testid="edit-expense-dialog"
      />

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
              : theme.palette.info.main, // Default to info if no severity
          color: theme.palette.success.contrastText, // Use theme-based text contrast color
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
      {addExpenseDialogOpen && (
        <AddExpenseDialog
          onClose={() => setAddExpenseDialogOpen(false)}
          open={addExpenseDialogOpen}
          onAdd={addExpenseHandler}
          data-testid="add-expense-dialog"
        />
      )}
    </TableLayout>
  );
};
export default ExpenseScreen;
