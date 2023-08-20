import React, { useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';

const Table = ({ columns, data}) => {
  console.log("Data received in Table component:", data);
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const cachedData = useMemo(() => {
    return data;
  }, [data]);


  /* const { data, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: [
      'table-data',
      columnFilters, //refetch when columnFilters changes
      globalFilter, //refetch when globalFilter changes
      pagination.pageIndex, //refetch when pagination.pageIndex changes
      pagination.pageSize, //refetch when pagination.pageSize changes
      sorting, //refetch when sorting changes
    ],
    queryFn: async () => {
      const fetchURL = new URL(
        '/api/data',
        process.env.NODE_ENV === 'production'
          ? 'https://www.material-react-table.com'
          : 'http://localhost:3000',
      );
      fetchURL.searchParams.set(
        'start',
        `${pagination.pageIndex * pagination.pageSize}`,
      );
      fetchURL.searchParams.set('size', `${pagination.pageSize}`);
      fetchURL.searchParams.set('filters', JSON.stringify(columnFilters ?? []));
      fetchURL.searchParams.set('globalFilter', globalFilter ?? '');
      fetchURL.searchParams.set('sorting', JSON.stringify(sorting ?? []));

      const response = await fetch(fetchURL.href);
      const json = await response.json();
      return json;
    },
    keepPreviousData: true,
  }); */

  const columnsConfig = useMemo(() => columns, [columns]);


  return (
    <MaterialReactTable
      columns={columnsConfig}
      data={cachedData}
      initialState={{ showColumnFilters: true }}
      manualFiltering
      manualPagination
      manualSorting
     /*  muiToolbarAlertBannerProps={
        isError
          ? {
              color: 'error',
              children: 'Error loading data',
            }
          : undefined
      } */
      onColumnFiltersChange={setColumnFilters}
      onGlobalFilterChange={setGlobalFilter}
      onPaginationChange={setPagination}
      onSortingChange={setSorting}
      /* renderTopToolbarCustomActions={() => (
        <Tooltip arrow title="Refresh Data">
          <IconButton onClick={() => refetch()}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      )} */
      //rowCount={data?.meta?.totalRowCount ?? 0}
      state={{
        columnFilters,
        globalFilter,
        //isLoading,
        pagination,
        //showAlertBanner: isError,
        //showProgressBars: isFetching,
        sorting,
      }}
    />
  );
};


const ReactTable = ({data, columns}) => (
  
  
  <Table data={data} columns={columns}/>

  
);

export default ReactTable;