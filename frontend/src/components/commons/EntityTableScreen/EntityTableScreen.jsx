import React, {
  Suspense,
  startTransition,
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  LinearProgress,
  Snackbar,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";

import useSnackBar from "../../../hooks/useSnackBar";
import { usePaginatedData } from "../../../hooks/usePaginatedData";
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
  DialogComponent,
  dialogRecordProp,
  endpoint,
  getData,
  getMeta,
  getRecordName = (record) => record?.name ?? "",
  initialSelectedRecord,
  initialSorting = [{ id: "name", desc: false }],
  loadDialog,
  loadingLabel,
  queryKey,
  resourceLabel,
  urlBuilder = buildPaginatedUrl,
}) => {
  const [columnFilters, setColumnFilters] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const deferredGlobalFilter = useDeferredValue(globalFilter);
  const [sorting, setSorting] = useState(initialSorting);
  const [pagination, setPagination] = useState(INITIAL_PAGINATION);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(initialSelectedRecord);

  const {
    snackbarOpen,
    snackbarMessage,
    snackbarSeverity,
    showSnackbar,
    handleSnackbarClose,
  } = useSnackBar();

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

  const { data, isError, isFetching, isLoading, refetch } = usePaginatedData({
    endpoint,
    params: fetchParams,
    urlBuilder,
    baseQueryKey: queryKey,
  });

  const tableData = getData(data);
  const meta = getMeta(data);

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
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onMouseEnter={preloadDialog}
          onFocus={preloadDialog}
          onClick={() => openModal("ADD")}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          {addButtonLabel}
        </Button>
      </Box>

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
        />
      )}

      <Suspense fallback={null}>
        {dialogProps && <DialogComponent {...dialogProps} />}
      </Suspense>

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
      >
        <Alert
          severity={snackbarSeverity}
          onClose={handleSnackbarClose}
          variant="filled"
          action={
            <IconButton
              size="small"
              color="inherit"
              onClick={handleSnackbarClose}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </TableLayout>
  );
};

export default EntityTableScreen;
