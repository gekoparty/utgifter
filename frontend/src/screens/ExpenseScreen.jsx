// ExpenseScreen.jsx
// React 19 + MUI 7 + React Query v5 + MRT v3.2.1
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
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import Collapse from "@mui/material/Collapse";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { alpha, useTheme } from "@mui/material/styles";
import ReactTable from "../components/commons/React-Table/react-table";
import TableLayout from "../components/commons/TableLayout/TableLayout";
import useSnackBar from "../hooks/useSnackBar";
import { DetailPanel } from "../components/commons/DetailPanel/DetailPanel";
import { usePaginatedData } from "../hooks/usePaginatedData";
import { buildPaginatedUrl } from "../components/commons/EntityTableScreen/buildPaginatedUrl";

// ------------------------------------------------------
// Lazy unified dialog + preloading
// ------------------------------------------------------
const loadExpenseDialog = () =>
  import("../features/Expenses/components/ExpenseDialog/ExpenseDialog");
const ExpenseDialog = lazy(loadExpenseDialog);
const ExpenseDashboard = lazy(() =>
  import("../features/Expenses/components/ExpenseDashboard/ExpenseDashboard")
);

// ------------------------------------------------------
// Constants
// ------------------------------------------------------
const EXPENSES_QUERY_KEY = ["expenses", "paginated"];

const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };
const INITIAL_SORTING = [{ id: "purchaseDate", desc: true }];

const PRICE_MODE_LABELS = {
  pricePerUnit: "Enhet",
  finalPrice: "Total",
  price: "Pris",
};

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
  productId: "",
  brandId: "",
  shopId: "",
  locationId: "",
  variant: "",
  variantName: "",
  measurementUnit: "",
  pricePerUnit: 0,
  variants: [],
  measures: [],
};

// Currency formatter (avoid toLocaleString per cell)
const NOK = new Intl.NumberFormat("nb-NO", {
  style: "currency",
  currency: "NOK",
});

// ------------------------------------------------------
// Transform (keep stable shape for table)
const transformExpenseData = (json) => {
  const list = json.expenses || json.data || [];
  return {
    expenses: list.map((x) => ({
      _id: x._id,
      productName: x.product?.name || x.productName || "N/A",
      productId: x.product?._id || x.productId || "",
      brandName: x.brand?.name || x.brandName || "N/A",
      brandId: x.brand?._id || x.brandId || "",
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
      registeredDate: x.registeredDateRaw || x.registeredDate,
      registeredDateDisplay: x.registeredDate,
      purchaseDate: x.purchaseDateRaw || x.purchaseDate,
      purchaseDateDisplay: x.purchaseDate,
      productBrandIds: Array.isArray(x.productBrandIds)
        ? x.productBrandIds
        : [],
      variant: x.variant || "",
      variantName: x.variantName || "",
      measurementUnit: x.measurementUnit,
      pricePerUnit: x.pricePerUnit,
      shopId: x.shop?._id || x.shopId || "",
      locationId: x.location?._id || x.locationId || "",
      variants: Array.isArray(x.variants) ? x.variants : [],
      measures: Array.isArray(x.measures) ? x.measures : [],
    })),
    meta: json.meta || { totalRowCount: 0 },
  };
};

// ------------------------------------------------------
// Filters
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
    [column],
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
    const valueToSet =
      !localDateRange[0] && !localDateRange[1] ? undefined : localDateRange;
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
      <IconButton
        onClick={handleClick}
        size="small"
        color={isActive ? "primary" : "default"}
      >
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
              slotProps={{ inputLabel: { shrink: true } }}
              value={localDateRange[0] || ""}
              onChange={(e) => handleLocalChange(0, e.target.value)}
            />
            <TextField
              label="Til dato"
              type="date"
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
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

const PriceRangeFilter = React.memo(function PriceRangeFilter({
  column,
  onModeChange,
}) {
  const defaultState = useMemo(
    () => ({ min: "", max: "", mode: "pricePerUnit" }),
    [],
  );
  const filterValue = column.getFilterValue() || defaultState;

  const [localState, setLocalState] = useState(filterValue);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = useCallback(
    (event) => {
      setAnchorEl(event.currentTarget);
      setLocalState(column.getFilterValue() || defaultState);
    },
    [column, defaultState],
  );

  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleModeChange = useCallback(
    (event, newMode) => {
      if (newMode !== null) {
        setLocalState((prev) => ({ ...prev, mode: newMode }));
        onModeChange(newMode);
      }
    },
    [onModeChange],
  );

  const handleRangeChange = useCallback((key, value) => {
    setLocalState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const applyFilter = useCallback(() => {
    const valueToSet =
      !localState.min && !localState.max ? undefined : localState;
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
      <IconButton
        onClick={handleClick}
        size="small"
        color={isActive ? "primary" : "default"}
      >
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
// Badge
// ------------------------------------------------------
const PriceBadge = React.memo(function PriceBadge({ value, tone = "neutral" }) {
  return (
    <Box
      sx={(t) => {
        const colors = {
          success: t.palette.success.main,
          warning: t.palette.warning.main,
          error: t.palette.error.main,
          neutral: t.palette.text.secondary,
        };
        const color = colors[tone] || colors.neutral;

        return {
          alignItems: "center",
          backgroundColor: alpha(
            color,
            t.palette.mode === "dark" ? 0.16 : 0.08,
          ),
          border: "1px solid",
          borderColor: alpha(color, t.palette.mode === "dark" ? 0.34 : 0.22),
          borderRadius: 999,
          color: tone === "neutral" ? t.palette.text.primary : color,
          display: "inline-flex",
          fontVariantNumeric: "tabular-nums",
          fontWeight: 800,
          gap: 0.75,
          lineHeight: 1,
          minWidth: 92,
          justifyContent: "flex-end",
          px: 1,
          py: 0.55,
          whiteSpace: "nowrap",
          "&::before": {
            content: '""',
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: color,
            flex: "0 0 auto",
          },
        };
      }}
    >
      {NOK.format(typeof value === "number" ? value : 0)}
    </Box>
  );
});

const TextCell = React.memo(function TextCell({ primary, secondary }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="span"
        sx={{
          display: "block",
          fontSize: "0.86rem",
          fontWeight: 750,
          lineHeight: 1.25,
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {primary || "N/A"}
      </Typography>
      {secondary ? (
        <Typography
          component="span"
          color="text.secondary"
          sx={{
            display: "block",
            fontSize: "0.74rem",
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {secondary}
        </Typography>
      ) : null}
    </Box>
  );
});

const MutedCell = React.memo(function MutedCell({ value }) {
  return (
    <Typography
      component="span"
      color="text.secondary"
      sx={{ fontSize: "0.84rem", fontWeight: 650 }}
    >
      {value || "N/A"}
    </Typography>
  );
});

const DateCell = React.memo(function DateCell({ value }) {
  return (
    <Typography
      component="span"
      sx={{
        fontSize: "0.84rem",
        px: 0.5,
        py: 0.25,
        borderRadius: 1,
        bgcolor: "action.hover",
        fontVariantNumeric: "tabular-nums",
        fontWeight: 700,
      }}
    >
      {value}
    </Typography>
  );
});

// Helpers
const formatDate = (value, displayValue) => {
  if (displayValue) return displayValue;
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("nb-NO");
};
const formatBool = (v) => (v ? "Ja" : "Nei");

// ------------------------------------------------------
// LocalStorage persistence helpers
// ------------------------------------------------------
const VIS_KEY = "expensesTable.columnVisibility.v1";

const readVisibility = (fallback) => {
  try {
    const raw = localStorage.getItem(VIS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    // must be object
    if (!parsed || typeof parsed !== "object") return fallback;
    return { ...fallback, ...parsed }; // merge to include any new columns
  } catch {
    return fallback;
  }
};

const writeVisibility = (value) => {
  try {
    localStorage.setItem(VIS_KEY, JSON.stringify(value));
  } catch {
    // ignore
  }
};

// ------------------------------------------------------
// MAIN SCREEN
// ------------------------------------------------------
const ExpenseScreen = () => {
  const theme = useTheme();
  const palette = theme.palette;

  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  // ✅ default visibility (make all price keys true so mode switching never “hides”)
  const DEFAULT_VISIBILITY = useMemo(
    () => ({
      // visible by default
      productName: true,
      variantName: true,
      shopName: true,
      purchaseDate: true,
      displayPrice: true,

      // keep these true due to dynamic price column switching accessorKey
      pricePerUnit: true,
      finalPrice: true,
      price: true,

      // hidden by default
      brandName: false,
      quantity: false,
      volume: false,
      measurementUnit: false,
      hasDiscount: false,
      discountValue: false,
      discountAmount: false,
      purchased: false,
      registeredDate: false,
      locationName: false,
    }),
    [],
  );

  // ✅ persisted visibility
  const [columnVisibility, setColumnVisibility] = useState(() =>
    readVisibility(DEFAULT_VISIBILITY),
  );

  // persist when it changes
  useEffect(() => {
    writeVisibility(columnVisibility);
  }, [columnVisibility]);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(
    INITIAL_SELECTED_EXPENSE,
  );

  const [priceDisplayMode, setPriceDisplayMode] = useState("pricePerUnit");

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

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
    if (newMode === "all") return;

    if (["pricePerUnit", "finalPrice", "price"].includes(newMode)) {
      setPriceDisplayMode(newMode);
    } else {
      setPriceDisplayMode("pricePerUnit");
    }
  }, []);

  const handlePriceModeChange = useCallback(
    (event, newMode) => {
      if (newMode) {
        handlePriceFilterModeChange(newMode);
      }
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

  // Price Column (dynamic)
  const priceColumn = useMemo(() => {
    const resolvedAccessor =
      priceDisplayMode === "finalPrice"
        ? { header: "Totalpris", key: "finalPrice" }
        : priceDisplayMode === "price"
          ? { header: "Registrert Pris", key: "price" }
          : { header: "Pris per enhet", key: "pricePerUnit" };

    return {
      id: "displayPrice",
      accessorFn: (row) => row[resolvedAccessor.key],
      header: resolvedAccessor.header,
      Filter: ({ column }) => (
        <PriceRangeFilter
          column={column}
          onModeChange={handlePriceFilterModeChange}
        />
      ),
      enableColumnFilter: true,
      enableSorting: false,
      Cell: ({ row }) => {
        const value = row.original[resolvedAccessor.key];
        const type = row.original.variantName || "Ukjent";
        const stats = priceStatsByType[type] || {};

        let tone = "neutral";

        if (resolvedAccessor.key === "pricePerUnit" && stats.median != null) {
          const rangeLow = stats.min + (stats.median - stats.min) / 2;
          const rangeHigh = stats.max - (stats.max - stats.median) / 2;

          if (value <= rangeLow) {
            tone = "success";
          } else if (value >= rangeHigh) {
            tone = "error";
          } else {
            tone = "warning";
          }
        }

        return <PriceBadge value={value} tone={tone} />;
      },
    };
  }, [
    priceDisplayMode,
    priceStatsByType,
    handlePriceFilterModeChange,
  ]);

  const dateColumn = useMemo(
    () => ({
      accessorKey: "purchaseDate",
      header: "Kjøpsdato",
      Filter: ({ column }) => <DateRangeFilter column={column} />,
      enableColumnFilter: true,
      Cell: ({ row }) =>
        <DateCell
          value={formatDate(
            row.original.purchaseDate,
            row.original.purchaseDateDisplay,
          )}
        />,
    }),
    [],
  );

  // ALL columns (toggleable)
  const tableColumns = useMemo(
    () => [
      {
        accessorKey: "productName",
        header: "Produktnavn",
        size: 220,
        Cell: ({ row }) => (
          <TextCell
            primary={row.original.productName}
            secondary={
              row.original.brandName !== "N/A" ? row.original.brandName : ""
            }
          />
        ),
      },
      {
        accessorKey: "variantName",
        header: "Variant",
        size: 150,
        Cell: ({ cell }) => <MutedCell value={cell.getValue()} />,
      },
      priceColumn,
      {
        accessorKey: "shopName",
        header: "Butikk",
        size: 150,
        Cell: ({ cell }) => <MutedCell value={cell.getValue()} />,
      },
      dateColumn,

      // extra fields
      { accessorKey: "brandName", header: "Merke" },
      {
        accessorKey: "finalPrice",
        header: "Total (felt)",
        Cell: ({ cell }) => NOK.format(cell.getValue() ?? 0),
      },
      {
        accessorKey: "price",
        header: "Pris (felt)",
        Cell: ({ cell }) => NOK.format(cell.getValue() ?? 0),
      },
      {
        accessorKey: "quantity",
        header: "Antall",
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
      {
        accessorKey: "volume",
        header: "Volum",
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
      { accessorKey: "measurementUnit", header: "Måleenhet" },
      {
        accessorKey: "hasDiscount",
        header: "Har rabatt",
        Cell: ({ cell }) => formatBool(cell.getValue()),
      },
      {
        accessorKey: "discountValue",
        header: "Rabatt %",
        Cell: ({ cell }) => cell.getValue() ?? 0,
      },
      {
        accessorKey: "discountAmount",
        header: "Rabatt beløp",
        Cell: ({ cell }) => NOK.format(cell.getValue() ?? 0),
      },
      {
        accessorKey: "purchased",
        header: "Kjøpt",
        Cell: ({ cell }) => formatBool(cell.getValue()),
      },
      { accessorKey: "locationName", header: "Lokasjon" },
      {
        accessorKey: "registeredDate",
        header: "Registrert dato",
        Cell: ({ row }) =>
          formatDate(
            row.original.registeredDate,
            row.original.registeredDateDisplay,
          ),
      },
    ],
    [priceColumn, dateColumn],
  );

  const canOpenEditOrDelete = Boolean(selectedExpense?._id);

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

  const dialogOpen =
    Boolean(activeModal) && (activeModal === "ADD" || canOpenEditOrDelete);

  return (
    <TableLayout>
      <Box
        sx={{
          mb: 2,
          p: 1.5,
          borderRadius: 3,
          bgcolor: "background.paper",
          border: `1px solid ${palette.divider}`,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "center" }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
              Utgifter
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {metaData?.totalRowCount ?? 0} registrerte utgifter
            </Typography>
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="flex-end"
            alignItems={{ xs: "stretch", sm: "center" }}
            sx={{
              "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } },
            }}
          >
            <ToggleButtonGroup
              exclusive
              size="small"
              value={priceDisplayMode}
              onChange={handlePriceModeChange}
              aria-label="Prisvisning"
              sx={(t) => ({
                alignSelf: { xs: "stretch", sm: "center" },
                bgcolor:
                  t.palette.mode === "dark"
                    ? "rgba(255,255,255,0.04)"
                    : "rgba(15,23,42,0.035)",
                border: "1px solid",
                borderColor: t.palette.divider,
                borderRadius: 999,
                p: 0.25,
                "& .MuiToggleButton-root": {
                  border: 0,
                  borderRadius: 999,
                  color: "text.secondary",
                  fontWeight: 800,
                  px: 1.5,
                  textTransform: "none",
                  width: { xs: "33.333%", sm: "auto" },
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                },
              })}
            >
              {Object.entries(PRICE_MODE_LABELS).map(([mode, label]) => (
                <ToggleButton key={mode} value={mode}>
                  {label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            <Button
              size="small"
              variant={dashboardOpen ? "contained" : "outlined"}
              startIcon={<DashboardIcon />}
              onClick={() => setDashboardOpen((v) => !v)}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 700,
                px: 2,
              }}
            >
              {dashboardOpen ? "Skjul statistikk" : "Vis statistikk"}
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openAdd}
              sx={{
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 800,
                px: 2,
              }}
            >
              Ny utgift
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Collapse in={dashboardOpen} timeout={350} unmountOnExit>
        <Box sx={{ mb: 2 }}>
          <Suspense fallback={null}>
            <ExpenseDashboard
              expenses={tableData}
              totalRowCount={metaData?.totalRowCount ?? 0}
              onAdd={openAdd}
            />
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
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
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
