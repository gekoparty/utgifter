import React, {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Box, Collapse } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";
import { buildPaginatedUrl } from "../components/commons/EntityTableScreen/buildPaginatedUrl";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";

import ExpenseScreenHeader from "../features/Expenses/components/ExpenseScreenHeader";
import {
  DEFAULT_COLUMN_VISIBILITY,
  EXPENSES_QUERY_KEY,
  INITIAL_PAGINATION,
  INITIAL_SELECTED_EXPENSE,
  INITIAL_SORTING,
} from "../features/Expenses/constants/expenseScreenConstants";
import { useExpenseTableColumns } from "../features/Expenses/hooks/useExpenseTableColumns";
import {
  readColumnVisibility,
  writeColumnVisibility,
} from "../features/Expenses/utils/columnVisibilityStorage";
import { transformExpenseData } from "../features/Expenses/utils/expenseTransform";

const loadExpenseDialog = () =>
  import("../features/Expenses/components/ExpenseDialog/ExpenseDialog");

const ExpenseDialog = lazy(loadExpenseDialog);

const ExpenseDashboard = lazy(() =>
  import("../features/Expenses/components/ExpenseDashboard/ExpenseDashboard")
);

const ExpenseScreen = () => {
  const theme = useTheme();
  const palette = theme.palette;

  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(
    INITIAL_SELECTED_EXPENSE,
  );
  const [priceDisplayMode, setPriceDisplayMode] = useState("pricePerUnit");
  const [columnVisibility, setColumnVisibility] = useState(() =>
    readColumnVisibility(DEFAULT_COLUMN_VISIBILITY),
  );

  const { showSnackbar } = useSnackBar();

  useEffect(() => {
    writeColumnVisibility(columnVisibility);
  }, [columnVisibility]);

  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter: deferredGlobalFilter,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      deferredGlobalFilter,
    ],
  );

  const {
    data: expensesData,
    error,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/expenses",
    params: fetchParams,
    urlBuilder: buildPaginatedUrl,
    baseQueryKey: EXPENSES_QUERY_KEY,
    transformFn: transformExpenseData,
  });

  const tableData = expensesData?.expenses ?? [];
  const metaData = expensesData?.meta ?? {};
  const deferredExpenses = useDeferredValue(expensesData?.expenses);

  const priceStatsByType = useMemo(() => {
    const list = deferredExpenses;
    if (!list?.length) return {};

    const grouped = list.reduce((acc, item) => {
      if (typeof item.pricePerUnit !== "number") return acc;
      const key = item.variantName || "Ukjent";
      (acc[key] = acc[key] || []).push(item.pricePerUnit);
      return acc;
    }, {});

    return Object.fromEntries(
      Object.entries(grouped).map(([type, prices]) => {
        const sorted = [...prices].sort((a, b) => a - b);
        return [
          type,
          {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            median: sorted[Math.floor(sorted.length / 2)],
          },
        ];
      }),
    );
  }, [deferredExpenses]);

  const handleDialogClose = useCallback(() => {
    setActiveModal(null);
    setSelectedExpense(INITIAL_SELECTED_EXPENSE);
  }, []);

  const handlePriceFilterModeChange = useCallback((newMode) => {
    if (newMode === "all") return;
    setPriceDisplayMode(
      ["pricePerUnit", "finalPrice", "price"].includes(newMode)
        ? newMode
        : "pricePerUnit",
    );
  }, []);

  const handlePriceModeChange = useCallback(
    (event, newMode) => {
      if (newMode) handlePriceFilterModeChange(newMode);
    },
    [handlePriceFilterModeChange],
  );

  const handleSuccess = useCallback(
    (action, expenseName) => {
      showSnackbar(`Utgift for "${expenseName || "Ukjent produkt"}" ${action}`);
      handleDialogClose();
    },
    [showSnackbar, handleDialogClose],
  );

  const handleError = useCallback(
    (action) => {
      showSnackbar(`Klarte ikke å ${action} utgiften. Prøv igjen.`, "error");
      handleDialogClose();
    },
    [showSnackbar, handleDialogClose],
  );

  const tableColumns = useExpenseTableColumns({
    priceDisplayMode,
    priceStatsByType,
    onPriceFilterModeChange: handlePriceFilterModeChange,
  });

  const canOpenEditOrDelete = Boolean(selectedExpense?._id);

  const openAdd = useCallback(() => setActiveModal("ADD"), []);

  const openEdit = useCallback((expense) => {
    loadExpenseDialog();
    setSelectedExpense(expense);
    setActiveModal("EDIT");
  }, []);

  const openDelete = useCallback((expense) => {
    loadExpenseDialog();
    setSelectedExpense(expense);
    setActiveModal("DELETE");
  }, []);

  const dialogOpen =
    Boolean(activeModal) && (activeModal === "ADD" || canOpenEditOrDelete);

  return (
    <TableLayout>
      <ExpenseScreenHeader
        dashboardOpen={dashboardOpen}
        onAdd={openAdd}
        onPriceModeChange={handlePriceModeChange}
        onToggleDashboard={() => setDashboardOpen((value) => !value)}
        palette={palette}
        priceDisplayMode={priceDisplayMode}
        totalRowCount={metaData?.totalRowCount ?? 0}
      />

      <Collapse in={dashboardOpen} timeout={350} unmountOnExit>
        <Box sx={{ mb: 2 }}>
          <Suspense fallback={null}>
            <ExpenseDashboard />
          </Suspense>
        </Box>
      </Collapse>

      <ReactTable
        data={tableData}
        columns={tableColumns}
        meta={metaData}
        error={error}
        isError={isError}
        isLoading={isLoading}
        isFetching={!activeModal && isFetching}
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
        handleEdit={openEdit}
        handleDelete={openDelete}
        columnVisibility={columnVisibility}
        setColumnVisibility={setColumnVisibility}
        resource="expenses"
      />

      <Suspense fallback={null}>
        {dialogOpen && (
          <ExpenseDialog
            open
            mode={activeModal}
            expenseToEdit={activeModal === "ADD" ? null : selectedExpense}
            onClose={handleDialogClose}
            onSuccess={(payload) => {
              const name =
                payload?.productName?.name ||
                payload?.productName ||
                selectedExpense?.productName ||
                "Ukjent produkt";

              if (activeModal === "ADD") handleSuccess("registrert", name);
              if (activeModal === "EDIT") handleSuccess("oppdatert", name);
              if (activeModal === "DELETE") handleSuccess("slettet", name);
            }}
            onError={() => {
              if (activeModal === "ADD") handleError("registrere");
              if (activeModal === "EDIT") handleError("oppdatere");
              if (activeModal === "DELETE") handleError("slette");
            }}
          />
        )}
      </Suspense>

    </TableLayout>
  );
};

export default ExpenseScreen;
