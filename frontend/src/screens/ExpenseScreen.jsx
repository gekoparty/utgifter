import React, {
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Box, Button, Collapse, Stack } from "@mui/material";
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
import { requestJson } from "../api/httpClient";
import useSnackBar from "../hooks/useSnackBar";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { useAppPreferences } from "../store/Store";
import { useTranslation } from "../i18n/useTranslation";

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

const monthLabel = (month) => {
  const parsed = dayjs(`${month}-01`);
  return parsed.isValid() ? parsed.format("MMMM YYYY") : month;
};

const isSupportedUrlFilter = (filterId) =>
  ["productName", "brandName", "shopName", "locationName", "category", "productCategory"].includes(filterId);

const hasTextValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const isDateValue = (value) =>
  typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && dayjs(value).isValid();

const isPhantomDateRange = (value) =>
  Array.isArray(value) &&
  value[0] === "2001-01-01" &&
  value[1] === "2001-01-31";

const sanitizeFilters = (filters) =>
  (Array.isArray(filters) ? filters : []).reduce((acc, filter) => {
    if (!filter?.id) return acc;

    if (
      ["displayPrice", "price", "pricePerUnit", "finalPrice"].includes(filter.id) &&
      filter.value &&
      typeof filter.value === "object" &&
      !Array.isArray(filter.value)
    ) {
      if (hasTextValue(filter.value.min) || hasTextValue(filter.value.max)) {
        acc.push(filter);
      }
      return acc;
    }

    if (["purchaseDate", "registeredDate"].includes(filter.id)) {
      if (isPhantomDateRange(filter.value)) return acc;

      if (Array.isArray(filter.value) && filter.value.some(isDateValue)) {
        acc.push({
          ...filter,
          value: filter.value.map((value) => (isDateValue(value) ? value : "")),
        });
      } else if (isDateValue(filter.value)) {
        acc.push(filter);
      }
      return acc;
    }

    if (
      ["productName", "variantName", "brandName", "shopName", "locationName", "category", "productCategory"].includes(
        filter.id,
      ) &&
      hasTextValue(filter.value)
    ) {
      acc.push(filter);
    }

    return acc;
  }, []);

const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const buildInitialFilters = (searchParams) => {
  const filters = [];
  const month = searchParams.get("month");
  const range = monthDateRange(month);
  if (range) filters.push({ id: "purchaseDate", value: range });

  const filterId = searchParams.get("filterId");
  const filterValue = searchParams.get("filterValue");
  if (isSupportedUrlFilter(filterId) && filterValue) {
    filters.push({ id: filterId, value: filterValue });
  }

  return sanitizeFilters(filters);
};

const ExpenseScreen = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchKey = searchParams.toString();
  const { preferences, setPreference } = useAppPreferences();
  const { t } = useTranslation();
  const initialPageSize =
    Number(preferences.rowsPerPage) > 0
      ? Number(preferences.rowsPerPage)
      : INITIAL_PAGINATION.pageSize;

  const [columnFilters, setColumnFiltersState] = useState(() => buildInitialFilters(searchParams));
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
  const openingExpenseIdRef = useRef(null);
  const [priceDisplayMode, setPriceDisplayMode] = useState("pricePerUnit");

  const { showSnackbar } = useSnackBar();

  const setColumnFilters = useCallback((nextValue) => {
    setColumnFiltersState((current) => {
      const resolved = typeof nextValue === "function" ? nextValue(current) : nextValue;
      const cleaned = sanitizeFilters(resolved);
      return sameJson(current, cleaned) ? current : cleaned;
    });
  }, []);

  useEffect(() => {
    const nextSearchParams = new URLSearchParams(searchKey);
    const nextFilters = buildInitialFilters(nextSearchParams);
    const nextGlobalFilter = nextSearchParams.get("q") || "";

    setColumnFiltersState((current) =>
      sameJson(current, nextFilters) ? current : nextFilters,
    );
    setGlobalFilter((current) =>
      current === nextGlobalFilter ? current : nextGlobalFilter,
    );
    setPagination((current) =>
      current.pageIndex === 0 ? current : { ...current, pageIndex: 0 },
    );
  }, [searchKey]);

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

  const activeColumnFilters = useMemo(() => sanitizeFilters(columnFilters), [columnFilters]);

  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: activeColumnFilters,
      globalFilter: deferredGlobalFilter,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      activeColumnFilters,
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
    openingExpenseIdRef.current = null;

    if (searchParams.has("openExpense")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("openExpense");
      setSearchParams(nextParams, { replace: true });
    }
  }, [activeModal, searchParams, setSearchParams]);

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
      showSnackbar(t("expenses.success", { name: expenseName || t("expenses.productUnknown"), action }));
      handleDialogClose();
    },
    [showSnackbar, handleDialogClose, t],
  );

  const handleError = useCallback(
    (action) => {
      showSnackbar(t("expenses.failedAction", { action }), "error");
      handleDialogClose();
    },
    [showSnackbar, handleDialogClose, t],
  );

  useEffect(() => {
    const openExpenseId = searchParams.get("openExpense");
    if (!openExpenseId || openingExpenseIdRef.current === openExpenseId || selectedExpense?._id === openExpenseId) return;

    let ignore = false;
    openingExpenseIdRef.current = openExpenseId;
    loadExpenseDialog();

    requestJson(`/api/expenses/${openExpenseId}`)
      .then((expense) => {
        if (ignore) return;
        setSelectedExpense(transformExpenseData({ expenses: [expense] })?.expenses?.[0] || expense);
        setActiveModal("EDIT");
      })
      .catch(() => {
        if (!ignore) showSnackbar(t("expenses.failedOpen"), "error");
      })
      .finally(() => {
        if (!ignore && openingExpenseIdRef.current === openExpenseId) {
          openingExpenseIdRef.current = null;
        }
      });

    return () => {
      ignore = true;
      if (openingExpenseIdRef.current === openExpenseId) {
        openingExpenseIdRef.current = null;
      }
    };
  }, [searchParams, selectedExpense?._id, showSnackbar, t]);

  const tableColumns = useExpenseTableColumns({
    priceDisplayMode,
    priceStatsByType,
    onPriceFilterModeChange: handlePriceFilterModeChange,
  });

  const urlMonth = searchParams.get("month");
  const urlFilterLabel = searchParams.get("filterValue");
  const activeFilterCount = activeColumnFilters.length + (deferredGlobalFilter ? 1 : 0);
  const hasUrlFilters = Boolean(urlMonth || urlFilterLabel || searchParams.get("q"));
  const clearAllFilters = useCallback(() => {
    setColumnFiltersState([]);
    setGlobalFilter("");
    setSearchParams({});
  }, [setSearchParams]);

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
        ariaLabel={t("expenses.priceView")}
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
        {dashboardOpen ? t("actions.hideStats") : t("actions.showStats")}
      </Button>
    </Stack>
  );

  return (
    <AppScreen
      title={t("expenses.title")}
      subtitle={t("expenses.subtitle")}
      icon={<ReceiptLongRoundedIcon />}
      actionLabel={t("expenses.newExpense")}
      actionIcon={<AddIcon />}
      onAction={openAdd}
      summaryItems={[
        { label: t("common.total"), value: metaData?.totalRowCount ?? 0 },
        { label: t("common.showing"), value: tableData.length },
        { label: t("common.filters"), value: activeFilterCount },
      ]}
      workflow={{
        question: t("expenses.question"),
        answer: t("expenses.answer"),
        steps: [t("expenses.stepFind"), t("expenses.stepDetails"), t("expenses.stepFix")],
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

      {activeFilterCount > 0 ? (
        <Alert
          severity="info"
          variant="outlined"
          action={
            <Button color="inherit" size="small" onClick={clearAllFilters}>
              {t("actions.showAll")}
            </Button>
          }
        >
          {hasUrlFilters
            ? urlMonth
              ? t("expenses.filteredFor", {
                  month: monthLabel(urlMonth),
                  suffix: urlFilterLabel ? `: ${urlFilterLabel}` : "",
                })
              : t("expenses.filteredBy", { filter: urlFilterLabel || deferredGlobalFilter })
            : t("expenses.filtered")}
        </Alert>
      ) : null}

      <TableLayout>
        <ReactTable
          data={tableData}
          columns={tableColumns}
          meta={metaData}
          error={error}
          isError={isError}
          isLoading={isLoading}
          isFetching={!activeModal && isFetching}
          columnFilters={activeColumnFilters}
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
                t("expenses.productUnknown");

              if (activeModal === "ADD") handleSuccess(t("expenses.actionRegistered"), name);
              if (activeModal === "EDIT") handleSuccess(t("expenses.actionUpdated"), name);
              if (activeModal === "DELETE") handleSuccess(t("expenses.actionDeleted"), name);
            }}
            onError={() => {
              if (activeModal === "ADD") handleError(t("expenses.actionRegister"));
              if (activeModal === "EDIT") handleError(t("expenses.actionUpdate"));
              if (activeModal === "DELETE") handleError(t("expenses.actionDelete"));
            }}
          />
        )}
      </Suspense>

    </AppScreen>
  );
};

export default ExpenseScreen;
