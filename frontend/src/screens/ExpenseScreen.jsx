import React, { 
  useState, 
  lazy, 
  Suspense, 
  useTransition 
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

// --- LAZY IMPORTS ---
const AddExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/AddExpense/AddExpenseDialog")
);
const DeleteExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/DeleteExpense/DeleteExpenseDialog")
);
const EditExpenseDialog = lazy(() =>
  import("../components/features/Expenses/ExpenseDialogs/EditExpense/EditExpenseDialog")
);

// --- STATIC CONSTANTS ---
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

// --- PURE FUNCTIONS (Stable in R19) ---
const expenseUrlBuilder = (endpoint, params) => {
  const url = new URL(
    `${API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`
  );
  url.searchParams.set("start", params.pageIndex * params.pageSize);
  url.searchParams.set("size", params.pageSize);
  url.searchParams.set("sorting", JSON.stringify(params.sorting ?? []));
  url.searchParams.set("columnFilters", JSON.stringify(params.filters ?? []));
  url.searchParams.set("globalFilter", params.globalFilter ?? "");
  return url;
};

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

// --- FILTERS (Kept useTransition for non-blocking updates) ---

const DateRangeFilter = ({ column }) => {
  const initialValue = column.getFilterValue() || ["", ""];
  const [localDateRange, setLocalDateRange] = useState(initialValue);
  const [anchorEl, setAnchorEl] = useState(null);
  
  // React 19: For non-blocking state updates
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
    const valueToSet = (!localDateRange[0] && !localDateRange[1])
      ? undefined
      : localDateRange;
    
    // Transition: Close popover immediately, update table data in background
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
  
  // React 19: Non-blocking UI
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
    const valueToSet = (!localState.min && !localState.max)
      ? undefined
      : localState;

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

// --- MAIN SCREEN ---

const ExpenseScreen = () => {
  const theme = useTheme();

  // --- STATE ---
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedExpense, setSelectedExpense] = useState(INITIAL_SELECTED_EXPENSE);
  const [priceDisplayMode, setPriceDisplayMode] = useState("pricePerUnit");

  // Consolidated Dialog State: 'ADD', 'EDIT', 'DELETE', or null
  const [activeModal, setActiveModal] = useState(null); 

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

  // --- DATA FETCHING ---
  
  // R19: No useMemo needed for fetchParams object
  const fetchParams = {
    pageIndex: pagination.pageIndex,
    pageSize: pagination.pageSize,
    sorting,
    filters: columnFilters,
    globalFilter,
  };

  const {
    data: expensesData,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = usePaginatedData({
    endpoint: "/api/expenses",
    params: fetchParams,
    urlBuilder: expenseUrlBuilder,
    baseQueryKey: ["expenses", "paginated"],
    transformFn: transformExpenseData,
  });

  const tableData = expensesData?.expenses || [];
  const metaData = expensesData?.meta || {};

  // --- STATS CALCULATION (Kept useMemo due to heavy/complex calculation) ---
  const priceStatsByType = React.useMemo(() => {
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

  // --- HANDLERS ---

  const handleDialogClose = () => {
    setActiveModal(null);
    setSelectedExpense(INITIAL_SELECTED_EXPENSE);
  };

  // R19: useCallback not strictly needed, but kept as it's passed as a prop to PriceRangeFilter
  const handlePriceFilterModeChange = React.useCallback((newMode) => {
    if (["pricePerUnit", "finalPrice", "price"].includes(newMode)) {
      setPriceDisplayMode(newMode);
    } else {
      setPriceDisplayMode("pricePerUnit");
    }
  }, []);

  const handleSuccess = (action, expenseName) => {
    showSnackbar(`Utgift for "${expenseName || "Ukjent produkt"}" ${action}`);
    handleDialogClose();
    refetch();
  };

  const handleError = (action) => {
    showSnackbar(`Klarte ikke å ${action} utgiften. Prøv igjen.`, "error");
    handleDialogClose();
  };

  // --- COLUMNS (Kept useMemo for complex object stability required by React Table) ---
  const tableColumns = React.useMemo(() => {
    const priceColumnConfig = {
      accessorKey: "pricePerUnit",
      header: "Pris per enhet",
      dataAccessor: "pricePerUnit",
    };

    if (priceDisplayMode === "finalPrice") {
      priceColumnConfig.header = "Totalpris";
      priceColumnConfig.dataAccessor = "finalPrice";
    } else if (priceDisplayMode === "price") {
      priceColumnConfig.header = "Registrert Pris";
      priceColumnConfig.dataAccessor = "price";
    }

    return [
      { accessorKey: "productName", header: "Produktnavn" },
      {
        accessorKey: priceColumnConfig.accessorKey,
        header: priceColumnConfig.header,
        Filter: ({ column }) => (
          <PriceRangeFilter
            column={column}
            onModeChange={handlePriceFilterModeChange}
          />
        ),
        enableColumnFilter: true,
        Cell: ({ row }) => {
          const price = row.original[priceColumnConfig.dataAccessor];
          const type = row.original.type;
          const stats = priceStatsByType[type] || {};

          let bg = "transparent";
          let fg = theme.palette.text.primary;
          
          if (
            priceColumnConfig.dataAccessor === "pricePerUnit" &&
            stats.median
          ) {
            const rangeLow = stats.min + (stats.median - stats.min) / 2;
            const rangeHigh = stats.max - (stats.max - stats.median) / 2;
            
            // Simplified color logic based on price comparison to median/range
            if (price <= rangeLow) {
              bg = theme.palette.success.main;
              fg = theme.palette.success.contrastText;
            } else if (price >= rangeHigh) {
              bg = theme.palette.error.main;
              fg = theme.palette.error.contrastText;
            } else {
              bg = theme.palette.warning.main;
              fg = theme.palette.warning.contrastText;
            }
          }

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
        Filter: ({ column }) => <DateRangeFilter column={column} />,
        enableColumnFilter: true,
        Cell: ({ cell }) =>
          cell.getValue()
            ? new Date(cell.getValue()).toLocaleDateString("nb-NO")
            : "Ugyldig dato",
      },
    ];
  }, [priceStatsByType, theme, priceDisplayMode, handlePriceFilterModeChange]);

  // --- RENDER ---
  return (
    <TableLayout>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          onClick={() => setActiveModal("ADD")}
        >
          Legg til ny utgift
        </Button>
      </Box>

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
          setActiveModal("EDIT");
        }}
        handleDelete={(exp) => {
          setSelectedExpense(exp);
          setActiveModal("DELETE");
        }}
      />

      {/* Dialogs - Consolidated rendering based on activeModal state */}
      <Suspense fallback={<div>Laster dialoger...</div>}>
        {activeModal === "ADD" && (
          <AddExpenseDialog
            open={true}
            onClose={handleDialogClose}
            onAdd={() => handleSuccess("registrert", "Ny utgift")}
          />
        )}

        {activeModal === "EDIT" && selectedExpense._id && (
          <EditExpenseDialog
            open={true}
            onClose={handleDialogClose}
            selectedExpense={selectedExpense}
            onUpdateSuccess={(exp) => handleSuccess("oppdatert", exp.productName)}
            onUpdateFailure={() => handleError("oppdatere")}
          />
        )}

        {activeModal === "DELETE" && selectedExpense._id && (
          <DeleteExpenseDialog
            open={true}
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