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
import AddExpenseDialog from "../components/Expenses/ExpenseDialogs/AddExpenseDialog"
import DeleteExpenseDialog from "../components/Expenses/ExpenseDialogs/DeleteExpenseDialog";
//import EditExpenseDialog from "../components/Expenses/ExpenseDialogs/EditExpenseDialog";


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

  const tableColumns = useMemo(
    () => [
      { 
        accessorKey: "productName.name", 
        header: "Produkt", 
        // If you have nested accessor, ensure the table supports nested object access
        Cell: ({ row }) => row.original.productName.name // Adjust if needed based on your table library
      },
      { 
        accessorKey: "brandName.name", 
        header: "Merke",
        Cell: ({ row }) => row.original.brandName.name // Adjust as necessary
      },
      { 
        accessorKey: "shopName.name", 
        header: "Butikk", 
        Cell: ({ row }) => row.original.shopName.name // Adjust as necessary
      },
      { 
        accessorKey: "locationName.name", 
        header: "Sted", 
        Cell: ({ row }) => row.original.locationName.name // Adjust as necessary
      },
      { accessorKey: "price", header: "OrignalPris" },
      { accessorKey: "pricePerUnit", header: "Pris pr kg/l" },
      { accessorKey: "volume", header: "Størrelse" },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "registeredDate", header: "Registrert" },
      { accessorKey: "purchaseDate", header: "Kjøpt" },
      { accessorKey: "finalPrice", header: "Kjøpspris" },
      { accessorKey: "discountValue", header: "Rabatt" },
      { accessorKey: "discountAmount", header: "Rabatt i kr" },
      { accessorKey: "purchased", header: "Kjøpt" },
    ],
    []
  );

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
    showSuccessSnackbar(`Expense ${deletedExpense.productName} deleted successfully`);
    queryClient.invalidateQueries("expenses");
    refetch();
  };

  const editFailureHandler = () => {
    showErrorSnackbar("Failed to update expense");
  };

  const editSuccessHandler = (selectedExpense) => {
    showSuccessSnackbar(`Expense ${selectedExpense.productName} updated successfully`);
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
                setSelectedExpense(expense);
                setDeleteModalOpen(true);
              }}
              editModalOpen={editModalOpen}
              setDeleteModalOpen={setDeleteModalOpen}
            />
          )}
        </Box>
      </Box>

      <DeleteExpenseDialog
  open={deleteModalOpen}
  onClose={() => setDeleteModalOpen(false)}
  dialogTitle="Confirm Deletion"
  selectedExpense={selectedExpense} // Corrected prop name
  onDeleteSuccess={deleteSuccessHandler}
  onDeleteFailure={deleteFailureHandler}
/>

      {/* EditExpenseDialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        cancelButton={<Button onClick={() => setEditModalOpen(false)}>Cancel</Button>}
        dialogTitle="Edit Expense"
        selectedExpense={selectedExpense}
        onUpdateSuccess={editSuccessHandler}
        onUpdateFailure={editFailureHandler}
      />  */}

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
  onAdd={addExpenseHandler}  // Ensure this is correctly passed
/>
    </TableLayout>
  );
};

export default ExpenseScreen;