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
  meta,
  initialState, // add this prop to accept initialState
  renderDetailPanel,  // Add this prop to render detail panels
  
}) => {
  const columnsConfig = useMemo(() => columns, [columns]);

  //console.log("Table Data:", data); // Log the data received
  

  

  return (
    <MaterialReactTable
   
      columns={columnsConfig}
      data={data}
      initialState={{
        showColumnFilters: true,
        ...initialState, // Use initialState if provided
      }}
      
      manualPagination
      manualSorting
      enablePagination
      enableColumnResizing
      enableRowActions
      enableStickyHeader // Enable sticky header
      enableStickyFooter // Enable sticky footer
      muiTableHeadCellProps={{
        sx: (theme) => ({
          backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.grey[800]
            : theme.palette.grey[200],
          color: theme.palette.mode === 'dark'
            ? theme.palette.common.white
            : theme.palette.common.black,
        }),
      }}
      muiTableBodyCellProps={{
        sx: (theme) => ({
          backgroundColor: theme.palette.mode === 'dark'
            ? theme.palette.grey[900]
            : theme.palette.grey[50],
          color: theme.palette.mode === 'dark'
            ? theme.palette.grey[300]
            : theme.palette.grey[800],
        }),
      }}
      localization={MRT_Localization_NO}
      positionActionsColumn="first"
      renderRowActionMenuItems={({ row }) => [
        <MenuItem key="edit" onClick={() => handleEdit(row.original)}>
          Rediger
        </MenuItem>,
        <MenuItem key="delete" onClick={() => handleDelete(row.original)}>
          Slett
        </MenuItem>,
      ]
    }
      
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
      renderDetailPanel={renderDetailPanel} 
    />
  );
};



const ReactTable = ({ setDeleteModalOpen,setSelectedBrand, handleEdit,handleDelete, ...props }) => (
  <Table setSelectedBrand={setSelectedBrand}  
  handleEdit={handleEdit}  handleDelete={handleDelete} setDeleteModalOpen={setDeleteModalOpen} {...props} />
);

export default ReactTable;


