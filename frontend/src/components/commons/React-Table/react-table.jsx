import React, { useMemo, useCallback } from "react";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip, MenuItem } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { MRT_Localization_NO } from "material-react-table/locales/no";

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

  refetch,
  handleEdit,
  handleDelete,
  renderDetailPanel,
}) => {
  // ✅ Memoize initialState so it doesn't "feel" like it changes
  const initialState = useMemo(
    () => ({
      showColumnFilters: true,
      density: "compact",
    }),
    []
  );

  // ✅ Memoize MRT state object (reduces table recalcs)
  const tableState = useMemo(
    () => ({
      columnFilters,
      globalFilter,
      sorting,
      pagination,

      isLoading,
      showAlertBanner: isError,

      // If you want *no* progress bars during modal, do it outside (like you already do)
      showProgressBars: isFetching,
    }),
    [
      columnFilters,
      globalFilter,
      sorting,
      pagination,
      isLoading,
      isError,
      isFetching,
    ]
  );

  const refreshButton = useCallback(
    () => (
      <Tooltip title="Oppdater">
        <IconButton onClick={refetch}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    ),
    [refetch]
  );

  const renderRowActionMenuItems = useCallback(
    ({ row, closeMenu }) => [
      <MenuItem
        key="edit"
        onClick={() => {
          closeMenu?.();
          handleEdit(row.original);
        }}
      >
        Rediger
      </MenuItem>,
      <MenuItem
        key="delete"
        onClick={() => {
          closeMenu?.();
          handleDelete(row.original);
        }}
      >
        Slett
      </MenuItem>,
    ],
    [handleEdit, handleDelete]
  );

  const rowCount = meta?.totalRowCount ?? 0;

  return (
    <MaterialReactTable
      columns={columns}
      data={data}

      // ✅ Server-side
      manualPagination
      manualSorting
      manualFiltering

      // ✅ Don’t reapply initialState each render
      initialState={initialState}

      localization={MRT_Localization_NO}

      // ✅ Top toolbar
      renderTopToolbarCustomActions={refreshButton}

      // ✅ Row actions
      enableRowActions
      positionActionsColumn="left"
      renderRowActionMenuItems={renderRowActionMenuItems}

      // ✅ Detail panel
      renderDetailPanel={renderDetailPanel}

      // ✅ Controlled state
      state={tableState}

      // ✅ Controlled updaters (these should already be stable from useState)
      onColumnFiltersChange={setColumnFilters}
      onGlobalFilterChange={setGlobalFilter}
      onSortingChange={setSorting}
      onPaginationChange={setPagination}

      // ✅ Total rows
      rowCount={rowCount}

      // Optional: small perf helpers
      enableColumnResizing={false}
      enableDensityToggle={false}
      enableFullScreenToggle={false}
      enableHiding={true}
    />
  );
};

export default React.memo(ReactTable);
