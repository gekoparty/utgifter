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
import { useSearchParams } from "react-router-dom";

import useSnackBar from "../../../hooks/useSnackBar";
import { usePaginatedData } from "../../../hooks/usePaginatedData";
import { useAppPreferences } from "../../../store/Store";
import { useTranslation } from "../../../i18n/useTranslation";
import AppScreen from "../Layout/AppScreen";
import ReactTable from "../React-Table/react-table";
import TableLayout from "../TableLayout/TableLayout";
import { buildPaginatedUrl } from "./buildPaginatedUrl";

const INITIAL_PAGINATION = { pageIndex: 0, pageSize: 10 };

const ACTION_LABELS = {
  ADD: "added",
  EDIT: "updated",
  DELETE: "deleted",
};

const buildInitialFilters = (searchParams) => {
  const filterId = searchParams.get("filterId");
  const filterValue = searchParams.get("filterValue");
  return filterId && filterValue ? [{ id: filterId, value: filterValue }] : [];
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
  getRecordName = (record) => record?.name ?? "",
  IconComponent,
  initialSelectedRecord,
  initialSorting = [{ id: "name", desc: false }],
  loadDialog,
  loadingLabel,
  queryKey,
  resourceLabel,
  screenTitle,
  workflow,
  urlBuilder = buildPaginatedUrl,
}) => {
  const [searchParams] = useSearchParams();
  const { preferences, setPreference } = useAppPreferences();
  const { t } = useTranslation();
  const initialPageSize =
    Number(preferences.rowsPerPage) > 0
      ? Number(preferences.rowsPerPage)
      : INITIAL_PAGINATION.pageSize;

  const [columnFilters, setColumnFilters] = useState(() => buildInitialFilters(searchParams));
  const [globalFilter, setGlobalFilter] = useState(() => searchParams.get("q") || "");
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
    setColumnFilters(buildInitialFilters(searchParams));
    setGlobalFilter(searchParams.get("q") || "");
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }, [searchParams]);

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

  const summaryItems = [
    { label: t("common.total"), value: totalRowCount },
    { label: t("common.showing"), value: tableData.length },
    { label: t("common.filters"), value: activeFilterCount },
    { label: t("common.page"), value: pageNumber },
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
      showSnackbar(
        t("entity.savedMessage", {
          resource: resourceLabel,
          name,
          action: t(`entity.${ACTION_LABELS[activeModal]}`),
        }),
      );
      closeDialog();
    },
    [
      activeModal,
      closeDialog,
      getRecordName,
      resourceLabel,
      selectedRecord,
      showSnackbar,
      t,
    ],
  );

  const dialogProps = activeModal
    ? {
        open: true,
        mode: activeModal,
        [dialogRecordProp]: selectedRecord,
        onClose: closeDialog,
        onSuccess: handleSuccess,
        onError: () => showSnackbar(t("entity.actionFailed"), "error"),
      }
    : null;

  return (
    <AppScreen
      title={screenTitle ?? resourceLabel}
      subtitle={description}
      icon={IconComponent ? <IconComponent fontSize="small" /> : null}
      summaryItems={summaryItems}
      workflow={workflow}
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
      maxWidth={1360}
    >
      <TableLayout>
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
      </TableLayout>

      <Suspense fallback={null}>
        {dialogProps ? <DialogComponent {...dialogProps} /> : null}
      </Suspense>
    </AppScreen>
  );
};

export default EntityTableScreen;
