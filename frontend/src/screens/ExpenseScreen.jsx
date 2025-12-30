// ExpenseScreen.jsx
// React 19 + MUI 7 + React Query v5 + MRT v3.2.1 optimized version
import React, { useMemo, useState, lazy, Suspense, useTransition, useDeferredValue } from "react";
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
// Lazy dialogs + preloading
// ------------------------------------------------------
const loadAddExpenseDialog = () =>
  import("../components/features/Expenses/ExpenseDialogs/AddExpense/AddExpenseDialog");
const loadEditExpenseDialog = () =>
  import("../components/features/Expenses/ExpenseDialogs/EditExpense/EditExpenseDialog");
const loadDeleteExpenseDialog = () =>
  import("../components/features/Expenses/ExpenseDialogs/DeleteExpense/DeleteExpenseDialog");

const AddExpenseDialog = lazy(loadAddExpenseDialog);
const EditExpenseDialog = lazy(loadEditExpenseDialog);
const DeleteExpenseDialog = lazy(loadDeleteExpenseDialog);

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
  type: "",
  measurementUnit: "",
  pricePerUnit: 0,
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
// ------------------------------------------------------
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
      type: x.type,
      measurementUnit: x.measurementUnit,
      pricePerUnit: x.pricePerUnit,
    })),
    meta: json.meta || { totalRowCount: 0 },
  };
};

// ------------------------------------------------------
// Filters
// ------------------------------------------------------
const DateRangeFilter = ({ column }) => {
  const initialValue = column.getFilterValue() || ["", ""];
  const [localDateRange, setLocalDateRange] = useState(initialValue);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setLocalDateRange(column.getFilterValue() || ["", ""]);
  };

  const handleClose = () => setAnchorEl(null);

  const handleLocalChange = (index, newValue) => {
    const newRange = [...localDateRange];
    newRange[index] = newValue;
    setLocalDateRange(newRange);
  };

  const applyFilter = () => {
    const valueToSet =
      !localDateRange[0] && !localDateRange[1] ? undefined : localDateRange;

    startTransition(() => {
      column.setFilterValue(valueToSet);
    });
    handleClose();
  };

  const clearFilter = () => {
    setLocalDateRange(["", ""]);
    startTransition(() => {
      column.setFilterValue(undefined);
    });
    handleClose();
  };

  const isActive = initialValue[0] || initialValue[1];

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
              <Button size="small" variant="contained" onClick={applyFilter} disabled={isPending}>
                Bruk
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

const PriceRangeFilter = ({ column, onModeChange }) => {
  const defaultState = { min: "", max: "", mode: "pricePerUnit" };
  const filterValue = column.getFilterValue() || defaultState;
  const [localState, setLocalState] = useState(filterValue);
  const [anchorEl, setAnchorEl] = useState(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setLocalState(column.getFilterValue() || defaultState);
  };

  const handleClose = () => setAnchorEl(null);

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setLocalState((prev) => ({ ...prev, mode: newMode }));
      onModeChange(newMode);
    }
  };

  const handleRangeChange = (key, value) => {
    setLocalState((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilter = () => {
    const valueToSet = !localState.min && !localState.max ? undefined : localState;

    startTransition(() => {
      column.setFilterValue(valueToSet);
    });
    handleClose();
  };

  const clearFilter = () => {
    setLocalState(defaultState);
    startTransition(() => {
      column.setFilterValue(undefined);
    });
    handleClose();
  };

  const isActive = filterValue.min || filterValue.max;

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
              <Button size="small" variant="contained" onClick={applyFilter} disabled={isPending}>
                Bruk
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Popover>
    </>
  );
};

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
      {NOK.format(value)}
    </Box>
  );
});

// ------------------------------------------------------
// MAIN SCREEN
// ------------------------------------------------------
const ExpenseScreen = () => {
  const theme = useTheme();

  // Table state
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter); // smooth typing
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);

  // Dialog state
  const [activeModal, setActiveModal] = useState(null); // ADD | EDIT | DELETE | null
  const [selectedExpense, setSelectedExpense] = useState(INITIAL_SELECTED_EXPENSE);

  // View state
  const [priceDisplayMode, setPriceDisplayMode] = useState("pricePerUnit");

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // Fetch params (deferred global filter)
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter: deferredGlobalFilter,
  };

  const { data: expensesData, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint: "/api/expenses",
    params: fetchParams,
    urlBuilder: expenseUrlBuilder,
    baseQueryKey: EXPENSES_QUERY_KEY,
    transformFn: transformExpenseData,
  });

  const tableData = expensesData?.expenses ?? [];
  const metaData = expensesData?.meta ?? {};

  // Compute stats (avoid mutating arrays; still memoized)
  const priceStatsByType = useMemo(() => {
    const list = expensesData?.expenses;
    if (!list?.length) return {};

    const grouped = list.reduce((acc, item) => {
      if (typeof item.pricePerUnit !== "number") return acc;
      (acc[item.type] = acc[item.type] || []).push(item.pricePerUnit);
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
  }, [expensesData?.expenses]);

  const handleDialogClose = () => {
    setActiveModal(null);
    setSelectedExpense(INITIAL_SELECTED_EXPENSE);
  };

  // Keep stable for filter component
  const handlePriceFilterModeChange = React.useCallback((newMode) => {
    if (["pricePerUnit", "finalPrice", "price", "all"].includes(newMode)) {
      setPriceDisplayMode(newMode);
    } else {
      setPriceDisplayMode("pricePerUnit");
    }
  }, []);

  const handleSuccess = (action, expenseName) => {
    showSnackbar(`Utgift for "${expenseName || "Ukjent produkt"}" ${action}`);
    handleDialogClose();
    // ✅ Prefer invalidate in mutations; keep refetch only for manual refresh
  };

  const handleError = (action) => {
    showSnackbar(`Klarte ikke å ${action} utgiften. Prøv igjen.`, "error");
    handleDialogClose();
  };

  // Column definition (stable + uses cached formatter + memoized badge)
  const tableColumns = useMemo(() => {
    const resolvedAccessor =
      priceDisplayMode === "finalPrice"
        ? { header: "Totalpris", key: "finalPrice" }
        : priceDisplayMode === "price"
        ? { header: "Registrert Pris", key: "price" }
        : { header: "Pris per enhet", key: "pricePerUnit" };

    return [
      { accessorKey: "productName", header: "Produktnavn" },
      {
        accessorKey: resolvedAccessor.key,
        header: resolvedAccessor.header,
        Filter: ({ column }) => (
          <PriceRangeFilter column={column} onModeChange={handlePriceFilterModeChange} />
        ),
        enableColumnFilter: true,
        Cell: ({ row }) => {
          const value = row.original[resolvedAccessor.key];
          const type = row.original.type;
          const stats = priceStatsByType[type] || {};

          let bg = "transparent";
          let fg = theme.palette.text.primary;

          if (resolvedAccessor.key === "pricePerUnit" && stats.median != null) {
            const rangeLow = stats.min + (stats.median - stats.min) / 2;
            const rangeHigh = stats.max - (stats.max - stats.median) / 2;

            if (value <= rangeLow) {
              bg = theme.palette.success.main;
              fg = theme.palette.success.contrastText;
            } else if (value >= rangeHigh) {
              bg = theme.palette.error.main;
              fg = theme.palette.error.contrastText;
            } else {
              bg = theme.palette.warning.main;
              fg = theme.palette.warning.contrastText;
            }
          }

          return <PriceBadge value={value} bg={bg} fg={fg} />;
        },
      },
      { accessorKey: "shopName", header: "Butikk" },
      {
        accessorKey: "purchaseDate",
        header: "Kjøpsdato",
        Filter: ({ column }) => <DateRangeFilter column={column} />,
        enableColumnFilter: true,
        Cell: ({ cell }) =>
          cell.getValue() ? new Date(cell.getValue()).toLocaleDateString("nb-NO") : "—",
      },
    ];
  }, [priceDisplayMode, handlePriceFilterModeChange, priceStatsByType, theme]);

  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onMouseEnter={loadAddExpenseDialog}
          onFocus={loadAddExpenseDialog}
          onClick={() => setActiveModal("ADD")}
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
        isFetching={!activeModal && isFetching} // avoid progress bars behind modal
        columnFilters={columnFilters}
        globalFilter={globalFilter} // keep input responsive; fetch uses deferred
        pagination={pagination}
        sorting={sorting}
        setColumnFilters={setColumnFilters}
        setGlobalFilter={setGlobalFilter}
        setPagination={setPagination}
        setSorting={setSorting}
        refetch={refetch}
        renderDetailPanel={({ row }) => <DetailPanel expense={row.original} />}
        handleEdit={(exp) => {
          loadEditExpenseDialog();
          setSelectedExpense(exp);
          setActiveModal("EDIT");
        }}
        handleDelete={(exp) => {
          loadDeleteExpenseDialog();
          setSelectedExpense(exp);
          setActiveModal("DELETE");
        }}
      />

      <Suspense fallback={null}>
        {activeModal === "ADD" && (
          <AddExpenseDialog
            open
            onClose={handleDialogClose}
            onAdd={(created) => handleSuccess("registrert", created?.productName || "Ny utgift")}
            onError={() => handleError("registrere")}
          />
        )}

        {activeModal === "EDIT" && selectedExpense._id && (
          <EditExpenseDialog
            open
            onClose={handleDialogClose}
            selectedExpense={selectedExpense}
            onUpdateSuccess={(exp) => handleSuccess("oppdatert", exp.productName)}
            onUpdateFailure={() => handleError("oppdatere")}
          />
        )}

        {activeModal === "DELETE" && selectedExpense._id && (
          <DeleteExpenseDialog
            open
            onClose={handleDialogClose}
            selectedExpense={selectedExpense}
            dialogTitle="Slett Utgift"
            onDeleteSuccess={(exp) => handleSuccess("slettet", exp.productName)}
            onDeleteFailure={() => handleError("slette")}
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
