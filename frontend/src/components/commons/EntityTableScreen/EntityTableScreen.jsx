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
  Chip,
  IconButton,
  LinearProgress,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
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
      <Box
        sx={(theme) => ({
          mb: 2,
          p: { xs: 2, md: 2.5 },
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.14,
          )}, ${alpha(theme.palette.background.paper, 0.56)} 62%)`,
        })}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "flex-start" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            {IconComponent ? (
              <Box
                sx={(theme) => ({
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                  width: 44,
                  height: 44,
                  borderRadius: 1.5,
                  color: "primary.contrastText",
                  bgcolor: "primary.main",
                  boxShadow: `0 10px 28px ${alpha(
                    theme.palette.primary.main,
                    0.26,
                  )}`,
                })}
              >
                <IconComponent fontSize="small" />
              </Box>
            ) : null}

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {screenTitle ?? resourceLabel}
              </Typography>
              {description ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.75, maxWidth: 720 }}
                >
                  {description}
                </Typography>
              ) : null}
            </Box>
          </Stack>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onMouseEnter={preloadDialog}
            onFocus={preloadDialog}
            onClick={() => openModal("ADD")}
            sx={{
              alignSelf: { xs: "stretch", md: "flex-start" },
              whiteSpace: "nowrap",
            }}
          >
            {addButtonLabel}
          </Button>
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 2 }}
        >
          {summaryItems.map((item) => (
            <Chip
              key={item.label}
              label={`${item.label}: ${item.value}`}
              variant={item.value ? "filled" : "outlined"}
              sx={{
                borderRadius: 1.5,
                fontWeight: 700,
                bgcolor: item.value ? "action.selected" : "transparent",
              }}
            />
          ))}
        </Stack>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          sx={{ mt: 1.5 }}
        >
          {previewItems.length ? (
            previewItems.map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                variant="outlined"
                sx={{ maxWidth: 240 }}
              />
            ))
          ) : (
            <Typography variant="body2" color="text.secondary">
              Ingen treff ennå.
            </Typography>
          )}
        </Stack>
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
