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
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Memoized Styles
  const {
    muiTableHeadCellStyles,
    muiTableBodyCellStyles,
    muiTopToolbarStyles,
    muiBottomToolbarStyles,
  } = useMemo(() => getTableStyles(theme, isDarkMode), [theme, isDarkMode]);

  // Memoized States (prevents unnecessary re-renders)
  const columnsConfig = useMemo(() => columns, [columns]);
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

  // Memoized Handlers
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
  ({ handleEdit, handleDelete, ...props }) => (
    <Table handleEdit={handleEdit} handleDelete={handleDelete} {...props} />
  ),
  (prevProps, nextProps) => {
    // Avoid re-renders if props haven't changed
    return (
      prevProps.data?.length === nextProps.data?.length &&
      prevProps.columns === nextProps.columns &&
      prevProps.setColumnFilters === nextProps.setColumnFilters &&
      prevProps.setGlobalFilter === nextProps.setGlobalFilter &&
      prevProps.setSorting === nextProps.setSorting &&
      prevProps.setPagination === nextProps.setPagination &&
      prevProps.refetch === nextProps.refetch &&
      prevProps.isError === nextProps.isError &&
      prevProps.isLoading === nextProps.isLoading &&
      prevProps.isFetching === nextProps.isFetching &&
      prevProps.columnFilters === nextProps.columnFilters &&
      prevProps.globalFilter === nextProps.globalFilter &&
      prevProps.pagination === nextProps.pagination &&
      prevProps.sorting === nextProps.sorting &&
      prevProps.meta === nextProps.meta &&
      prevProps.initialState === nextProps.initialState &&
      prevProps.renderDetailPanel === nextProps.renderDetailPanel
    );
  }
);

export default ReactTable;

MaterialReactTable.whyDidYouRender = true;
