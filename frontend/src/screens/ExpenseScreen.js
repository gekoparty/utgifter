import React, { useState, useMemo } from "react";
import {
  Box,
  Button,
  MenuItem,
  IconButton,
  Snackbar,
  SnackbarContent,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import ReactTable from "../components/commons/React-Table/react-table";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from 'material-react-table';
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import AddExpenseDialog from "../components/Expenses/ExpenseDialogs/AddExpenseDialog"
import DeleteExpenseDialog from "../components/Expenses/ExpenseDialogs/DeleteExpenseDialog";
import EditExpenseDialog from "../components/Expenses/ExpenseDialogs/EditExpenseDialog";

//test


// Constants
const INITIAL_PAGINATION = {
  pageIndex: 0,
  pageSize: 5,
};
const INITIAL_SORTING = [{ id: "productName", desc: false }];
const INITIAL_SELECTED_EXPENSE = {
  _id: "",                // Assuming `_id` is used elsewhere, if not, you may remove it
  productName: "",
  brandName: "",
  shopName: "",
  locationName: "",
  price: 0,
  volume: 0,
  discountValue: 0,
  discountAmount: 0,      // Add this if it's used in dialogs or forms
  finalPrice: 0,          // Add this if it's used in dialogs or forms
  quantity: 1,            // Add this if it's used in dialogs or forms
  hasDiscount: false,
  purchased: true,
  registeredDate: null,
  purchaseDate: null,
  type: "",
  measurementUnit: "",    // Add this if it's used in dialogs or forms
  pricePerUnit: 0         // Add this if it's used in dialogs or forms
};
const API_URL =
  process.env.NODE_ENV === "production"
    ? "https://www.material-react-table.com"
    : "http://localhost:3000";

const ExpenseScreen = () => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedExpense, setSelectedExpense] = useState(INITIAL_SELECTED_EXPENSE);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [priceStatsByType, setPriceStatsByType] = useState({});

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

  const tableColumns = useMemo(
    () => [
      {
        accessorKey: 'productName',
        header: 'Produkt',
        Cell: ({ row }) => row.original.productName,
        enableColumnPinning: true, // This column can be pinned
      },
      {
        accessorKey: 'brandName',
        header: 'Merke',
        Cell: ({ row }) => row.original.brandName,
        enableColumnPinning: true, // This column can be pinned
      },
      {
        accessorKey: 'price',
        header: 'OriginalPris',
        size: 170,
        Cell: ({ cell }) => (
          <Box>
            {cell.getValue()?.toLocaleString('nb-NO', {
              style: 'currency',
              currency: 'NOK',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Box>
        ),
        enableColumnPinning: true, // This column can be pinned
      },
      {
        accessorKey: 'finalPrice',
        header: 'Kjøpspris',
        Cell: ({ cell }) => (
          <Box>
            {cell.getValue()?.toLocaleString('nb-NO', {
              style: 'currency',
              currency: 'NOK',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Box>
        ),
        enableColumnPinning: true, // This column can be pinned
      },
      {
        accessorKey: 'pricePerUnit',
        header: 'Pris pr kg/l',
        Cell: ({ cell, row }) => {
          const price = cell.getValue();
          const type = row.original.type;
          const stats = priceStatsByType[type] || { min: 0, max: 0, median: 0 };

          console.log(`Price: ${price}, Type: ${type}, Stats:`, stats); // Debug output

          let color = 'yellow'; // Default color

          if (stats.median > 0) {
            if (price <= stats.min + (stats.median - stats.min) / 2) {
              color = 'green'; // Less than median
            } else if (price >= stats.max - (stats.max - stats.median) / 2) {
              color = 'red'; // Greater than median
            }
          }

          return (
            <Box
              component="span"
              sx={{
                backgroundColor: color,
                borderRadius: '0.25rem',
                color: '#fff',
                p: '0.25rem',
              }}
            >
              {price?.toLocaleString('nb-NO', {
                style: 'currency',
                currency: 'NOK',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Box>
          );
        },
        enableColumnPinning: true, // This column can be pinned
      },
      {
        accessorKey: 'discountValue',
        header: '% Rabatt',
        Cell: ({ cell }) => <Box>{`${cell.getValue()} %`}</Box>,
        enableColumnPinning: true, // This column can be pinned
      },
      {
        accessorKey: 'discountAmount',
        header: 'Rabatt kr',
        Cell: ({ cell }) => (
          <Box>
            {cell.getValue()?.toLocaleString('nb-NO', {
              style: 'currency',
              currency: 'NOK',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </Box>
        ),
        enableColumnPinning: true, // This column can be pinned
      },
      {
        accessorKey: 'shopName',
        header: 'Butikk',
        Cell: ({ row }) => row.original.shopName,
        enableColumnPinning: true, // This column can be pinned
      },
      {
        accessorKey: 'locationName',
        header: 'Sted',
        Cell: ({ row }) => row.original.locationName,
        enableColumnPinning: true, // This column can be pinned
      },
      { accessorKey: 'purchaseDate', header: 'Kjøpt dato', enableColumnPinning: true },
      { accessorKey: 'registeredDate', header: 'Registrert dato', enableColumnPinning: true },
      { accessorKey: 'volume', header: 'Størrelse', enableColumnPinning: true },
      { accessorKey: 'type', header: 'Type', enableColumnPinning: true },
    ],
    [priceStatsByType]
  );

  const tableState = {
    columnPinning: { left: ['productName', 'brandName'], right: ['finalPrice'] },
  };

  

  // React Query
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

    const response = await fetch(fetchURL.href);
    const json = await response.json();

    // Calculate price stats by type
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
    console.log("New Expense Data:", newExpense);
    if (!newExpense || !newExpense.productName) {
      console.error("Invalid expense data:", newExpense);
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
    const productName = deletedExpense.productName?.name || deletedExpense.productName;
    showSuccessSnackbar(`Expense "${productName}" deleted successfully`);
    queryClient.invalidateQueries("expenses");
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update expense");
  };

  const editSuccessHandler = (updatedExpense) => {
    showSuccessSnackbar(`Expense ${updatedExpense.productName} updated successfully`);
    queryClient.invalidateQueries("expenses");
    refetch();
  };

  return (
    <TableLayout>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setAddExpenseDialogOpen(true)}
        >
          New Expense
        </Button>
      </Box>

      <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <Box sx={{ width: "100%", minWidth: "500px", boxShadow: 2 }}>
          {expensesData && (
            <ReactTable
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
                console.log("Delete clicked for:", expense);
                setSelectedExpense(expense);
                console.log("Opening delete modal...");
                setDeleteModalOpen(true);
              }}
              editModalOpen={editModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
              initialState={{
                columnPinning: { left: ['productName', 'brandName'], right: ['finalPrice'] },
              }}
            />
          )}
        </Box>
      </Box>

      <DeleteExpenseDialog
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        dialogTitle="Confirm Deletion"
        selectedExpense={selectedExpense}
        onDeleteSuccess={deleteSuccessHandler}
        onDeleteFailure={deleteFailureHandler}
      />

      <EditExpenseDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        selectedExpense={selectedExpense}
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
            <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
              <CloseIcon />
            </IconButton>
          }
        />
      </Snackbar>
      <AddExpenseDialog
        onClose={() => setAddExpenseDialogOpen(false)}
        open={addExpenseDialogOpen}
        onAdd={addExpenseHandler}
      />
    </TableLayout>
  );
};

export default ExpenseScreen;