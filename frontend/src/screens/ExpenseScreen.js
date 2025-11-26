
import { useState, useMemo, lazy, Suspense, useCallback } from "react";
import { Box, Button, Snackbar, Alert, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// Lazy dialogs
const AddExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/AddExpense/AddExpenseDialog")
);
const DeleteExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/DeleteExpense/DeleteExpenseDialog")
);
const EditExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/EditExpense/EditExpenseDialog")
);

// Initial state
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

const ExpenseScreen = () => {
  const theme = useTheme();

  // Table state
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedExpense, setSelectedExpense] = useState(INITIAL_SELECTED_EXPENSE);

  // Dialogs
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addExpenseDialogOpen, setAddExpenseDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Snackbar
  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  const baseQueryKey = useMemo(() => ["expenses", "paginated"], []);

  // Build URL for API
  const expenseUrlBuilder = useCallback((endpoint, params) => {
    const url = new URL(`${API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`);
    url.searchParams.set("start", params.pageIndex * params.pageSize);
    url.searchParams.set("size", params.pageSize);
    url.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
    url.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
    url.searchParams.set("globalFilter", params.globalFilter ?? "");
    return url;
  }, []);

  // Transform API response
  const transformExpenseData = useCallback((json) => {
    const list = json.expenses || json.data || [];
    return {
      expenses: list.map((x) => ({
        _id: x._id,
        productName: x.product?.name || x.productName || "N/A",
        brandName: x.brand?.name || x.brandName || "N/A",
        shopName: x.shop?.name || x.shopName || "N/A",
        locationName: x.location?.name || x.locationName || "N/A",
        price: x.price,
        volume: x.volume,
        discountValue: x.discountValue,
        discountAmount: x.discountAmount,
        finalPrice: x.finalPrice,
        quantity: x.quantity,
        hasDiscount: x.hasDiscount,
        purchased: x.purchased,
        registeredDate: x.registeredDate,
        purchaseDate: x.purchaseDate,
        type: x.type,
        measurementUnit: x.measurementUnit,
        pricePerUnit: x.pricePerUnit,
      })),
      meta: json.meta || { totalRowCount: 0 },
    };
  }, []);

  // Params for hook
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

  const { data: expensesData, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint: "/api/expenses",
    params: fetchParams,
    urlBuilder: expenseUrlBuilder,
    baseQueryKey,
    transformFn: transformExpenseData,
  });

  const tableData = useMemo(() => expensesData?.expenses || [], [expensesData]);
  const metaData = useMemo(() => expensesData?.meta || {}, [expensesData]);

  // Price statistics per type
  const priceStatsByType = useMemo(() => {
    if (!expensesData?.expenses) return {};
    const grouped = expensesData.expenses.reduce((acc, item) => {
      (acc[item.type] = acc[item.type] || []).push(item.pricePerUnit);
      return acc;
    }, {});

    const stats = {};
    Object.entries(grouped).forEach(([type, prices]) => {
      prices.sort((a, b) => a - b);
      stats[type] = {
        min: prices[0],
        max: prices[prices.length - 1],
        median: prices[Math.floor(prices.length / 2)],
      };
    });

    return stats;
  }, [expensesData]);

  // Handlers
  const addExpenseHandler = useCallback(
    (exp) => {
      showSnackbar(`Utgift for "${exp.productName || "Ukjent produkt"}" ble registrert`);
      setAddExpenseDialogOpen(false);
    },
    [showSnackbar]
  );

  const deleteSuccessHandler = useCallback(
    (deletedExpense) => {
      showSnackbar(`Utgift for "${deletedExpense.productName}" slettet`);
      setDeleteModalOpen(false);
    },
    [showSnackbar]
  );

  const editSuccessHandler = useCallback(
    (updatedExpense) => {
      showSnackbar(`Utgift for "${updatedExpense.productName || "Ukjent produkt"}" oppdatert`);
      setEditModalOpen(false);
    },
    [showSnackbar]
  );

  const handleDialogClose = useCallback((setState) => {
    setState(false);
    setSelectedExpense(INITIAL_SELECTED_EXPENSE);
  }, []);

  // Table columns
  const tableColumns = useMemo(
    () => [
      { accessorKey: "productName", header: "Produktnavn" },
      {
        accessorKey: "pricePerUnit",
        header: "Pris per enhet",
        Cell: ({ cell, row }) => {
          const price = cell.getValue();
          const type = row.original.type;
          const stats = priceStatsByType[type] || {};

          let bg = theme.palette.warning.main;
          let fg = theme.palette.warning.contrastText;

          if (stats.median) {
            if (price <= stats.min + (stats.median - stats.min) / 2) {
              bg = theme.palette.success.main;
              fg = theme.palette.success.contrastText;
            } else if (price >= stats.max - (stats.max - stats.median) / 2) {
              bg = theme.palette.error.main;
              fg = theme.palette.error.contrastText;
            }
          }

          return (
            <Box sx={{ backgroundColor: bg, color: fg, px: 0.5, py: 0.25, borderRadius: 1 }}>
              {price.toLocaleString("nb-NO", {
                style: "currency",
                currency: "NOK",
              })}
            </Box>
          );
        },
      },
      { accessorKey: "shopName", header: "Butikk" },
      {
        accessorKey: "purchaseDate",
        header: "Kjøpsdato",
        Cell: ({ cell }) =>
          cell.getValue() ? new Date(cell.getValue()).toLocaleDateString() : "Ugyldig dato",
      },
    ],
    [priceStatsByType, theme]
  );

  return (
    <TableLayout>
      <Button variant="contained" sx={{ mb: 2 }} onClick={() => setAddExpenseDialogOpen(true)}>
        Legg til ny utgift
      </Button>

      <ReactTable
        data={tableData}
        columns={tableColumns}
        isError={isError}
        isLoading={isLoading}
        isFetching={isFetching}
        meta={metaData}
        columnFilters={columnFilters}
        globalFilter={globalFilter}
        pagination={pagination}
        sorting={sorting}
        setColumnFilters={setColumnFilters}
        setGlobalFilter={setGlobalFilter}
        setPagination={setPagination}
        setSorting={setSorting}
        refetch={refetch}
        renderDetailPanel={({ row }) => <DetailPanel expense={row.original} />}
        handleEdit={(exp) => {
          setSelectedExpense(exp);
          setEditModalOpen(true);
        }}
        handleDelete={(exp) => {
          setSelectedExpense(exp);
          setDeleteModalOpen(true);
        }}
      />

      {/* Dialogs */}
      <Suspense fallback={<div>Laster...</div>}>
        {selectedExpense._id && (
          <EditExpenseDialog
            open={editModalOpen}
            onClose={() => handleDialogClose(setEditModalOpen)}
            selectedExpense={selectedExpense}
            onUpdateSuccess={editSuccessHandler}
          />
        )}
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <DeleteExpenseDialog
          open={deleteModalOpen}
          onClose={() => handleDialogClose(setDeleteModalOpen)}
          selectedExpense={selectedExpense}
          onDeleteSuccess={deleteSuccessHandler}
        />
      </Suspense>

      <Suspense fallback={<div>Laster...</div>}>
        <AddExpenseDialog
          open={addExpenseDialogOpen}
          onClose={() => handleDialogClose(setAddExpenseDialogOpen)}
          onAdd={addExpenseHandler}
        />
      </Suspense>

      {/* Snackbar */}
      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          variant="filled"
          action={
            <IconButton size="small" color="inherit" onClick={handleSnackbarClose}>
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default ExpenseScreen;

