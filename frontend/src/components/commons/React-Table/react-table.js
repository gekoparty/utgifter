import React, { useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip, MenuItem } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
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
  layoutMode = "grid", // Default to "grid"
}) => {
  const columnsConfig = useMemo(() => columns, [columns]);

  return (
    <MaterialReactTable
      layoutMode={layoutMode}
      data-testid="material-react-table"
      columns={columnsConfig}
      data={data}
      initialState={{
        showColumnFilters: true,
        density: "compact",
        ...initialState,
      }}
      manualPagination
      manualSorting
      enablePagination
      enableColumnResizing
      enableRowActions
      enableStickyHeader
      enableStickyFooter
      muiTableHeadCellProps={{
        sx: (theme) => ({
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.grey[800]
              : theme.palette.grey[200],
          color:
            theme.palette.mode === "dark"
              ? theme.palette.common.white
              : theme.palette.common.black,
              minWidth: 80, // Apply minWidth here within sx
              maxWidth: 300, 
        }),
      }}
      muiTableBodyCellProps={{
        sx: (theme) => ({
          backgroundColor:
            theme.palette.mode === "dark"
              ? theme.palette.grey[900]
              : theme.palette.grey[200],
          color:
            theme.palette.mode === "dark"
              ? theme.palette.grey[300]
              : theme.palette.grey[800],
          minWidth: 80, // Apply minWidth here within sx
          maxWidth: 300, // Apply maxWidth here within sx
          
        }),
      }}
      localization={MRT_Localization_NO}
      positionActionsColumn="first"
      renderRowActionMenuItems={({ row }) => [
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
      ]}
      muiToolbarAlertBannerProps={
        isError
          ? {
              color: "error",
              children: "Error loading data",
            }
          : undefined
      }
      onColumnFiltersChange={setColumnFilters}
      onGlobalFilterChange={setGlobalFilter}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      renderTopToolbarCustomActions={() => (
        <Tooltip arrow title="Refresh Data">
          <IconButton
            onClick={() => refetch()}
            data-testid="refresh-data-button"
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      )}
      rowCount={meta.totalRowCount ?? 0}
      state={{
        columnFilters,
        globalFilter,
        isLoading,
        showAlertBanner: isError,
        showProgressBars: isFetching,
        sorting,
        pagination,
      }}
      renderDetailPanel={renderDetailPanel}
      sx={{
        display: "flex",
        flexDirection: "column",
        flexGrow: 1, // Ensures table takes all available space
        width: "100%", // Ensure the table takes up 100% width of its container
        "& table": {
          width: "100%", // Ensure the table itself fills its container
        },
      }}
    />
  );
};

const ReactTable = ({
  setDeleteModalOpen,
  setSelectedBrand,
  handleEdit,
  handleDelete,
  ...props
}) => (
  <Table
    data-testid="react-table"
    setSelectedBrand={setSelectedBrand}
    handleEdit={handleEdit}
    handleDelete={handleDelete}
    setDeleteModalOpen={setDeleteModalOpen}
    {...props}
  />
);

export default ReactTable;
