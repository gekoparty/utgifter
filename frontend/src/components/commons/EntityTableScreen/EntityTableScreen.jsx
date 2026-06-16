import React, {
  Suspense,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Box, Button, LinearProgress } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

import useSnackBar from "../../../hooks/useSnackBar";
import { usePaginatedData } from "../../../hooks/usePaginatedData";
import { useAppPreferences } from "../../../store/Store";
import PageHeader from "../Layout/PageHeader";
import ReactTable from "../React-Table/react-table";
import TableLayout from "../TableLayout/TableLayout";
import { buildPaginatedUrl } from "./buildPaginatedUrl";

const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };

const ACTION_LABELS = {
  ADD: "lagt til",
  EDIT: "oppdatert",
  DELETE: "slettet",
};

const EntityTableScreen = ({
  addButtonLabel,
  columns,
  description,
  DialogComponent,
  dialogRecordProp,
  endpoint,
  getData,
  getMeta,
  getPreviewLabel = (record) => record?.name ?? "",
  getRecordName = (record) => record?.name ?? "",
  IconComponent,
  initialSelectedRecord,
  initialSorting = [{ id: "name", desc: false }],
  loadDialog,
  loadingLabel,
  queryKey,
  resourceLabel,
  screenTitle,
  urlBuilder = buildPaginatedUrl,
}) => {
  const { preferences, setPreference } = useAppPreferences();
  const initialPageSize =
    Number(preferences.rowsPerPage) > 0
      ? Number(preferences.rowsPerPage)
      : INITIAL_PAGINATION.pageSize;

  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const [sorting, setSorting] = useState(initialSorting);
  const [pagination, setPagination] = useState(() => ({
    ...INITIAL_PAGINATION,
    pageSize: initialPageSize,
  }));
  const [activeModal, setActiveModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(initialSelectedRecord);

  const { showSnackbar } = useSnackBar();

  useEffect(() => {
    if (pagination.pageSize && pagination.pageSize !== preferences.rowsPerPage) {
      setPreference("rowsPerPage", pagination.pageSize);
    }
  }, [pagination.pageSize, preferences.rowsPerPage, setPreference]);

  const fetchParams = useMemo(
    () => ({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      filters: columnFilters,
      globalFilter: deferredGlobalFilter,
    }),
    [
      pagination.pageIndex,
      pagination.pageSize,
      sorting,
      columnFilters,
      deferredGlobalFilter,
    ],
  );

  const { data, error, isError, isFetching, isLoading, refetch } =
    usePaginatedData({
      endpoint,
      params: fetchParams,
      urlBuilder,
      baseQueryKey: queryKey,
    });

  const tableData = getData(data);
  const meta = getMeta(data);
  const totalRowCount = meta?.totalRowCount ?? meta?.total ?? tableData.length;
  const activeFilterCount =
    columnFilters.length + (deferredGlobalFilter ? 1 : 0);
  const pageNumber = pagination.pageIndex + 1;
  const previewItems = tableData
    .slice(0, 6)
    .map((record) => getPreviewLabel(record))
    .filter(Boolean);

  const summaryItems = [
    { label: "Totalt", value: totalRowCount },
    { label: "Viser", value: tableData.length },
    { label: "Filtre", value: activeFilterCount },
    { label: "Side", value: pageNumber },
  ];

  const preloadDialog = useCallback(() => {
    loadDialog();
  }, [loadDialog]);

  const openModal = useCallback(
    (mode, record = initialSelectedRecord) => {
      loadDialog();
      startTransition(() => {
        setSelectedRecord(record);
        setActiveModal(mode);
      });
    },
    [initialSelectedRecord, loadDialog],
  );

  const closeDialog = useCallback(() => {
    setActiveModal(null);
    setSelectedRecord(initialSelectedRecord);
  }, [initialSelectedRecord]);

  const handleSuccess = useCallback(
    (payload) => {
      const name = getRecordName(payload) || getRecordName(selectedRecord);
      showSnackbar(`${resourceLabel} "${name}" ble ${ACTION_LABELS[activeModal]}`);
      closeDialog();
    },
    [
      activeModal,
      closeDialog,
      getRecordName,
      resourceLabel,
      selectedRecord,
      showSnackbar,
    ],
  );

  const dialogProps = activeModal
    ? {
        open: true,
        mode: activeModal,
        [dialogRecordProp]: selectedRecord,
        onClose: closeDialog,
        onSuccess: handleSuccess,
        onError: () => showSnackbar("Kunne ikke utføre handling", "error"),
      }
    : null;

  return (
    <TableLayout>
      <PageHeader
        title={screenTitle ?? resourceLabel}
        subtitle={description}
        icon={IconComponent ? <IconComponent fontSize="small" /> : null}
        summaryItems={summaryItems}
        previewItems={previewItems}
        emptyPreviewText="Ingen treff ennå."
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onMouseEnter={preloadDialog}
            onFocus={preloadDialog}
            onClick={() => openModal("ADD")}
            sx={{ whiteSpace: "nowrap" }}
          >
            {addButtonLabel}
          </Button>
        }
      />

      {isLoading ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <LinearProgress sx={{ mb: 2, maxWidth: 400, mx: "auto" }} />
          {loadingLabel}
        </Box>
      ) : (
        <ReactTable
          data={tableData}
          columns={columns}
          meta={meta}
          error={error}
          isError={isError}
          isFetching={!activeModal && isFetching}
          isLoading={isLoading}
          refetch={refetch}
          columnFilters={columnFilters}
          globalFilter={globalFilter}
          sorting={sorting}
          pagination={pagination}
          setColumnFilters={setColumnFilters}
          setGlobalFilter={setGlobalFilter}
          setSorting={setSorting}
          setPagination={setPagination}
          handleEdit={(record) => openModal("EDIT", record)}
          handleDelete={(record) => openModal("DELETE", record)}
          resource={queryKey?.[0]}
        />
      )}

      <Suspense fallback={null}>
        {dialogProps ? <DialogComponent {...dialogProps} /> : null}
      </Suspense>
    </TableLayout>
  );
};

export default EntityTableScreen;
