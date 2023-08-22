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
  setSelectedBrand,
  setEditModalOpen,
  setDeleteModalOpen,
  
}) => {
  const cachedData = useMemo(() => {
    return data.brands;
  }, [data]);

    const handleEditBrand = (brand) => {
      console.log("Clicked Edit with row:", brand.original); 
      setSelectedBrand(brand.original);
      setEditModalOpen(true);
      
    };

    const handleDeleteBrand = (brand) => {
      setSelectedBrand(brand.original);
      setDeleteModalOpen(true);
    }

  console.log("Data:", data);
  console.log("Columns:", columns);
  console.log("Column Filters:", columnFilters);
  console.log("Global Filter:", globalFilter);
  console.log("Sorting:", sorting);
  console.log("Pagination:", pagination);

  

  const columnsConfig = useMemo(() => columns, [columns]);

  return (
    <MaterialReactTable
      columns={columnsConfig}
      data={cachedData}
      initialState={{ showColumnFilters: true }}
      manualFiltering
      manualPagination
      manualSorting
      enablePagination
      enableColumnResizing
      enableRowActions
      localization={MRT_Localization_NO}
      positionActionsColumn="last"
      renderRowActionMenuItems={({ row }) => [
        <MenuItem key="edit" onClick={() => handleEditBrand(row)}>
          Edit
        </MenuItem>,
        <MenuItem key="delete" onClick={() => handleDeleteBrand(row)}>
          Delete
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
      rowCount={data?.meta?.totalRowCount ?? 0}
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



const ReactTable = ({ setDeleteModalOpen, setSelectedBrand, editModalOpen, setEditModalOpen, ...props }) => (
  <Table setSelectedBrand={setSelectedBrand} editModalOpen={editModalOpen}
  setEditModalOpen={setEditModalOpen} setDeleteModalOpen={setDeleteModalOpen} {...props} />
);

export default ReactTable;


