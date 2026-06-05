// src/components/commons/React-Table/react-table.jsx
import React, { useMemo, useCallback } from "react";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip, MenuItem } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { MRT_Localization_NO } from "material-react-table/locales/no";
import { useTheme } from "@mui/material/styles";
import { getTableStyles } from "./tableStyles";

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
  isLoading,
  isFetching,

  setColumnFilters,
  setGlobalFilter,
  setSorting,
  setPagination,

  // ✅ NEW
  columnVisibility,
  setColumnVisibility,

  refetch,
  handleEdit,
  handleDelete,
  renderDetailPanel,
}) => {
  const theme = useTheme();
  const tableStyles = useMemo(() => getTableStyles(theme), [theme]);

  const initialState = useMemo(
    () => ({
      showColumnFilters: true,
      density: "compact",
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
      columnPinning: {
        left: [ACTIONS_COLUMN_ID],
      },

      // ✅ NEW: controlled column visibility (only if provided)
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
        Rediger
      </MenuItem>,
      <MenuItem
        key="delete"
        onClick={() => {
          closeMenu?.();
          handleDelete?.(row.original);
        }}
      >
        Slett
      </MenuItem>,
    ],
    [handleEdit, handleDelete],
  );

  const rowCount = meta?.totalRowCount ?? meta?.total ?? 0;

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
      // ✅ NEW: allow show/hide changes to persist in parent state
      onColumnVisibilityChange={setColumnVisibility}
      renderTopToolbarCustomActions={refreshButton}
      enableRowActions
      positionActionsColumn="first"
      renderRowActionMenuItems={renderRowActionMenuItems}
      renderDetailPanel={renderDetailPanel}
      enableColumnPinning
      enableColumnResizing={false}
      enableDensityToggle={false}
      enableFullScreenToggle={false}
      enableHiding
      enableStickyHeader
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
