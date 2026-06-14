// src/components/commons/React-Table/react-table.jsx
import React, { useMemo, useCallback } from "react";
import { MaterialReactTable } from "material-react-table";
import {
  IconButton,
  Tooltip,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { MRT_Localization_NO } from "material-react-table/locales/no";
import { useTheme } from "@mui/material/styles";
import { getTableStyles } from "./tableStyles";
import { getFriendlyErrorMessage } from "../ErrorHandling/errorMessages";
import { useAppPreferences } from "../../../store/Store";

const ACTIONS_COLUMN_ID = "mrt-row-actions";

const ReactTable = ({
  data,
  columns,
  columnFilters,
  globalFilter,
  sorting,
  pagination,
  meta,
  isError,
  error,
  isLoading,
  isFetching,

  setColumnFilters,
  setGlobalFilter,
  setSorting,
  setPagination,

  columnVisibility,
  setColumnVisibility,

  refetch,
  handleEdit,
  handleDelete,
  renderDetailPanel,
  resource,
}) => {
  const theme = useTheme();
  const { preferences, setPreference } = useAppPreferences();
  const tableStyles = useMemo(() => getTableStyles(theme), [theme]);
  const tableDensity = ["compact", "comfortable", "spacious"].includes(
    preferences.tableDensity,
  )
    ? preferences.tableDensity
    : "compact";

  const handleDensityChange = useCallback(
    (nextValue) => {
      const resolved =
        typeof nextValue === "function" ? nextValue(tableDensity) : nextValue;
      if (["compact", "comfortable", "spacious"].includes(resolved)) {
        setPreference("tableDensity", resolved);
      }
    },
    [setPreference, tableDensity],
  );

  const initialState = useMemo(
    () => ({
      showColumnFilters: false,
      columnPinning: {
        left: [ACTIONS_COLUMN_ID],
      },
    }),
    [],
  );

  const tableState = useMemo(
    () => ({
      columnFilters,
      globalFilter,
      sorting,
      pagination,
      density: tableDensity,
      columnPinning: {
        left: [ACTIONS_COLUMN_ID],
      },
      ...(columnVisibility ? { columnVisibility } : {}),

      isLoading,
      showAlertBanner: isError,
      showProgressBars: isFetching,
    }),
    [
      columnFilters,
      globalFilter,
      sorting,
      pagination,
      tableDensity,
      columnVisibility,
      isLoading,
      isError,
      isFetching,
    ],
  );

  const refreshButton = useCallback(
    () => (
      <Tooltip title="Oppdater">
        <IconButton
          onClick={refetch}
          aria-label="Oppdater tabell"
          sx={(t) => ({
            borderRadius: 2,
            border: "1px solid",
            borderColor:
              t.palette.mode === "dark"
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.10)",
          })}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    ),
    [refetch],
  );

  const renderRowActionMenuItems = useCallback(
    ({ row, closeMenu }) => [
      <MenuItem
        key="edit"
        onClick={() => {
          closeMenu?.();
          handleEdit?.(row.original);
        }}
      >
        <ListItemIcon>
          <EditOutlinedIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Rediger</ListItemText>
      </MenuItem>,
      <MenuItem
        key="delete"
        onClick={() => {
          closeMenu?.();
          handleDelete?.(row.original);
        }}
      >
        <ListItemIcon>
          <DeleteOutlineIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText>Slett</ListItemText>
      </MenuItem>,
    ],
    [handleEdit, handleDelete],
  );

  const rowCount = meta?.totalRowCount ?? meta?.total ?? 0;
  const errorMessage = getFriendlyErrorMessage(error, resource);

  return (
    <MaterialReactTable
      columns={columns}
      data={data}
      localization={MRT_Localization_NO}
      manualPagination
      manualSorting
      manualFiltering
      rowCount={rowCount}
      initialState={initialState}
      state={tableState}
      onColumnFiltersChange={setColumnFilters}
      onGlobalFilterChange={setGlobalFilter}
      onSortingChange={setSorting}
      onPaginationChange={setPagination}
      onDensityChange={handleDensityChange}
      onColumnVisibilityChange={setColumnVisibility}
      renderTopToolbarCustomActions={refreshButton}
      enableRowActions
      positionActionsColumn="first"
      renderRowActionMenuItems={renderRowActionMenuItems}
      renderDetailPanel={renderDetailPanel}
      enableColumnPinning
      enableColumnResizing={false}
      enableDensityToggle
      enableFullScreenToggle={false}
      enableHiding
      enableStickyHeader
      muiToolbarAlertBannerProps={
        isError
          ? {
              color: "error",
              children: errorMessage,
            }
          : undefined
      }
      displayColumnDefOptions={tableStyles.displayColumnDefOptions}
      muiTablePaperProps={tableStyles.muiTablePaperProps}
      muiTopToolbarProps={tableStyles.muiTopToolbarProps}
      muiBottomToolbarProps={tableStyles.muiBottomToolbarProps}
      muiTableHeadRowProps={tableStyles.muiTableHeadRowProps}
      muiTableHeadCellProps={tableStyles.muiTableHeadCellProps}
      muiTableBodyCellProps={tableStyles.muiTableBodyCellProps}
      muiTableBodyRowProps={tableStyles.muiTableBodyRowProps}
      muiTableContainerProps={tableStyles.muiTableContainerProps}
      muiSearchTextFieldProps={tableStyles.muiSearchTextFieldProps}
      muiFilterTextFieldProps={tableStyles.muiFilterTextFieldProps}
    />
  );
};

export default React.memo(ReactTable);
