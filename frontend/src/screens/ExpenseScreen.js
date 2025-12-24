import { useState, useMemo, lazy, Suspense, useCallback } from "react";
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
  Divider
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

// Lazy dialogs
const AddExpenseDialog = lazy(() =>
  import(
    "../components/features/Expenses/ExpenseDialogs/AddExpense/AddExpenseDialog"
  )
);
const DeleteExpenseDialog = lazy(() =>
  import(
    "../components/features/Expenses/ExpenseDialogs/DeleteExpense/DeleteExpenseDialog"
  )
);
const EditExpenseDialog = lazy(() =>
  import(
    "../components/features/Expenses/ExpenseDialogs/EditExpense/EditExpenseDialog"
  )
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

const DateRangeFilter = ({ column }) => {
  // Read current filter from table to initialize, default to empty strings
  const initialValue = column.getFilterValue() || ["", ""];

  // Local state for the inputs (prevents API triggering while typing)
  const [localDateRange, setLocalDateRange] = useState(initialValue);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    // Sync local state with actual column filter when opening
    setLocalDateRange(column.getFilterValue() || ["", ""]);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // Updates only the local input state
  const handleLocalChange = (index, newValue) => {
    const newRange = [...localDateRange];
    newRange[index] = newValue;
    setLocalDateRange(newRange);
  };

  // Commits the filter to the table (Triggers API)
  const applyFilter = () => {
    // Check if at least one date is set
    if (!localDateRange[0] && !localDateRange[1]) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(localDateRange);
    }
    handleClose();
  };

  const clearFilter = () => {
    setLocalDateRange(["", ""]);
    column.setFilterValue(undefined);
    handleClose();
  };

  // Visual indicator: Active if filter has values
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
        open={open}
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
};

const PriceRangeFilter = ({ column, onModeChange }) => {
  // Default state: filtering on Unit Price (standard behavior)
  const defaultState = { min: "", max: "", mode: "pricePerUnit" };
  
  // Initialize from existing filter value or default
  const filterValue = column.getFilterValue() || defaultState;

  // Local state
  const [localState, setLocalState] = useState(filterValue);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setLocalState(column.getFilterValue() || defaultState);
  };

  

  const handleClose = () => setAnchorEl(null);

  const open = Boolean(anchorEl);

  const handleModeChange = (event, newMode) => {
    if (newMode !== null) {
      setLocalState((prev) => ({ ...prev, mode: newMode }));
      // NEW: Call the handler passed from the parent
      onModeChange(newMode); 
    }
  };

  const handleRangeChange = (key, value) => {
    setLocalState((prev) => ({ ...prev, [key]: value }));
  };

  const applyFilter = () => {
    // If empty, clear the filter
    if (!localState.min && !localState.max) {
      column.setFilterValue(undefined);
    } else {
      // Pass the whole object to the table state
      column.setFilterValue(localState);
    }
    handleClose();
  };

  const clearFilter = () => {
    setLocalState(defaultState);
    column.setFilterValue(undefined);
    handleClose();
  };

  // Active if min or max is set
  const isActive = filterValue.min || filterValue.max;

  return (
    <>
      <IconButton onClick={handleClick} size="small" color={isActive ? "primary" : "default"}>
        <FilterListIcon fontSize="small" />
      </IconButton>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        transformOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Box sx={{ p: 2, width: 260 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Filtrer Pris
          </Typography>

          {/* Mode Selector */}
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
};

const ExpenseScreen = () => {
  const theme = useTheme();

  // Table state
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState(INITIAL_SORTING);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [selectedExpense, setSelectedExpense] = useState(
    INITIAL_SELECTED_EXPENSE
  );
  const [priceDisplayMode, setPriceDisplayMode] = useState("pricePerUnit");

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
    const url = new URL(
      `${API_URL.replace(/\/$/, "")}/${endpoint.replace(/^\//, "")}`
    );
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

  const handlePriceFilterModeChange = useCallback((newMode) => {
    // We only care about the display mode if it's one of the three price fields
    if (["pricePerUnit", "finalPrice", "price"].includes(newMode)) {
        setPriceDisplayMode(newMode);
    } else {
        // If mode is "all", default the display back to unit price
        setPriceDisplayMode("pricePerUnit");
    }
}, []);

  // Handlers
  const addExpenseHandler = useCallback(
    (exp) => {
      showSnackbar(
        `Utgift for "${exp.productName || "Ukjent produkt"}" ble registrert`
      );
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
      showSnackbar(
        `Utgift for "${
          updatedExpense.productName || "Ukjent produkt"
        }" oppdatert`
      );
      setEditModalOpen(false);
    },
    [showSnackbar]
  );

  const handleDialogClose = useCallback((setState) => {
    setState(false);
    setSelectedExpense(INITIAL_SELECTED_EXPENSE);
  }, []);

  // Table columns
  const tableColumns = useMemo(() => {
    // 1. Determine the accessor key and header based on the selected display mode
    const priceColumnConfig = {
        accessorKey: "pricePerUnit", // Keep this fixed for filter/sorting continuity
        header: "Pris per enhet", // Default
        dataAccessor: "pricePerUnit", // Default field for Cell content
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
            accessorKey: priceColumnConfig.accessorKey, // 'pricePerUnit'
            header: priceColumnConfig.header, // Changes dynamically
            
            // Pass the mode change handler to the filter
            Filter: ({ column }) => (
                <PriceRangeFilter 
                    column={column} 
                    onModeChange={handlePriceFilterModeChange} 
                />
            ),
            enableColumnFilter: true,
            
            // Cell logic now uses the dynamic dataAccessor
            Cell: ({ row }) => {
                // Get the value from the dynamically chosen field (pricePerUnit, finalPrice, or price)
                const price = row.original[priceColumnConfig.dataAccessor]; 
                const type = row.original.type;
                const stats = priceStatsByType[type] || {};

                let bg = theme.palette.warning.main;
                let fg = theme.palette.warning.contrastText;

                // Only apply colors/stats to the Price Per Unit column
                if (priceColumnConfig.dataAccessor === "pricePerUnit" && stats.median) {
                    if (price <= stats.min + (stats.median - stats.min) / 2) {
                        bg = theme.palette.success.main;
                        fg = theme.palette.success.contrastText;
                    } else if (price >= stats.max - (stats.max - stats.median) / 2) {
                        bg = theme.palette.error.main;
                        fg = theme.palette.error.contrastText;
                    } else {
                        bg = theme.palette.warning.main;
                        fg = theme.palette.warning.contrastText;
                    }
                } else {
                    // Reset styling for Total/Registered Price
                    bg = 'transparent';
                    fg = theme.palette.text.primary;
                }

                return (
                    <Box
                        sx={{
                            backgroundColor: bg,
                            color: fg,
                            px: 0.5,
                            py: 0.25,
                            borderRadius: 1,
                            display: 'inline-block',
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

  return (
    <TableLayout>
      <Button
        variant="contained"
        sx={{ mb: 2 }}
        onClick={() => setAddExpenseDialogOpen(true)}
      >
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
