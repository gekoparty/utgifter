// ExpenseScreen.jsx
// React 19 + MUI 7 + React Query v5 + MRT v3.2.1 (optimized, unified ExpenseDialog)
import React, {
  useMemo,
  useState,
  lazy,
  Suspense,
  useDeferredValue,
  useCallback,
  useEffect,
} from "react";
import {
  Popover,
  Typography,
  TextField,
  Box,
  Button,
  Snackbar,
  Alert,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
} from "@mui/material";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import { useTheme } from "@mui/material/styles";

import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { API_URL } from "../components/commons/Consts/constants";

// ------------------------------------------------------
// Lazy unified dialog + preloading
// ------------------------------------------------------
const loadExpenseDialog = () =>
  import("../components/features/Expenses/components/ExpenseDialog/ExpenseDialog");
const ExpenseDialog = lazy(loadExpenseDialog);

// ------------------------------------------------------
// Constants
// ------------------------------------------------------
const EXPENSES_QUERY_KEY = ["expenses", "paginated"];

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
  purchased: false,
  registeredDate: null,
  purchaseDate: null,

  variant: "",
  variantName: "",

  measurementUnit: "",
  pricePerUnit: 0,

  // ✅ add these (from expenses API)
  variants: [],     // [{_id,name}]
  measures: [],     // e.g. [0.5, 1, 2]
};

// Currency formatter (avoid toLocaleString per cell)
const NOK = new Intl.NumberFormat("nb-NO", { style: "currency", currency: "NOK" });

// ------------------------------------------------------
// URL builder
// ------------------------------------------------------
const expenseUrlBuilder = (endpoint, params) => {
  const url = new URL(`${API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`);
  url.searchParams.set("start", params.pageIndex * params.pageSize);
  url.searchParams.set("size", params.pageSize);
  url.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  url.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  url.searchParams.set("globalFilter", params.globalFilter ?? "");
  return url;
};

// ------------------------------------------------------
// Transform (keep stable shape for table)
const transformExpenseData = (json) => {
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

      variant: x.variant || "",
      variantName: x.variantName || "",

      measurementUnit: x.measurementUnit,
      pricePerUnit: x.pricePerUnit,

      // ✅ carry these through so EDIT works even if product not in productOptions page
      variants: Array.isArray(x.variants) ? x.variants : [],
      measures: Array.isArray(x.measures) ? x.measures : [],
    })),
    meta: json.meta || { totalRowCount: 0 },
  };
};

// ------------------------------------------------------
// Filters (memoized for smooth UX)
// ------------------------------------------------------
const DateRangeFilter = React.memo(function DateRangeFilter({ column }) {
  const filterValue = column.getFilterValue() || ["", ""];
  const [localDateRange, setLocalDateRange] = useState(filterValue);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = useCallback(
    (event) => {
      setAnchorEl(event.currentTarget);
      setLocalDateRange(column.getFilterValue() || ["", ""]);
    },
    [column]
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleLocalChange = useCallback((index, newValue) => {
    setLocalDateRange((prev) => {
      const next = [...prev];
      next[index] = newValue;
      return next;
    });
  }, []);

  const applyFilter = useCallback(() => {
    const valueToSet = !localDateRange[0] && !localDateRange[1] ? undefined : localDateRange;
    column.setFilterValue(valueToSet);
    handleClose();
  }, [column, handleClose, localDateRange]);

  const clearFilter = useCallback(() => {
    setLocalDateRange(["", ""]);
    column.setFilterValue(undefined);
    handleClose();
  }, [column, handleClose]);

  const isActive = Boolean(filterValue[0] || filterValue[1]);

  return (
    <>
      <IconButton onClick={handleClick} size="small" color={isActive ? "primary" : "default"}>
        <FilterListIcon fontSize="small" />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2, width: 220 }}>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            Velg periode
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Fra dato"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={localDateRange[0] || ""}
              onChange={(e) => handleLocalChange(0, e.target.value)}
            />
            <TextField
              label="Til dato"
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={localDateRange[1] || ""}
              onChange={(e) => handleLocalChange(1, e.target.value)}
            />
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button size="small" color="inherit" onClick={clearFilter}>
                Nullstill
              </Button>
              <Button size="small" variant="contained" onClick={applyFilter}>
                Bruk
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
});

const PriceRangeFilter = React.memo(function PriceRangeFilter({ column, onModeChange }) {
  const defaultState = useMemo(() => ({ min: "", max: "", mode: "pricePerUnit" }), []);
  const filterValue = column.getFilterValue() || defaultState;

  const [localState, setLocalState] = useState(filterValue);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = useCallback(
    (event) => {
      setAnchorEl(event.currentTarget);
      setLocalState(column.getFilterValue() || defaultState);
    },
    [column, defaultState]
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleModeChange = useCallback(
    (event, newMode) => {
      if (newMode !== null) {
        setLocalState((prev) => ({ ...prev, mode: newMode }));
        onModeChange(newMode);
      }
    },
    [onModeChange]
  );

  const handleRangeChange = useCallback((key, value) => {
    setLocalState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilter = useCallback(() => {
    const valueToSet = !localState.min && !localState.max ? undefined : localState;
    column.setFilterValue(valueToSet);
    handleClose();
  }, [column, handleClose, localState]);

  const clearFilter = useCallback(() => {
    setLocalState(defaultState);
    column.setFilterValue(undefined);
    handleClose();
  }, [column, defaultState, handleClose]);

  const isActive = Boolean(filterValue.min || filterValue.max);

  return (
    <>
      <IconButton onClick={handleClick} size="small" color={isActive ? "primary" : "default"}>
        <FilterListIcon fontSize="small" />
      </IconButton>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Filtrer Pris
          </Typography>

          <ToggleButtonGroup
            value={localState.mode}
            exclusive
            onChange={handleModeChange}
            aria-label="pris type"
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          >
            <ToggleButton value="pricePerUnit">Enhet</ToggleButton>
            <ToggleButton value="finalPrice">Total</ToggleButton>
            <ToggleButton value="all">Alt</ToggleButton>
          </ToggleButtonGroup>

          <Stack spacing={2}>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Min"
                type="number"
                size="small"
                value={localState.min}
                onChange={(e) => handleRangeChange("min", e.target.value)}
              />
              <TextField
                label="Maks"
                type="number"
                size="small"
                value={localState.max}
                onChange={(e) => handleRangeChange("max", e.target.value)}
              />
            </Stack>
            <Divider />
            <Stack direction="row" spacing={1} justifyContent="space-between">
              <Button size="small" color="inherit" onClick={clearFilter}>
                Nullstill
              </Button>
              <Button size="small" variant="contained" onClick={applyFilter}>
                Bruk
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
});

// ------------------------------------------------------
// Memoized badge for price cell
// ------------------------------------------------------
const PriceBadge = React.memo(function PriceBadge({ value, bg, fg }) {
  return (
    <Box
      sx={{
        backgroundColor: bg,
        color: fg,
        px: 0.5,
        py: 0.25,
        borderRadius: 1,
        display: "inline-block",
      }}
    >
      {NOK.format(typeof value === "number" ? value : 0)}
    </Box>
  );
});

// ------------------------------------------------------
// MAIN SCREEN (optimized)
// ------------------------------------------------------
const ExpenseScreen = () => {
  const theme = useTheme();

  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  const [activeModal, setActiveModal] = useState(null); // "ADD" | "EDIT" | "DELETE" | null
  const [selectedExpense, setSelectedExpense] = useState(INITIAL_SELECTED_EXPENSE);

  const [priceDisplayMode, setPriceDisplayMode] = useState("pricePerUnit");

  const { snackbarOpen, snackbarMessage, snackbarSeverity, showSnackbar, handleSnackbarClose } =
    useSnackBar();

  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter: deferredGlobalFilter,
    }),
    [pagination.pageIndex, pagination.pageSize, sorting, columnFilters, deferredGlobalFilter]
  );

  const { data: expensesData, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint: "/api/expenses",
    params: fetchParams,
    urlBuilder: expenseUrlBuilder,
    baseQueryKey: EXPENSES_QUERY_KEY,
    transformFn: transformExpenseData,
  });

  const tableData = expensesData?.expenses ?? [];
  const metaData = expensesData?.meta ?? {};

  const deferredExpenses = useDeferredValue(expensesData?.expenses);

  // Stats (per current page) — group by VARIANT NAME (not id)
  const priceStatsByType = useMemo(() => {
    const list = deferredExpenses;
    if (!list?.length) return {};

    const grouped = list.reduce((acc, item) => {
      if (typeof item.pricePerUnit !== "number") return acc;
      const k = item.variantName || "Ukjent";
      (acc[k] = acc[k] || []).push(item.pricePerUnit);
      return acc;
    }, {});

    const stats = {};
    for (const [type, prices] of Object.entries(grouped)) {
      const sorted = [...prices].sort((a, b) => a - b);
      stats[type] = {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        median: sorted[Math.floor(sorted.length / 2)],
      };
    }
    return stats;
  }, [deferredExpenses]);

  const handleDialogClose = useCallback(() => {
    setActiveModal(null);
    setSelectedExpense(INITIAL_SELECTED_EXPENSE);
  }, []);

  const handlePriceFilterModeChange = useCallback((newMode) => {
    if (["pricePerUnit", "finalPrice", "price", "all"].includes(newMode)) {
      setPriceDisplayMode(newMode);
    } else {
      setPriceDisplayMode("pricePerUnit");
    }
  }, []);

  const handleSuccess = useCallback(
    (action, expenseName) => {
      showSnackbar(`Utgift for "${expenseName || "Ukjent produkt"}" ${action}`);
      handleDialogClose();
    },
    [showSnackbar, handleDialogClose]
  );

  const handleError = useCallback(
    (action) => {
      showSnackbar(`Klarte ikke å ${action} utgiften. Prøv igjen.`, "error");
      handleDialogClose();
    },
    [showSnackbar, handleDialogClose]
  );

  const palette = theme.palette;

  const priceColumn = useMemo(() => {
    const resolvedAccessor =
      priceDisplayMode === "finalPrice"
        ? { header: "Totalpris", key: "finalPrice" }
        : priceDisplayMode === "price"
        ? { header: "Registrert Pris", key: "price" }
        : { header: "Pris per enhet", key: "pricePerUnit" };

    return {
      accessorKey: resolvedAccessor.key,
      header: resolvedAccessor.header,
      Filter: ({ column }) => (
        <PriceRangeFilter column={column} onModeChange={handlePriceFilterModeChange} />
      ),
      enableColumnFilter: true,
      Cell: ({ row }) => {
        const value = row.original[resolvedAccessor.key];
        const type = row.original.variantName || "Ukjent"; // ✅ use name
        const stats = priceStatsByType[type] || {};

        let bg = "transparent";
        let fg = palette.text.primary;

        if (resolvedAccessor.key === "pricePerUnit" && stats.median != null) {
          const rangeLow = stats.min + (stats.median - stats.min) / 2;
          const rangeHigh = stats.max - (stats.max - stats.median) / 2;

          if (value <= rangeLow) {
            bg = palette.success.main;
            fg = palette.success.contrastText;
          } else if (value >= rangeHigh) {
            bg = palette.error.main;
            fg = palette.error.contrastText;
          } else {
            bg = palette.warning.main;
            fg = palette.warning.contrastText;
          }
        }

        return <PriceBadge value={value} bg={bg} fg={fg} />;
      },
    };
  }, [priceDisplayMode, priceStatsByType, palette, handlePriceFilterModeChange]);

  const dateColumn = useMemo(
    () => ({
      accessorKey: "purchaseDate",
      header: "Kjøpsdato",
      Filter: ({ column }) => <DateRangeFilter column={column} />,
      enableColumnFilter: true,
      Cell: ({ cell }) =>
        cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("nb-NO") : "—",
    }),
    []
  );

  // ✅ show variantName in table (not variant id)
  const tableColumns = useMemo(
    () => [
      { accessorKey: "productName", header: "Produktnavn" },
      { accessorKey: "variantName", header: "Variant" },
      priceColumn,
      { accessorKey: "shopName", header: "Butikk" },
      dateColumn,
    ],
    [priceColumn, dateColumn]
  );

  const canOpenEditOrDelete = Boolean(selectedExpense?._id);

  useEffect(() => {
    // loadExpenseDialog();
  }, []);

  const openAdd = useCallback(() => setActiveModal("ADD"), []);
  const openEdit = useCallback((exp) => {
    loadExpenseDialog();
    setSelectedExpense(exp);
    setActiveModal("EDIT");
  }, []);
  const openDelete = useCallback((exp) => {
    loadExpenseDialog();
    setSelectedExpense(exp);
    setActiveModal("DELETE");
  }, []);

  const dialogOpen = Boolean(activeModal) && (activeModal === "ADD" || canOpenEditOrDelete);

  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onMouseEnter={loadExpenseDialog}
          onFocus={loadExpenseDialog}
          onClick={openAdd}
        >
          Legg til ny utgift
        </Button>
      </Box>

      <ReactTable
        data={tableData}
        columns={tableColumns}
        meta={metaData}
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
