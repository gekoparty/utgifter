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

  /** Refresh button */
  const refreshButton = useCallback(
    () => (
      <Tooltip title="Oppdater">
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    ),
    [refetch]
  );

  /** Row actions */
  const rowActions = useCallback(
    ({ row }) => [
      <MenuItem key="edit" onClick={() => handleEdit(row.original)}>
        Rediger
      </MenuItem>,
      <MenuItem key="delete" onClick={() => handleDelete(row.original)}>
        Slett
      </MenuItem>,
    ],
    [handleEdit, handleDelete]
  );

  return (
    <MaterialReactTable
      columns={columns}
      data={data}

      /** Manual server-side operations */
      manualPagination
      manualSorting
      manualFiltering

      /** Initial behavior */
      initialState={{
        showColumnFilters: true,
        density: "compact",
      }}

      /** Localization */
      localization={MRT_Localization_NO}

      /** Top toolbar */
      renderTopToolbarCustomActions={refreshButton}

      /** Row actions */
      enableRowActions
      positionActionsColumn="left"
      renderRowActionMenuItems={rowActions}

      /** Optional detail panel */
      renderDetailPanel={renderDetailPanel}

      /** Controlled state */
      state={{
        columnFilters,
        globalFilter,
        sorting,
        pagination,
        isLoading,
        showAlertBanner: isError,
        showProgressBars: isFetching,
      }}

      /** State updaters */
      onColumnFiltersChange={setColumnFilters}
      onGlobalFilterChange={setGlobalFilter}
      onSortingChange={setSorting}
      onPaginationChange={setPagination}

      /** Total count for pagination */
      rowCount={meta?.totalRowCount ?? 0}
    />
  );
};

export default React.memo(ReactTable);
