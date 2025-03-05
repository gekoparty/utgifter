import React, { useMemo, useCallback } from "react";
import { MaterialReactTable } from "material-react-table";
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
  const columnsConfig = useMemo(() => [...columns], [columns]);
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  const muiTableHeadCellStyles = useMemo(
    () => ({
      backgroundColor: isDarkMode ? theme.palette.grey[800] : theme.palette.grey[200],
      color: isDarkMode ? theme.palette.common.white : theme.palette.common.black,
      minWidth: 80,
      maxWidth: 300,
    }),
    [isDarkMode, theme]
  );

  const muiTableBodyCellStyles = useMemo(
    () => ({
      backgroundColor: isDarkMode ? theme.palette.grey[900] : theme.palette.grey[200],
      color: isDarkMode ? theme.palette.grey[300] : theme.palette.grey[800],
      minWidth: 80,
      maxWidth: 300,
    }),
    [isDarkMode, theme]
  );

  const muiTopToolbarStyles = useMemo(
    () => ({
      backgroundColor: isDarkMode ? theme.palette.grey[800] : "#e0e0e0",
      color: isDarkMode ? theme.palette.common.white : "#333",
      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
    }),
    [isDarkMode, theme]
  );

  const muiBottomToolbarStyles = useMemo(
    () => ({
      backgroundColor: isDarkMode ? theme.palette.grey[800] : "#e0e0e0",
      color: isDarkMode ? theme.palette.common.white : "#333",
      boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.1)",
    }),
    [isDarkMode, theme]
  );

  const tableState = useMemo(
    () => ({
      columnFilters,
      globalFilter,
      isLoading,
      showAlertBanner: isError,
      showProgressBars: isFetching,
      sorting,
      pagination,
    }),
    [columnFilters, globalFilter, isLoading, isError, isFetching, sorting, pagination]
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
      <MenuItem key="edit" onClick={() => handleEdit(row.original)} data-testid="edit-menu-item">
        Rediger
      </MenuItem>,
      <MenuItem key="delete" onClick={() => handleDelete(row.original)} data-testid="delete-menu-item">
        Slett
      </MenuItem>,
    ],
    [handleEdit, handleDelete]
  );

  const renderTopToolbarActions = useCallback(
    () => (
      <Tooltip arrow title="Refresh Data">
        <IconButton onClick={handleRefresh} data-testid="refresh-data-button">
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
        isError
          ? { color: "error", children: "Error loading data" }
          : undefined
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
  ({ setDeleteModalOpen, setSelectedBrand, handleEdit, handleDelete, slotProps, ...props }) => (
    <Table
      data-testid="react-table"
      setSelectedBrand={setSelectedBrand}
      handleEdit={handleEdit}
      handleDelete={handleDelete}
      setDeleteModalOpen={setDeleteModalOpen}
      {...props}
    />
  )
);

export default ReactTable;

MaterialReactTable.whyDidYouRender = true