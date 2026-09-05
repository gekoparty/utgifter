import React, {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Box, Button, Collapse, Stack } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { useSearchParams } from "react-router-dom";
import dayjs from "dayjs";

import AppScreen from "../components/commons/Layout/AppScreen";
import SegmentedControl from "../components/commons/Controls/SegmentedControl";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";
import { buildPaginatedUrl } from "../components/commons/EntityTableScreen/buildPaginatedUrl";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { useAppPreferences } from "../store/Store";

import {
  DEFAULT_COLUMN_VISIBILITY,
  EXPENSES_QUERY_KEY,
  INITIAL_PAGINATION,
  INITIAL_SELECTED_EXPENSE,
  INITIAL_SORTING,
  PRICE_MODE_LABELS,
} from "../features/Expenses/constants/expenseScreenConstants";
import { useExpenseTableColumns } from "../features/Expenses/hooks/useExpenseTableColumns";
import {
  clearAddExpenseDialogOpen,
  markAddExpenseDialogOpen,
  shouldRestoreAddExpenseDialog,
} from "../features/Expenses/utils/expenseDraft";
import { transformExpenseData } from "../features/Expenses/utils/expenseTransform";

const loadExpenseDialog = () =>
  import("../features/Expenses/components/ExpenseDialog/ExpenseDialog");

const ExpenseDialog = lazy(loadExpenseDialog);

const ExpenseDashboard = lazy(() =>
  import("../features/Expenses/components/ExpenseDashboard/ExpenseDashboard")
);

const monthDateRange = (month) => {
  const parsed = dayjs(`${month}-01`);
  if (!parsed.isValid()) return null;
  return [parsed.startOf("month").format("YYYY-MM-DD"), parsed.endOf("month").format("YYYY-MM-DD")];
};

const buildInitialFilters = (searchParams) => {
  const filters = [];
  const month = searchParams.get("month");
  const range = monthDateRange(month);
  if (range) filters.push({ id: "purchaseDate", value: range });

  const filterId = searchParams.get("filterId");
  const filterValue = searchParams.get("filterValue");
  if (filterId && filterValue) filters.push({ id: filterId, value: filterValue });

  return filters;
};

const ExpenseScreen = () => {
  const [searchParams] = useSearchParams();
  const { preferences, setPreference } = useAppPreferences();
  const initialPageSize =
    Number(preferences.rowsPerPage) > 0
      ? Number(preferences.rowsPerPage)
      : INITIAL_PAGINATION.pageSize;

  const [columnFilters, setColumnFilters] = useState(() => buildInitialFilters(searchParams));
  const [globalFilter, setGlobalFilter] = useState(() => searchParams.get("q") || "");
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(() => ({
    ...INITIAL_PAGINATION,
    pageSize: initialPageSize,
  }));
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(() =>
    shouldRestoreAddExpenseDialog() ? "ADD" : null,
  );
  const [selectedExpense, setSelectedExpense] = useState(
    INITIAL_SELECTED_EXPENSE,
  );
  const [priceDisplayMode, setPriceDisplayMode] = useState("pricePerUnit");

  const { showSnackbar } = useSnackBar();

  useEffect(() => {
    setColumnFilters(buildInitialFilters(searchParams));
    setGlobalFilter(searchParams.get("q") || "");
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [searchParams]);

  const columnVisibility = useMemo(
    () => ({
      ...DEFAULT_COLUMN_VISIBILITY,
      ...(preferences.expenseColumnVisibility || {}),
    }),
    [preferences.expenseColumnVisibility],
  );

  const setColumnVisibility = useCallback(
    (nextValue) => {
      const resolved =
        typeof nextValue === "function"
          ? nextValue(columnVisibility)
          : nextValue;

      setPreference("expenseColumnVisibility", {
        ...DEFAULT_COLUMN_VISIBILITY,
        ...(resolved || {}),
      });
    },
    [columnVisibility, setPreference],
  );

  useEffect(() => {
    if (pagination.pageSize && pagination.pageSize !== preferences.rowsPerPage) {
      setPreference("rowsPerPage", pagination.pageSize);
    }
  }, [pagination.pageSize, preferences.rowsPerPage, setPreference]);

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
    if (activeModal === "ADD") clearAddExpenseDialogOpen();
    setActiveModal(null);
    setSelectedExpense(INITIAL_SELECTED_EXPENSE);
  }, [activeModal]);

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

  const openAdd = useCallback(() => {
    markAddExpenseDialogOpen();
    setActiveModal("ADD");
  }, []);

  useEffect(() => {
    if (activeModal !== "ADD") return;
    markAddExpenseDialogOpen();
    loadExpenseDialog();
  }, [activeModal]);

  useEffect(() => {
    const restoreAddDialog = () => {
      if (activeModal || !shouldRestoreAddExpenseDialog()) return;
      setActiveModal("ADD");
    };

    window.addEventListener("pageshow", restoreAddDialog);
    document.addEventListener("visibilitychange", restoreAddDialog);

    return () => {
      window.removeEventListener("pageshow", restoreAddDialog);
      document.removeEventListener("visibilitychange", restoreAddDialog);
    };
  }, [activeModal]);

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

  const priceModeOptions = Object.entries(PRICE_MODE_LABELS).map(([mode, label]) => ({
    value: mode,
    label,
  }));

  const filters = (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1}
      justifyContent="space-between"
      alignItems={{ xs: "stretch", md: "center" }}
    >
      <SegmentedControl
        value={priceDisplayMode}
        onChange={(value) => handlePriceModeChange(null, value)}
        options={priceModeOptions}
        ariaLabel="Prisvisning"
        fullWidth
        sx={(theme) => ({
          width: { xs: "100%", md: "auto" },
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(255,255,255,0.04)"
              : "rgba(15,23,42,0.035)",
          border: "1px solid",
          borderColor: theme.palette.divider,
          borderRadius: 999,
          p: 0.25,
          "& .MuiToggleButton-root": {
            border: 0,
            borderRadius: 999,
            color: "text.secondary",
            fontWeight: 800,
            px: 1.5,
            py: 0.35,
            width: { xs: "33.333%", md: "auto" },
            "&.Mui-selected": {
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            },
          },
        })}
      />

      <Button
        size="small"
        variant={dashboardOpen ? "contained" : "outlined"}
        startIcon={<DashboardIcon />}
        onClick={() => setDashboardOpen((value) => !value)}
        sx={{
          borderRadius: 999,
          fontWeight: 800,
          whiteSpace: "nowrap",
        }}
      >
        {dashboardOpen ? "Skjul statistikk" : "Vis statistikk"}
      </Button>
    </Stack>
  );

  return (
    <AppScreen
      title="Utgifter"
      subtitle="Registrer, filtrer og følg opp alle kjøp."
      icon={<ReceiptLongRoundedIcon />}
      actionLabel="Ny utgift"
      actionIcon={<AddIcon />}
      onAction={openAdd}
      summaryItems={[
        { label: "Totalt", value: metaData?.totalRowCount ?? 0 },
        { label: "Viser", value: tableData.length },
        { label: "Filtre", value: columnFilters.length + (deferredGlobalFilter ? 1 : 0) },
      ]}
      workflow={{
        question: "Hva kjøpte jeg, og hva må rettes?",
        answer: "Start med listen, åpne raden for detaljer, og bruk statistikken når du vil se mønsteret bak kjøpene.",
        steps: ["Finn kjøp", "Sjekk detaljer", "Rett pris eller kategori"],
      }}
      filters={filters}
      maxWidth={1360}
    >

      <Collapse in={dashboardOpen} timeout={350} unmountOnExit>
        <Box sx={{ mb: 2 }}>
          <Suspense fallback={null}>
            <ExpenseDashboard />
          </Suspense>
        </Box>
      </Collapse>

      <TableLayout>
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
      </TableLayout>

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

    </AppScreen>
  );
};

export default ExpenseScreen;
