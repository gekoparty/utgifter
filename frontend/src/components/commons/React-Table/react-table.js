import React, { useMemo } from "react";
import { MaterialReactTable } from "material-react-table";
import { IconButton, Tooltip } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { MenuItem } from '@mui/material';
import { MRT_Localization_NO } from 'material-react-table/locales/no';


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
  meta
  
}) => {
  const columnsConfig = useMemo(() => columns, [columns]);

  //console.log("Table Data:", data); // Log the data received
  

  

  return (
    <MaterialReactTable
      columns={columnsConfig}
      data={data}
      initialState={{ showColumnFilters: true }}
      manualPagination
      manualSorting
      enablePagination
      enableColumnResizing
      enableRowActions
      localization={MRT_Localization_NO}
      positionActionsColumn="last"
      renderRowActionMenuItems={({ row }) => [
        <MenuItem key="edit" onClick={() => handleEdit(row.original)}>
          Rediger
        </MenuItem>,
        <MenuItem key="delete" onClick={() => handleDelete(row.original)}>
          Slett
        </MenuItem>,
      ]}
      //manualSorting
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
      rowCount={meta.totalRowCount ?? 0}
      state={{
        columnFilters,
        globalFilter,
        isLoading,
        showAlertBanner: isError,
        showProgressBars: isFetching,
        sorting,
        pagination
      }}
    />
  );
};



const ReactTable = ({ setDeleteModalOpen,setSelectedBrand, handleEdit,handleDelete, ...props }) => (
  <Table setSelectedBrand={setSelectedBrand}  
  handleEdit={handleEdit}  handleDelete={handleDelete} setDeleteModalOpen={setDeleteModalOpen} {...props} />
);

export default ReactTable;


