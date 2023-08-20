import React, { useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";


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
}) => {
  const cachedData = useMemo(() => {
    return data;
  }, [data]);

  

  const columnsConfig = useMemo(() => columns, [columns]);

  return (
    <MaterialReactTable
      columns={columnsConfig}
      data={cachedData}
      initialState={{ showColumnFilters: true }}
      manualFiltering
      manualPagination
      manualSorting
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
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      )}
      rowCount={data?.meta?.totalRowCount ?? 0}
      state={{
        columnFilters,
        globalFilter,
        isLoading,
        pagination,
        showAlertBanner: isError,
        showProgressBars: isFetching,
        sorting,
      }}
    />
  );
};

const ReactTable = ({
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
  sorting,
  pagination
}) => (
  <Table
    data={data}
    columns={columns}
    setColumnFilters={setColumnFilters}
    setGlobalFilter={setGlobalFilter}
    setSorting={setSorting}
    setPagination={setPagination}
    refetch={refetch}
    isError={isError}
    isLoading={isLoading}
    isFetching={isFetching}
    columnFilters={columnFilters} // Pass columnFilters as a prop
    globalFilter={globalFilter} // Pass globalFilter as a prop
    sorting={sorting} // Pass sorting as a prop
    pagination={pagination} // Pass pagination as a prop
  />
);

export default ReactTable;
