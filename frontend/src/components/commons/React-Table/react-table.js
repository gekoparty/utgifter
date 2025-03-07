import React, { useMemo, useCallback } from "react";
import { MaterialReactTable } from "material-react-table";
import { getTableStyles } from "./tableStyles"; // Import styles
import { IconButton, Tooltip, MenuItem } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useTheme } from "@mui/material/styles";
import { MRT_Localization_NO } from "material-react-table/locales/no";

const Table = ({
  data,
  columns,
  setColumnFilters,
  setGlobalFilter,
  setSorting,
  setPagination,
  refetch,
  isError,
  isLoading,
  isFetching,
  columnFilters,
  globalFilter,
  pagination,
  sorting,
  handleDelete,
  handleEdit,
  meta,
  initialState,
  renderDetailPanel,
  layoutMode = "table",
}) => {
  const columnsConfig = useMemo(() => columns, [columns]);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const {
    muiTableHeadCellStyles,
    muiTableBodyCellStyles,
    muiTopToolbarStyles,
    muiBottomToolbarStyles,
  } = useMemo(() => getTableStyles(theme, isDarkMode), [theme, isDarkMode]);

  const columnFilterState = useMemo(() => columnFilters, [columnFilters]);
  const globalFilterState = useMemo(() => globalFilter, [globalFilter]);
  const sortingState = useMemo(() => sorting, [sorting]);
  const paginationState = useMemo(() => pagination, [pagination]);

  const showAlertBanner = isError;
  const showProgressBars = isFetching;

  const tableState = useMemo(
    () => ({
      columnFilters: columnFilterState,
      globalFilter: globalFilterState,
      sorting: sortingState,
      pagination: paginationState,
      isLoading,
      showAlertBanner,
      showProgressBars,
    }),
    [
      columnFilterState,
      globalFilterState,
      sortingState,
      paginationState,
      isLoading,
      showAlertBanner,
      showProgressBars,
    ]
  );

  const initialTableState = useMemo(
    () => ({
      showColumnFilters: true,
      density: "compact",
      ...initialState,
    }),
    [initialState]
  );

  const handleRefresh = useCallback(() => {
    refetch({ stale: true });
  }, [refetch]);

  const renderRowActions = useCallback(
    ({ row }) => [
      <MenuItem
        key="edit"
        onClick={() => handleEdit(row.original)}
        data-testid="edit-menu-item"
      >
        Rediger
      </MenuItem>,
      <MenuItem
        key="delete"
        onClick={() => handleDelete(row.original)}
        data-testid="delete-menu-item"
      >
        Slett
      </MenuItem>,
    ],
    [handleEdit, handleDelete]
  );

  const renderTopToolbarActions = useCallback(
    () => (
      <Tooltip arrow title="Refresh Data">
        <IconButton
          onClick={handleRefresh}
          aria-label="Refresh data"
          data-testid="refresh-data-button"
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    ),
    [handleRefresh]
  );

  return (
    <MaterialReactTable
      layoutMode={layoutMode}
      data-testid="material-react-table"
      columns={columnsConfig}
      data={data}
      initialState={initialTableState}
      manualPagination
      manualSorting
      enableColumnSize
      enableRowActions
      enableStickyHeader
      enableStickyFooter
      manualFiltering
      muiTableHeadCellProps={{ sx: muiTableHeadCellStyles }}
      muiTableBodyCellProps={{ sx: muiTableBodyCellStyles }}
      localization={MRT_Localization_NO}
      positionActionsColumn="left"
      renderRowActionMenuItems={renderRowActions}
      muiToolbarAlertBannerProps={
        isError ? { color: "error", children: "Error loading data" } : undefined
      }
      onColumnFiltersChange={setColumnFilters}
      onGlobalFilterChange={setGlobalFilter}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      renderTopToolbarCustomActions={renderTopToolbarActions}
      rowCount={meta?.totalRowCount ?? 0}
      state={tableState}
      renderDetailPanel={renderDetailPanel}
      muiTopToolbarProps={{ sx: muiTopToolbarStyles }}
      muiBottomToolbarProps={{ sx: muiBottomToolbarStyles }}
    />
  );
};

const ReactTable = React.memo(
  ({ handleEdit, handleDelete, slotProps, ...props }) => (
    <Table
      data-testid="react-table"
      handleEdit={handleEdit}
      handleDelete={handleDelete}
      {...props}
    />
  )
);

export default ReactTable;

MaterialReactTable.whyDidYouRender = true;
